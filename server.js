const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db");
const eventRoutes = require("./routes/event");
const PORT = process.env.PORT || 5000;
require("dotenv").config();

const app = express();

connectDB();

app.use(bodyParser.json());
app.use(cors());

app.use("/api/events", eventRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
