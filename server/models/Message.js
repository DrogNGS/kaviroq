const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  roomId:     { type: String, required: true },
  senderId:   { type: String, required: true },
  senderName: { type: String, required: true },
  content:    { type: String, required: true },
  read:       { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);