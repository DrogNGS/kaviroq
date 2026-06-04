const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  description: { type: String },
  available:   { type: Boolean, default: true },
  category:    { type: String },
});

const BusinessSchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name:        { type: String, required: true },
  category:    { type: String },
  description: { type: String },
  address:     { type: String },
  phone:       { type: String },
  location: {
    type:        { type: String, default: "Point" },
    coordinates: [Number]
  },
  menu:    [ProductSchema],
  isOpen:  { type: Boolean, default: true }
}, { timestamps: true });

BusinessSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("Business", BusinessSchema);
