const express = require("express");
const port = 3002;
const app = express();
const axios = require("axios");
const uniqid = require("uniqid");
const sha256 = require("sha256");
const crypto = require("crypto");

// Testing Purpose
const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHENT_ID = "PGTESTPAYUAT86";
const SALT_INDEX = 1;
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";

app.get("/", (req, res) => {
  res.send("PhonePe app is working");
});

app.get("/pay", (_req, res) => {
  const payEndPoint = "/pg/v1/pay";
  const merchantTransactionId = uniqid();
  const userID = 123;

  const payload = {
    merchantId: MERCHENT_ID,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: userID,
    amount: 10000, //amount in paise
    redirectUrl: `http://localhost:3002/redirect-url/${merchantTransactionId}`,
    redirectMode: "REDIRECT",
    // "callbackUrl": "https://webhook.site/callback-url",
    mobileNumber: "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
  const base64EncodedPayload = bufferObj.toString("base64");

  //   SHA256(base64 encoded payload + “/pg/v1/pay” + salt key) + ### + salt index
  const hash = sha256(base64EncodedPayload + payEndPoint + SALT_KEY);
  const xVerify = `${hash}###${SALT_INDEX}`;
  const options = {
    method: "post",
    url: `${PHONE_PE_HOST_URL}${payEndPoint}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
    },
    data: {
      request: base64EncodedPayload,
    },
  };
  axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
      const url = response.data.data.instrumentResponse.redirectInfo.url;
      res.redirect(url);
      //   res.send(response.data);
    })
    .catch(function (error) {
      console.error(error);
    });
});

app.get("/redirect-url/:merchantTransactionId", (req, res) => {
  const { merchantTransactionId } = req.params;
  console.log("merchantTransactionId", merchantTransactionId);
  if (merchantTransactionId) {
    // SHA256(“/pg/v1/status/{merchantId}/{merchantTransactionId}” + saltKey) + “###” + saltIndex
    const xVerify = sha256(`/pg/v1/status/${MERCHENT_ID}/${merchantTransactionId}` + SALT_KEY) + "###" + SALT_INDEX
    
    const options = {
      method: "get",
      url: `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHENT_ID}/${merchantTransactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-MERCHANT-ID":merchantTransactionId,
        "X-VERIFY": xVerify
      },
    };
    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        if(response.data.code === 'PAYMENT_SUCCESS'){
            // redirect the user to fronted success page
        }
        else if(response.data.code === "PAYMENT_ERROR"){
            // redirect the user to frontend error page 
        }
        else{
            // pending page
        }
        res.send(response.data);
      })
      .catch(function (error) {
        console.error(error);
      });
    // res.send({ merchantTransactionId });
  } else {
    res.send({ error: "Error" });
  }
});

app.get("/Subscription", (_req, res) => {
    const merchantSubscriptionId = uniqid();
    const merchantUserId = "123";
  
    const payload = {
      merchantId: MERCHENT_ID,
      merchantSubscriptionId: merchantSubscriptionId,
      merchantUserId: merchantUserId,
      authWorkflowType: "PENNY_DROP",
      amountType: "FIXED",
      amount: 13900, //amount in paise
      frequency: "DAILY",
      recurringCount: 30,
      mobileNumber: "9999999999",
    };
  
    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base64EncodedPayload = bufferObj.toString("base64");
  
    //   SHA256(base64 encoded payload + “/pg/v1/pay” + salt key) + ### + salt index
    const hash = sha256( base64EncodedPayload + "/v3/recurring/subscription/create" + SALT_KEY );
    const xVerify = `${hash}###${SALT_INDEX}`;
  
    const options = {
      method: "post",
      url: "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/recurring/subscription/create",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      data: {
        request: base64EncodedPayload,
      },
    };
    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        console.error(error.response?.data || error.message);
      });
});

app.get("/subscription-status", (req, res) => {
    const MERCHANT_SUBSCRIPTION_ID  = req.query.merchantTransactionId;
  
    const path = `/v3/recurring/subscription/status/${MERCHENT_ID}/${MERCHANT_SUBSCRIPTION_ID}`;
    const hashInput = path + SALT_KEY;
    const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
    const xVerify = `${hash}###${SALT_INDEX}`;
  
    // Axios GET Request
    const options = {
      method: "get",
      url: `https://api-preprod.phonepe.com/apis/pg-sandbox${path}`,
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
    };
  
    axios
      .request(options)
      .then((response) => {
        console.log("Subscription Status:", response.data);
      })
      .catch((error) => {
        console.error(
          "Error fetching subscription status:",
          error.response?.data || error.message
        );
      });
});

app.get("/fetch-all-subscription", (req, res) => {
    const MERCHANT_USER_ID = "";
    const url = `https://api-preprod.phonepe.com/apis/pg-sandbox/v3/recurring/subscription/user/${MERCHENT_ID}/${MERCHANT_USER_ID}/all`;
  
    // Create the X-VERIFY hash
    const hash = crypto
      .createHash("sha256")
      .update(
        `/v3/recurring/subscription/user/${MERCHENT_ID}/${MERCHANT_USER_ID}/all${SALT_KEY}`
      )
      .digest("hex");
    const xVerify = `${hash}###${SALT_INDEX}`;
  
    // Axios GET request options
    const options = {
      method: "get",
      url: url,
      headers: {
        accept: "application/json", // Specify that we expect a JSON response
        "Content-Type": "application/json", // Define the content type
        "X-VERIFY": xVerify, // Add the generated X-VERIFY header
      },
    };
  
    axios
      .request(options)
      .then(function (response) {
        console.log("Subscriptions:", response.data);
      })
      .catch(function (error) {
        console.error(
          "Error fetching subscriptions:",
          error.response?.data || error.message
        );
      });
});
  






app.listen(port, () => {
  console.log(`App started listening on port ${port}`);
});
