const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
require("./firebase-admin");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);
app.use(express.json());
app.use(cors());

app.use("/api/auth",       require("./routes/auth"));
app.use("/api/businesses", require("./routes/business"));
app.use("/api/orders",     require("./routes/order"));
app.use("/api/upload",     require("./routes/upload"));
app.use("/api/messages",   require("./routes/message"));

app.get("/", (req, res) => res.send("Kaviroq API fonctionne"));

io.on("connection", (socket) => {
  console.log("Utilisateur connecte:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("send_message", async (data) => {
    try {
      const message = await Message.create({
        roomId:     data.roomId,
        senderId:   data.sender,
        senderName: data.senderName,
        content:    data.text,
      });
      io.to(data.roomId).emit("receive_message", {
        id:         message._id,
        sender:     message.senderId,
        senderName: message.senderName,
        text:       message.content,
        timestamp:  message.createdAt,
      });
    } catch (err) {
      console.error("Erreur message:", err);
    }
  });

  socket.on("join_order", ({ orderId }) => {
    socket.join("order:" + orderId);
  });

  socket.on("location_update", ({ orderId, lat, lng }) => {
    io.to("order:" + orderId).emit("location_update", { lat, lng });
  });

  socket.on("update_status", ({ orderId, status }) => {
    io.to("order:" + orderId).emit("order_status", { status });
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur deconnecte:", socket.id);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecte"))
  .catch((err) => console.log(err));

server.listen(5000, () => console.log("Serveur lance sur le port 5000"));