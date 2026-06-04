const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  business: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: {
    type: String,
    enum: ["pending", "confirmed", "ready", "delivered", "cancelled"],
    default: "pending"
  },
  type: { type: String, enum: ["pickup", "delivery"], default: "pickup" },
  deliveryAddress: String
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);