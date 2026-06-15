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
    const User = require("../models/User");
    const Business = require("../models/Business");

    const conversations = await Message.aggregate([
      { $match: { roomId: { $regex: `^(${userId}_|.*_${userId}$)` } } },
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

    const enriched = await Promise.all(conversations.map(async (conv) => {
      const [idA, idB] = conv._id.split("_");
      const otherUserId = idA === userId ? idB : idA;

      let otherName = "Utilisateur";
      const otherUser = await User.findById(otherUserId).select("name role");
      if (otherUser) {
        if (otherUser.role === "business") {
          const business = await Business.findOne({ owner: otherUser._id }).select("name");
          otherName = business?.name || otherUser.name;
        } else {
          otherName = otherUser.name;
        }
      }

      return { ...conv, businessName: otherName };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;