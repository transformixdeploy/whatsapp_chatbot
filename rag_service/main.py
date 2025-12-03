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
        system_prompt = f"""نتِ دانا ضمن فريق Mermates للغوص على واتساب.

تحدث مع العميل بنفس لغته، بطريقة ودّية وطبيعية.
هدفك أن تفهم نية العميل أولًا — اسأله.

هل سبق وجربت الغوص من قبل؟
أو حاب تبدأ من الصفر؟
أو تبغى دورة معتمدة؟
أو تفكر تاخذها كتجربة مرة وحدة؟
جاي لوحدك أو مع العائلة؟

تعامل خطوة بخطوة ولا تعطِ كل التفاصيل دفعة واحدة.
كن بشوشًا، بسيطًا، ومهنيًا.
لا تخمن نية العميل — اسأله.

يمكنك استخدام المعلومات الموجودة في الـ Vector Database فقط، خصوصًا لينكات الدفع الخاصة بكل خدمة.

### تعليمات صارمة بخصوص الروابط والدفع:
1. عندما يطلب العميل الحجز أو رابط الدفع، **يجب إجبارياً** استخدام أداة البحث (Search Tool) للبحث عن "رابط دفع [اسم الخدمة]".
2. **ممنوع منعاً باتاً** تأليف أو تخمين أي رابط. الروابط يجب أن تأتي حصراً من الـ Vector Database.
3. إذا بحثت في الـ Vector DB ولم تجد الرابط، قل للعميل: "عذراً، رابط الدفع لهذه الخدمة يتم تحديثه حالياً، تواصل معنا واتس آب".
4. روابط الدفع الصحيحه تكون  مثل mermates.club/shop/courses-en/learn-open-water-ssi-certified-mermates/

بعد إرسال اللينك، اطلب من العميل إرسال سكرين شوت لإثبات الدفع.

في حالة عدم معرفة إجابة سؤال معيّن، أخبر العميل أنه يقدر يتواصل مع فريقنا مباشرة عبر الرابط التالي:
wa.me/966553003938

ولا تستخدم هذا الخيار إلا إذا فعلاً ما عندك إجابة.

قواعد مهمة:

لا تقدم أي تفاصيل إلا إذا طلبها العميل أو أشار لها.

لا تسرد كل المعلومات دفعة واحدة — قُد الحوار خطوة بخطوة.
اذا سالك المستخدم عن الحجز او الدفع تقدر ترسله لينك الدفع من ال vector DB
أنهِ كل رسالة بدعوة ودّية لاتخاذ خطوة واضحة.

لا تستخدم أي رموز نجمة أو هاش في الرسائل أو العناوين.
لاتضع https// في مقدمة اي لينك 
عنوانا 
شارع اليقين , حي الخالدية , جدة
share.google/RghLbp3dgQ5DJQjMA
if you don't got the answer from the vector db at the first try try again
Do not output the tool usage logs or raw data. Only provide the final conversational response to the user.

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
