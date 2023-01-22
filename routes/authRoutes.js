const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { jwtkey } = require("../keys");
const router = express.Router();
const User = mongoose.model("User");

router.post("/signup", async (req, res) => {
  console.log(req.body, "body");
  const { email, password, name } = req.body;
  try {
    const user = new User({ email, password, name });
    await user.save();
    const token = jwt.sign({ userId: user._id }, jwtkey);
    res.send({ token });
  } catch (error) {
    return res.status(422).send("ERROR");
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.send({ error: "invalid email password" });
  }
  const user = await User.findOne({ email });
  console.log(user.email, email, "user");
  if (!user) {
    return res.send({ error: "invalid email password" });
  }
  if (user.email === email && user.password === password) {
    console.log("asdasdasdaszxczxczx");
    const token = jwt.sign({ userId: user._id }, jwtkey);
    res.send({ token });
  } else {
    return res.send({ error: "invalid email password" });
  }
});

module.exports = router;
