const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
require("./firebase-admin");
const User = require("./models/User");

async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title,
        body,
        data,
      }),
    });
  } catch (err) {
    console.error("Erreur envoi push notification:", err);
  }
}

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

    // Trouver le destinataire (l'autre participant du roomId "idA_idB")
    const [idA, idB] = data.roomId.split("_");
    const recipientId = idA === data.sender ? idB : idA;

    const recipient = await User.findById(recipientId).select("pushToken");
    if (recipient?.pushToken) {
      await sendPushNotification(
        recipient.pushToken,
        data.senderName || "Nouveau message",
        data.text,
        { roomId: data.roomId }
      );
    }
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