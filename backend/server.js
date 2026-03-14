const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing!");
  process.exit(1);
}

const translateRoutes = require("./routes/translate");
const detailRoutes = require("./routes/details");
const idiomRoutes = require("./routes/idiom");

const app = express();

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

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
