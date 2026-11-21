const path = require("path");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
// Resolved from this file, so the server finds backend/.env whatever directory it's started from
require("dotenv").config({ path: path.join(__dirname, ".env") });

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing!");
  process.exit(1);
}

const translateRoutes = require("./routes/translate");
const detailRoutes = require("./routes/details");
const idiomRoutes = require("./routes/idiom");

const app = express();

// Deployed behind one reverse proxy (Coolify/Render): trust its X-Forwarded-For so
// rate limiting sees each client's IP instead of the proxy's (one shared bucket).
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));

// For the hosting platform's health checks; outside /api so it isn't rate limited
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:5500,http://127.0.0.1:5500"
)
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "10kb" }));

app.use("/api/translate", translateRoutes);
app.use("/api/details", detailRoutes);
app.use("/api/idiom", idiomRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const status = err.status || err.statusCode || 500;
  console.error("Unhandled error:", err.message);
  res
    .status(status)
    .json({ error: err.expose ? err.message : "Internal server error" });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
