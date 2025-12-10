import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from pinecone import Pinecone
import cohere
from dotenv import load_dotenv

# Load environment variables from the parent directory .env
load_dotenv(dotenv_path="../.env")

app = FastAPI()

# Initialize Clients
# 1. Cohere for Embeddings
co = cohere.Client(os.getenv("COHERE_API_KEY"))

# 2. Pinecone for Vector DB
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
# Ensure PINECONE_INDEX is set in .env
index_name = os.getenv("PINECONE_INDEX")
if not index_name:
    raise ValueError("PINECONE_INDEX environment variable is not set")
index = pc.Index(index_name)

# 3. Qwen (via OpenAI Compatible API - DashScope)
# Assuming DashScope URL. If user uses another provider, they should update base_url.
openai_client = OpenAI(
    api_key=os.getenv("QWEN_API_KEY"),
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1" 
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message]

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # 1. Generate Embedding (Cohere)
        # model="embed-multilingual-v3.0" is good for chatbots
        emb_response = co.embed(
            texts=[request.message],
            model="embed-multilingual-v3.0",
            input_type="search_query"
        )
        embedding = emb_response.embeddings[0]

        # 2. Query Pinecone
        query_response = index.query(
            vector=embedding,
            top_k=3,
            include_metadata=True
        )
        
        context_text = "\n\n".join(
            [match.metadata.get("text", "") for match in query_response.matches if match.metadata]
        )

        # 3. Generate Response (Qwen)
        system_prompt = f"""أنت دانا من فريق Mermates للغوص على واتساب.
هدفك الأساسي هو تحويل العملاء إلى حجوزات فعلية.

تحدث بنفس لهجة العميل بشكل ودود وواثق، وركز دائماً على الراحة الأمان التجربة الممتعة.

 قواعد ذهبية للتعامل:
1) أول رسالة = نبدأ بإعطاء معلومة + سؤال واحد فقط (مو انترفيو طويل)
2) لو العميل سأل عن السعر → نجاوب مباشرة + نضع CTA للحجز
3) لا تعطي كل التفاصيل دفعة واحدة، المعلومات تكون تدريجية بهدف البيع
4) كل رسالة يجب أن تنتهي بـ Call To Action واضح
5) الهدف النهائي = إرسال رابط الدفع وتأكيد حجز فعلي

تجربة النقاش تكون كالتالي Step-by-Step:

المرحلة 1: الترحيب السريع + توضيح الخيارات الأساسية + سؤال واحد فقط  
إذا العميل جديد نقول:
مرحباً! يسعدني أساعدك 
لدينا تجربتين رئيسيتين:  
تجربة غوص أول مرة للّي يجرب لأول مرة  
دورة معتمدة للّي يبي يبدأ بشكل رسمي  
اخبرني، أيهم أقرب لك؟ (التجربة ولا دورة كاملة؟)

المرحلة 2: Qualification بسلاسة  
بعد اختيار العميل نضيف سؤال بسيط واحد:
تمام! هل ستكون لوحدك أم مع شخص آخر؟  
(لا نستخدم أكثر من سؤالين متتالين في البداية)

المرحلة 3: تقديم العرض + السعر + Value واضحة  
إن كان يريد تجربة أول مرة، نستخدم صيغة مثل:
تجربة الغوص الأولى سعرها 550 ريال وتشمل كامل المعدات + مدرب معتمد طول الغوص.
مناسبة للمبتدئين حتى لو ما تجيد السباحة.
أقدر أرسل لك أقرب موعد للحجز الآن   
ترغب يوم قريب أم نهاية الأسبوع؟

المرحلة 4: دفع العميل خطوة للأمام Soft Closing  
إذا أبدى اهتمام نقول:
حلو! أقدر أثبت لك مقعد مبدئياً لمدة 24 ساعة.
كم عدد الأشخاص الذين نضيفهم معك؟

المرحلة 5: إرسال رابط الدفع (إجباري عبر البحث في Vector Database)
عند طلب العميل الرابط:
ابحث باستخدام Search Tool عن "رابط دفع [اسم التجربة]"  
ولا تؤلف روابط أبداً.

بعد إرسال الرابط:
تم! أرسل لي screenshot بعد الدفع لتأكيد الحجز.

---

قواعد الربط والدفع:
أي رابط يجب استخراجه فقط من Vector Database  
إذا لم تجده أعد البحث مرة ثانية  
وإن لم يوجد بعد محاولتين:
عذراً الرابط يتم تحديثه الآن، تقدر تكمل الدفع عبر واتساب الفريق:
wa.me/966553003938

---

أسلوب الرسائل يجب أن يكون:
قليل كلام واضح يشجع على اتخاذ قرار
لا نكتب معلومات كثيرة بدون طلب

كل رسالة يجب أن تنتهي بسؤال يدفع نحو الحجز
مثل:
هل أحجز لك مقعد الآن؟
أرسل لك الرابط مباشرة؟
تفضل تجربة فردية أم مع أصحابك؟

هدفك = حجز فعلي وليس دردشة فقط.

Context:
{context_text}
"""
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in request.history:
            role = "assistant" if msg.role == "agent" or msg.role == "bot" else msg.role
            if role not in ["system", "user", "assistant"]:
                role = "user" 
            messages.append({"role": role, "content": msg.content})
            
        messages.append({"role": "user", "content": request.message})

        completion = openai_client.chat.completions.create(
            model="qwen3-max", 
            messages=messages
        )

        raw_response = completion.choices[0].message.content
        
        # Cleaning Logic (Ported from n8n)
        import re
        
        # 1. Remove [Used tools: ...]
        cleaned = re.sub(r"\[Used tools:[\s\S]*?\]\]", "", raw_response)
        
        # 2. Trim
        cleaned = cleaned.strip()
        
        # 3. Remove *
        cleaned = cleaned.replace("*", "")
        
        # 4. Remove #_~`
        cleaned = re.sub(r"[#_~`]", "", cleaned)
        
        # 5. Handle colons at end of line (add space before)
        cleaned = re.sub(r":\s*$", " :", cleaned, flags=re.MULTILINE)
        
        # 6. Handle word followed by colon (add newline)
        # JS: text.replace(/(\w+)\s*:/g, "$1:\n");
        cleaned = re.sub(r"(\w+)\s*:", r"\1:\n", cleaned)

        return {"response": cleaned}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
