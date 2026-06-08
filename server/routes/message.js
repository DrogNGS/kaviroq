const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

// Historique d'une conversation
router.get("/:roomId", auth, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marquer messages comme lus
router.put("/:roomId/read", auth, async (req, res) => {
  try {
    await Message.updateMany(
      { roomId: req.params.roomId, senderId: { $ne: req.user.id } },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liste des conversations d'un utilisateur
router.get("/conversations/list", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Message.aggregate([
      { $match: { roomId: { $regex: userId } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$content" },
          lastMessageAt: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$read", false] },
                  { $ne: ["$senderId", userId] }
                ]},
                1, 0
              ]
            }
          }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;