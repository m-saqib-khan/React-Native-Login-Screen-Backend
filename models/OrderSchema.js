const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    // username: { type: String, required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    orderID: { type: String, required: true, unique: true },
    customerID: { type: String, required: true },
    paymentIntent: { type: String, required: true },
    status: { type: String, required: true },
    securityDeposit: { type: Number, required: true },
    userId: { type: String },
    tip: { type: Number,default:0 }
  }, {
    timestamps: true,
  })
  module.exports= mongoose.model("Order", orderSchema);