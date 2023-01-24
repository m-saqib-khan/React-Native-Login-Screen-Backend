
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { jwtkey } = require("../keys");
const router = express.Router();
const User = require("../models/UserSchema")





router.post("/payment-sheet", async (req, res) => {
  let orderID = uuidv4();
  try {
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


       paymentIntent = await stripe.paymentIntents.create({
        amount:  req.body.item.price,
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual',
         customer: customer.id,
        transfer_group: orderID,
        automatic_payment_methods: {
            enabled: true,
          },
         setup_future_usage: "off_session", // off_session , on_session , ""
      });


    } else {
      customer = await Stripe.customers.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
      });
  
      paymentIntent = await stripe.paymentIntents.create({
        amount:  req.body.item.price,
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual',
         customer: customer.id,
        transfer_group: orderID,
        automatic_payment_methods: {
            enabled: true,
          },
         setup_future_usage: "off_session", // off_session , on_session , ""
      });
    }

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
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customerID: customer.id,
      orderID,
      publishableKey:
        "pk_test_51L03C8C28HUvnWbWeK51fhEx6fGXK1vLSFos0KPMOBYn1xNRZsM4OsVZnazO0k2fYQKEjmFOa1P5Tz2qLKLVGBPn00c6D6yvbf",
    });
  }
  catch (er) {
    res.json(er)
  }
});

router.post("/captured",async (req,res)=>{
try{
    const {amount,paymentIntent}=req.body
    const intent = await stripe.paymentIntents.capture(paymentIntent, {
        amount_to_capture: amount,
      })
      res.json({success:true,msg:"caputured amount successfully",intent})

}catch(e){
    res.json({success:false,err:e})
}


})
