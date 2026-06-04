const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  category: { type: String },
  description: String,
  address: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]
  },
  menu: [{
    name: String,
    price: Number,
    description: String,
    available: { type: Boolean, default: true }
  }],
  isOpen: { type: Boolean, default: true }
}, { timestamps: true });

BusinessSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Business", BusinessSchema);