import { openai } from './openai'
import { pinecone, indexName } from './pinecone'
import { prisma } from './prisma'

export async function generateEmbedding(text: string) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    })
    return response.data[0].embedding
}

export async function queryVectorStore(embedding: number[]) {
    const index = pinecone.index(indexName)
    const queryResponse = await index.query({
        vector: embedding,
        topK: 3,
        includeMetadata: true,
    })
    return queryResponse.matches.map((match) => match.metadata?.text as string).filter(Boolean)
}

export async function getChatResponse(message: string, conversationId: string) {
    // 1. Generate embedding
    const embedding = await generateEmbedding(message)

    // 2. Retrieve context
    const context = await queryVectorStore(embedding)

    // 3. Retrieve conversation history (Memory)
    const history = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 5, // Context window length from user request
    })

    // Reverse history to chronological order
    const formattedHistory = history.reverse().map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
    }))

    // 4. Generate response
    const systemPrompt = `You are a helpful customer service assistant. Use the following context to answer the user's question. If the answer is not in the context, say you don't know.
  
  Context:
  ${context.join('\n\n')}
  `

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            ...formattedHistory as any,
            { role: 'user', content: message }
        ],
    })

    return completion.choices[0].message.content
}
