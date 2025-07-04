const express = require("express");
const cors = require("cors");
require("dotenv").config();

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing!");
  process.exit(1);
}

const translateRoutes = require("./routes/translate");
const detailRoutes = require("./routes/details");
const idiomRoutes = require("./routes/idiom");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/translate", translateRoutes);
app.use("/api/details", detailRoutes);
app.use("/api/idiom", idiomRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
