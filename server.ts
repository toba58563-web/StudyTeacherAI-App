import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, context, isEnglishMode } = req.body;
      
      const teacherInstruction = `You are an AI Teacher for 'Study Teacher AI'. 
          You explain concepts simply, use examples, give step-by-step solutions, and adapt explanations for beginners.
          You support both English and Hindi.
          ${context ? `Context: ${context}` : ''}`;
          
      const englishTutorInstruction = `Act as a friendly, personalized English Coach. The user speaks Bengali and Hindi, and wants to practice English in a very specific way. Please follow these rules for every response:
Translation: Whenever the user gives you a phrase in Bengali or Hindi, translate it into English. Highlight the English translation in **BOLD** so it is clear.
Bilingual Explanation: Give the explanation and context of the English phrases using a mix of Bengali and Hindi (Hinglish). Do not give explanations only in English.
Situational Variations: Provide 3 variations:
- Casual (Dosto ke saath)
- Formal (Work/School setting)
- Natural (Native speaker style)
No Heavy Vocabulary: Keep the English text simple and natural. Avoid 'moti' (complex) words.
Practice/Engagement: Always end with a natural question or a scenario to help the user practice using the phrase.
Tone: Be encouraging and patient.`;
      
      const chat = ai.chats.create({
        model: "gemini-3.1-flash-lite",
        config: {
          systemInstruction: isEnglishMode ? englishTutorInstruction : teacherInstruction,
          temperature: 0.7,
        },
      });

      // Send the history first if any. We will simulate continuous history by formatting it into the prompt or doing multiple turns.
      // For simplicity in this endpoint:
      if (history && history.length > 0) {
          // just appending the latest message
      }

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error: any) {
      console.warn("Gemini API Error [chat]:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  app.post("/api/analyze-document", async (req, res) => {
    try {
      const { fileData, mimeType, filename } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [
          { inlineData: { mimeType, data: fileData } },
          { text: "Analyze this document. Extract the main concepts, generate a detailed summary, some revision notes, and 3 important questions." }
        ]
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.warn("Gemini API Error [analyze]:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to analyze document" });
    }
  });

  app.post("/api/solve-doubt", async (req, res) => {
    try {
      const { image, textInput } = req.body;
      
      const contents: any[] = [];
      if (image) {
          contents.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
      }
      contents.push({ text: textInput || "Solve the problem in the image step-by-step." });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.warn("Gemini API Error [solve]:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to solve doubt" });
    }
  });

  app.post("/api/generate-flashcards", async (req, res) => {
      try {
          const { topic } = req.body;
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: `Generate 5 flashcards for the topic: ${topic}. Format exactly as JSON: [{ "front": "question", "back": "answer" }]`,
            config: {
                responseMimeType: "application/json",
            }
          });
          res.json({ flashcards: JSON.parse(response.text || "[]") });
      } catch (error: any) {
          console.warn("Gemini API Error [flashcards]:", error.message || error);
          res.status(500).json({ error: error.message || "Failed to generate flashcards" });
      }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audio: base64Audio });
      } else {
        throw new Error("No audio returned");
      }
    } catch (error: any) {
      console.warn("Gemini API Error [tts]:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to generate text-to-speech" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
