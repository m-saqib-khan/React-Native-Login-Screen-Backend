
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { jwtkey } = require("../keys");
const router = express.Router();
const User = require("../models/UserSchema")
const Order = require("../models/OrderSchema")
const {
  v4: uuidv4,
} = require('uuid');
const { json } = require("body-parser");
const Stripe = require("stripe")(process.env.PRIVATE_KEY);


router.post("/get-payment-intend", async (req, res) => {
  console.log("reach")
  let orderID = uuidv4();
  // try {
    let customerDetail = {}
    // Use an existing Customer ID if this is a returning customer.
    let customer = {};
    let paymentMethods = {};
    let paymentIntent = {};

    if (req.body.customer_id != undefined || req.body.customer_id != null) {
      customer = { id: req.body.customer_id };
      customerDetail = await Stripe.customers.retrieve(customer.id)

      paymentMethods = await Stripe.paymentMethods.list({
        customer: req.body.customer_id,
        type: "card",
      });

    //   paymentIntent = await Stripe.paymentIntents.create({
    //     amount: req.body.item.price,
    //     currency: "usd",
    //     customer: customer.id,
    //     setup_future_usage: "off_session", // off_session , on_session , ""
    //     automatic_payment_methods: {
    //       enabled: true,
    //     },
    //     transfer_group: orderID
    //   });


       paymentIntent = await Stripe.paymentIntents.create({
        amount:  req.body.item.price,
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual',
         customer: customer.id,
        transfer_group: orderID,
        // automatic_payment_methods: {
        //     enabled: true,
        //   },
         setup_future_usage: "off_session", // off_session , on_session , ""
      });


    } else {
      customer = await Stripe.customers.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
      });
  
      paymentIntent = await Stripe.paymentIntents.create({
        amount:  req.body.item.price,
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual',
         customer: customer.id,
        transfer_group: orderID,
        // automatic_payment_methods: {
        //     enabled: true,
        //   },
         setup_future_usage: "off_session", // off_session , on_session , ""
      });
    }


    console.log("MZK",paymentIntent)
    const ephemeralKey = await Stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2020-08-27" }
    );
    res.json({
      customerDetail: {
        email: customerDetail.email,
        name: customerDetail.name,
        phone: customerDetail.phone,
      },
      paymentIntent: paymentIntent.id,
      paymentIntentClientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customerID: customer.id,
      orderID,
      publishableKey:
        "pk_test_51L03C8C28HUvnWbWeK51fhEx6fGXK1vLSFos0KPMOBYn1xNRZsM4OsVZnazO0k2fYQKEjmFOa1P5Tz2qLKLVGBPn00c6D6yvbf",
    });
  // }
  // catch (er) {
  //   res.json(er)
  // }
});

router.post("/captured",async (req,res)=>{
// try{
    const {amount,paymentIntent,orderID,tip}=req.body
    const intent = await Stripe.paymentIntents.capture(paymentIntent, {
        amount_to_capture: ((parseInt(amount)+parseInt(tip))*100),
      })
      const result = await Order.findOneAndUpdate({orderID:orderID},{status:"Captured",tip})

      res.json({success:true,msg:"caputured amount successfully",paymentIntent})

// }catch(e){
//     res.json({success:false,err:e})
// }


})


router.post("/add-order", async (req, res) => {
try{
  let { title, amount, orderID, customerID,paymentIntent,securityDeposit} = req.body;

  const order = new Order({
    title: title,
    amount: amount,
    securityDeposit:securityDeposit,
    orderID: orderID,
    customerID: customerID,
    paymentIntent:paymentIntent,
    status: "Uncaptured"
  });

  await order.save();

  res.json({ success:true,message: "ORDER/PAYMENT SAVED TO DB" })
}catch(err){
  res.json({success:false,err})
}})


router.get("/get-order", async (req, res) => {
  try{
    const data = await Order.find({})
    res.json({ success:true,data})
  }catch(err){
    res.json({success:false,err})
  }
})


module.exports=router