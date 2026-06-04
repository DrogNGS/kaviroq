const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  description: { type: String },
  available:   { type: Boolean, default: true },
  category:    { type: String }, // ex: "Chambre", "Plat", "Boisson", "Service"...
  specs:       { type: Map, of: String }, // spécifications libres: capacite, superficie, etc.
});

const BusinessSchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name:        { type: String, required: true },
  category:    { type: String }, // restaurant, hotel, patisserie, salon, commerce, cafe
  description: { type: String },
  address:     { type: String },
  phone:       { type: String },
  location: {
    type:        { type: String, default: "Point" },
    coordinates: [Number]
  },
  menu:    [ProductSchema], // on garde "menu" pour la compatibilité mais c'est le catalogue
  isOpen:  { type: Boolean, default: true }
}, { timestamps: true });

BusinessSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("Business", BusinessSchema);
