const router = require("express").Router();
const Order = require("../models/Order");
const Business = require("../models/Business");
const authMiddleware = require("../middleware/auth");

// Créer une commande — émet new_order via socket
router.post("/", authMiddleware, async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, client: req.user.id });
    const populated = await order.populate("client", "name email");

    // Notifier l'entreprise en temps réel
    const io = req.app.get("io");
    if (io) {
      io.emit("new_order", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mes commandes (client)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ client: req.user.id }).populate("business", "name");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mettre à jour le statut (entreprise)
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // Notifier via socket
    const io = req.app.get("io");
    if (io) {
      io.emit("order_status_updated", { orderId: order._id, status: order.status });
      io.to(`order:${order._id}`).emit("order_status", { status: order.status });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Commandes reçues par l'entreprise
router.get("/business", authMiddleware, async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user.id });
    const businessIds = businesses.map((b) => b._id);
    const orders = await Order.find({ business: { $in: businessIds } })
      .populate("client", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
