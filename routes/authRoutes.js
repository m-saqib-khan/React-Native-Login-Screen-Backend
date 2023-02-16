const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { jwtkey } = require("../keys");
const router = express.Router();
const User = require("../models/UserSchema");

router.post("/merchant-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email, password }).exec();
    res.json({ approved: user !== null ? true : false });
  } catch (e) {
    res.json({ approved: false });
  }
});

router.post("/signup", async (req, res) => {
  console.log(req.body, "body");
  const { email, password, name } = req.body;
  try {
    const user = new User({ email, password, name });
    await user.save();
    const token = jwt.sign({ userId: user._id }, jwtkey);
    res.send({ succes: true, token, id: user._id });
  } catch (error) {
    return res.json({ succes: false, msg: "ERROR", error });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.send({ succes: false, error: "invalid email password" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.send({ succes: false, error: "invalid email password" });
    }
    if (user.email === email && user.password === password) {
      console.log("asdasdasdaszxczxczx");
      const token = jwt.sign({ userId: user._id }, jwtkey);
      res.send({ succes: true, token, id: user._id });
    } else {
      return res.send({ succes: false, error: "invalid email password" });
    }
  } catch (e) {
    res.json({ succes: false, err: e });
  }
});

module.exports = router;
