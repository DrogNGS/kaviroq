const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Rendre io accessible dans les routes via req.app.get("io")
app.set("io", io);

app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/businesses", require("./routes/business"));
app.use("/api/orders",    require("./routes/order"));
app.use("/api/upload",    require("./routes/upload")); // ✅ Route upload Cloudinary

app.get("/", (req, res) => res.send("Kaviroq API fonctionne"));

// Socket.io
io.on("connection", (socket) => {
  console.log("Utilisateur connecté:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("send_message", (data) => {
    io.to(data.roomId).emit("receive_message", data);
  });

  socket.on("join_order", ({ orderId }) => {
    socket.join(`order:${orderId}`);
  });

  socket.on("location_update", ({ orderId, lat, lng }) => {
    io.to(`order:${orderId}`).emit("location_update", { lat, lng });
  });

  socket.on("update_status", ({ orderId, status }) => {
    io.to(`order:${orderId}`).emit("order_status", { status });
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté:", socket.id);
  });
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.log(err));

server.listen(5000, () => console.log("Serveur lancé sur le port 5000"));
