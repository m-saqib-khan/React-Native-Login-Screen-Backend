const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { jwtkey } = require("../keys");
const router = express.Router();
const User = require("../models/UserSchema");
const Order = require("../models/OrderSchema");
const { v4: uuidv4 } = require("uuid");
const { json } = require("body-parser");
const Stripe = require("stripe")(process.env.PRIVATE_KEY);

router.get("/get-all-orders", async (_req, res) => {
  let data = await Order.find({});
  res.json({ data: data });
});

router.get("/split-payments", async (_req, res) => {
  try {
    Order.find({}, (err, orders) => {
      if (err) {
        res.json({ message: "Some Error Occured" });
      } else {
        orders?.map(async (order) => {
          if (order.status === "Completed") {
            await Stripe.transfers.create({
              amount: order.amount * 100 * 0.95,
              currency: "usd",
              destination: "acct_1L0lnf2HzMXSpTXS",
              transfer_group: order.orderID,
            });

            // Create a second Transfer to another connected account:
            await Stripe.transfers.create({
              amount: order.amount * 100 * 0.05,
              currency: "usd",
              destination: "acct_1L0pBs2HaF1T2SEc",
              transfer_group: order.orderID,
            });
            await Order.findOneAndUpdate(
              { orderID: order.orderID },
              { status: "Splitted" }
            );
          }
        });
        res.json({ message: "Payments Splitted Successfully" });
      }
    });
  } catch (e) {
    console.log(e);
    res.json({ message: "Some Error Occured" });
  }
});

router.get("/all-accounts", async (_req, res) => {
  try {
    const accounts = await Stripe.accounts.list({ limit: 100 });
    res.json({ accounts });
  } catch (e) {
    console.log(e);
    res.json({ error: { ...e } });
  }
});

router.post("/create-account", async (req, res) => {
  let {
    AccountEmail,
    AccountCountry,
    companyName,
    companyPhone,
    companyWebsite,
    companyCategory,
    companyAddressCountry,
    companyAddressLine1,
    companyAddressState,
    companyAddressCity,
    companyAddressPostalCode,
    individualFName,
    individualLName,
    individualEmail,
    individualIDNo,
    individualDOB,
    individualPhone,
    individualAddressCountry,
    individualAddressLine1,
    individualAddressState,
    individualAddressCity,
    individualAddressPostalCode,
    bankHolderName,
    bankCountry,
    bankCurrency,
    bankRoutingNumber,
    bankAccountNumber,
  } = req.body;

  console.log(req.body);

  let ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "59.103.140.56";
  let current_date = Math.floor(new Date().getTime() / 1000);
  let dob = individualDOB.split("-");
  let ssn_last_4 = individualIDNo.slice(-4);

  try {
    const account = await Stripe.accounts.create({
      type: "custom",
      country: AccountCountry,
      email: AccountEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",

      company: {
        address: {
          line1: companyAddressLine1,
          state: companyAddressState,
          city: companyAddressCity,
          postal_code: companyAddressPostalCode,
          country: companyAddressCountry,
        },
        name: companyName,
        phone: `+${companyPhone}`,
        owners_provided: true,
      },

      individual: {
        address: {
          line1: individualAddressLine1,
          state: individualAddressState,
          city: individualAddressCity,
          postal_code: individualAddressPostalCode,
          country: individualAddressCountry,
        },
        registered_address: {
          line1: individualAddressLine1,
          state: individualAddressState,
          city: individualAddressCity,
          postal_code: individualAddressPostalCode,
          country: individualAddressCountry,
        },
        first_name: individualFName,
        last_name: individualLName,
        phone: `+${individualPhone}`,
        email: individualEmail,
        id_number: individualIDNo,
        ssn_last_4,
        dob: { year: dob[0], day: dob[1], month: dob[2] },
      },

      external_account: {
        object: "bank_account",
        country: bankCountry,
        currency: bankCurrency,
        account_holder_name: bankHolderName,
        routing_number: bankRoutingNumber,
        account_number: bankAccountNumber,
      },

      business_profile: {
        url: companyWebsite,
        mcc: "7372",
        support_address: {
          line1: companyAddressLine1,
          state: companyAddressState,
          city: companyAddressCity,
          postal_code: companyAddressPostalCode,
          country: companyAddressCountry,
        },
      },

      tos_acceptance: { date: current_date, ip: "59.103.140.56" },
    });
    res.json({ account: account });
  } catch (e) {
    console.log(e?.raw);
    res.json({ error: { ...e } });
  }
});

router.post("/verify-account", async (req, res) => {
  let { acc, base64Img } = req.body;
  let data_url = base64Img.split("base64,")[1];

  let fp = Buffer.from(data_url, "base64");

  let file = await Stripe.files.create({
    purpose: "account_requirement",
    file: {
      data: fp,
      name: "file.png",
      type: "application.octet-stream",
    },
  });

  try {
    const account = await Stripe.accounts.update(acc, {
      documents: { bank_account_ownership_verification: { files: [file.id] } },
    });
    res.json({ account });
  } catch (e) {
    res.json({ error: e });
  }
});

module.exports = router;
