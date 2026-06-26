const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Inscription
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email déjà utilisé" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Utilisateur introuvable" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Synchronisation Firebase
router.post("/firebase-sync", async (req, res) => {
  try {
    const { uid, email, name, role, idToken } = req.body;

    const admin = require("firebase-admin");
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== uid) {
      return res.status(401).json({ message: "Token invalide" });
    }

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) user = await User.findOne({ email });
    if (!user) {
      const hashed = await bcrypt.hash(uid, 10);
      user = await User.create({
        name,
        email,
        password: hashed,
        role: role || "client",
        firebaseUid: uid,
      });
    }

    if (!user.firebaseUid) {
      user.firebaseUid = uid;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Firebase sync error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Obtenir le profil
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    let business = null;
    if (user.role === "business") {
      const Business = require("../models/Business");
      business = await Business.findOne({ owner: user._id });
    }

    res.json({ ...user.toObject(), business });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Modifier le profil
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;