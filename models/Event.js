const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  participants: [String],
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  sessionNotes: String,
  googleEventId: String,
  userId: { type: String, required: true },
});

module.exports = mongoose.model("Event", eventSchema);
