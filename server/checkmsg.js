require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("./models/Message");
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const msgs = await Message.find().sort({ createdAt: -1 }).limit(5);
  console.log(JSON.stringify(msgs, null, 2));
  process.exit();
});
