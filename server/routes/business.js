const router = require("express").Router();
const Business = require("../models/Business");
const authMiddleware = require("../middleware/auth");

router.get("/nearby", async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;
    const businesses = await Business.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const business = await Business.create({ ...req.body, owner: req.user.id });
    res.status(201).json(business);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user.id });
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const businesses = await Business.find(filter).limit(20);
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    res.json(business);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true }
    );
    if (!business) return res.status(404).json({ message: "Entreprise introuvable" });
    if (req.body.isOpen !== undefined) {
      const io = req.app.get("io");
      if (io) {
        io.emit("business_status_changed", {
          businessId: business._id,
          isOpen: business.isOpen,
          name: business.name,
        });
      }
    }
    res.json(business);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
