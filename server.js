// server.js
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // insira aqui sua chave no .env
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

// checagens básicas
if (!GEMINI_API_KEY) {
  console.error("🛑 GEMINI_API_KEY não encontrada. Defina GEMINI_API_KEY no .env");
  process.exit(1);
}

const app = express();

// middlewares de segurança
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// CORS configurável (adicione origens permitidas no .env, ou deixe vazio para permitir todas — não recomendado)
const corsOptions = ALLOWED_ORIGINS.length ? {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl / server-to-server
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error("Origin not allowed"));
  }
} : { origin: true };

app.use(cors(corsOptions));

// rate limiting básico para evitar abuso
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requisições por IP por minuto (ajuste conforme necessário)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// rota health
app.get("/health", (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "development" }));

/**
 * POST /api/gemini
 * body: { prompt: string }
 * Retorna: objeto JSON com a resposta gerada
 */
app.post("/api/gemini", async (req, res) => {
  try {
    const prompt = (req.body?.prompt || "").toString().trim();
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    // montar payload conforme usado no front; aqui usamos o mesmo formato: contents -> parts -> text
    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      // opcional: timeout manual via AbortController se desejar
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("Erro Gemini:", r.status, text);
      return res.status(502).json({ error: "Erro na API Gemini", status: r.status, detail: text });
    }

    const data = await r.json();

    // caminho seguro para extrair texto — depende do retorno da API
    const resposta = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || data?.output?.[0]?.content?.[0]?.text
      || JSON.stringify(data);

    res.json({ ok: true, raw: data, text: resposta });
  } catch (err) {
    console.error("Erro no /api/gemini:", err);
    res.status(500).json({ error: "internal_server_error", detail: err?.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 UniTV backend rodando em http://localhost:${PORT}`);
});
