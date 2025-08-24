// server.js - ExpressJS Backend Alternative
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/models", (req,res)=>res.json({
  openai: ["gpt-4o-mini"], anthropic: [], gemini: []
}));

app.post("/chat/:session_id/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages, model="gpt-4o-mini" } = req.body;
    const stream = await openai.chat.completions.create({
      model, messages, stream: true, max_tokens: Number(process.env.MAX_OUTPUT_TOKENS || 1024)
    });
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
  } finally {
    res.end();
  }
});

app.listen(8000, ()=>console.log("Server on :8000"));
