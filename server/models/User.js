const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["client", "business", "admin"], default: "client" },
  firebaseUid: { type: String, sparse: true },
  avatar: { type: String },
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]
  }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);