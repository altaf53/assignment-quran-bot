import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import OpenAI from "openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { VectorDBQAChain } from "langchain/chains";

export default async function handler(req, res) {
  try {
    // Check if the request method is POST
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    const client = new PineconeClient();
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });

    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPEN_API_KEY,
        temperature: 0,
      }),
      { pineconeIndex }
    );

    const results = await vectorStore.similaritySearch(req.body.query, 3);

    const contexts = results.map((embedding) => embedding.pageContent);

    console.log("contexts", contexts);

    const openai = new OpenAI({
      apiKey: process.env.OPEN_API_KEY,
    });

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "The AI tries to be helpful, polite, honest, sophisticated, emotionally aware, and humble-but-knowledgeable.  The assistant is happy to help with almost anything, and will do its best to understand exactly what is needed.  It also tries to avoid giving false or misleading information, and it caveats when it isn’t entirely sure about the right answer.  That said, the assistant is practical and really does its best, and doesn’t let caution get too much in the way of being useful.",
          // "You are an islamic scholar who has knowledge of quran answer the query from the context provided and if the context is not enough to answer the query politely decline answering it. No misinformation should be given as religion is a very sensitive topic.",
        },
        { role: "user", content: req.body.query },
      ],
      model: "gpt-3.5-turbo",
    });

    res.status(200).json({
      text: chatCompletion.choices[0].message.content,
      results,
      chatCompletion,
    }); // Send response back as JSON
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: error.toString() }); // Send the error message back as JSON
  }
}
