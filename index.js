const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const PORT = 9000;
const { mongoURL } = require("./keys");

require("./models/UserSchema");

const authRoutes = require("./routes/authRoutes");
const requireAuth = require("./routes/middleware/requireAuth");

app.use(bodyParser.json());

app.use(authRoutes);

mongoose.connect(mongoURL);

mongoose.connection.on("connected", () => {
  console.log("connect with Mongo");
});

mongoose.connection.on("error", (err) => {
  console.log("connection error", err);
});

app.use("/payment", require("./routes/payment"));

app.use("/merchant", require("./routes/merchant"));

app.get("/", requireAuth, (req, res) => {
  res.send("tour email" + req.user.email);
});

app.listen(PORT, () => {
  console.log("server running" + PORT);
});
