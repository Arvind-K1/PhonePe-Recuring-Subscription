const User = require("../models/user.model");

const axios = require("axios");
const uniqid = require("uniqid");
const sha256 = require("sha256");
const crypto = require("crypto");

const {
  MERCHENT_ID,
  SALT_KEY,
  SALT_INDEX,
  CALLBACK_URL,
  CALLBACK_RECURRING_URL,
  CALLBACK_cancel_subscription,
  create_user_subscription_url,
  user_subscription_status_url,
  fetch_all_subscriptions_url,
  submit_auth_request_url,
  auth_request_status_url,
  recurring_INIT_url,
  recurring_debit_execute_url,
  recurring_debit_execute_status_url,
  cancel_subscription_url,
} = require("../utils/phonepe.url");

function generateXVerify(base64Payload, apiPath) {
  const hashInput = base64Payload + apiPath + SALT_KEY;
  const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
  return `${hash}###${SALT_INDEX}`;
}

const create_user_subscription = async (req, res) => {
  try {
    const { userName, merchantUserId, authRequestId, amount, mobileNumber } =
      req.body;

    if (
      !userName ||
      !merchantUserId ||
      !authRequestId ||
      !amount ||
      !mobileNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const merchantSubscriptionId = uniqid();

    const payload = {
      merchantId: MERCHENT_ID,
      merchantSubscriptionId: merchantSubscriptionId,
      merchantUserId: merchantUserId,
      authWorkflowType: "PENNY_DROP",
      amountType: "FIXED",
      amount: amount, //amount in paise
      frequency: "DAILY",
      recurringCount: 30,
      mobileNumber: mobileNumber,
    };

    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base64EncodedPayload = bufferObj.toString("base64");

    //   SHA256(base64 encoded payload + “/pg/v1/pay” + salt key) + ### + salt index
    const hash = sha256(
      base64EncodedPayload + "/v3/recurring/subscription/create" + SALT_KEY
    );
    const xVerify = `${hash}###${SALT_INDEX}`;

    const options = {
      method: "post",
      url: create_user_subscription_url,
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

        const user = User.create({
          userName,
          merchantUserId,
          merchantSubscriptionId,
          subscriptionId: response.data.data.subscriptionId,
          authRequestId,
          amount,
          mobileNumber,
        });

        if (!user) {
          return res.status(400).json({
            success: false,
            message: "user creation failed",
          });
        }
        console.log(user);
        

        return res.status(200).json({
          success: true,
          message: "User created Sucessfully",
          data: user,
        });
      })
      .catch(function (error) {
        console.error(error.response?.data || error.message);
      });
  } catch (error) {
    return res.status(400).json({
      error: error,
    });
  }
};

const user_subscription_status = async (req, res) => {
  try {
    const { userName } = req.query;

    if (!userName) {
      return res.status(400).json({
        success: false,
        message: "userName is required",
      });
    }

    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const merchantSubscriptionId = user.merchantSubscriptionId;

    const path = `/v3/recurring/subscription/status/${MERCHENT_ID}/${merchantSubscriptionId}`;

    const hashInput = path + SALT_KEY;
    const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
    const xVerify = `${hash}###${SALT_INDEX}`;

    // Axios GET Request
    const options = {
      method: "get",
      url: `${user_subscription_status_url}${path}`,
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
    };

    axios
      .request(options)
      .then((response) => {
        console.log("Subscription Status: ", response.data);
        res.status(200).json({
          success: true,
          message: "Subscription Status: " + response.data,
          data: user,
        });
      })
      .catch((error) => {
        console.error(
          "Error fetching subscription status:",
          error.response?.data || error.message
        );
        res.status(500).json({
          success: false,
          error: "Failed to fetch subscription status",
          details: error.response?.data || error.message,
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

const fetch_all_subscriptions = async (req, res) => {
  try {
    // Fetch all merchantUserIds from the database
    const users = await User.find({}, "merchantUserId");

    if (!users.length) {
      return res
        .status(404)
        .json({ error: "No users found with merchantUserIds" });
    }

    const subscriptions = [];

    // Loop through each user and fetch their subscription details
    for (const user of users) {
      const merchantUserId = user.merchantUserId;
      const path = `/v3/recurring/subscription/user/${MERCHENT_ID}/${merchantUserId}/all`;
      const hashInput = path + SALT_KEY;
      const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
      const xVerify = `${hash}###${SALT_INDEX}`;

      // Axios GET request options
      const options = {
        method: "get",
        url: `${fetch_all_subscriptions_url}${path}`,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
        },
      };

      try {
        const response = await axios.request(options);
        subscriptions.push({
          merchantUserId: merchantUserId,
          subscriptionDetails: response.data,
        });
      } catch (error) {
        console.error(
          `Error fetching subscription for merchantUserId ${merchantUserId}:`,
          error.response?.data || error.message
        );
        subscriptions.push({
          merchantUserId: merchantUserId,
          error: error.response?.data || error.message,
        });
      }
    }

    // Send all subscription details as response
    res.json({ subscriptions });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const submit_auth_request = async (req, res) => {
  try {
    const { userName } = req.query;
    const paymentDetails = await User.findOne({ userName });

    if (!paymentDetails) {
      return res.status(404).json({ error: "Payment details not found." });
    }

    const { merchantUserId, subscriptionId, authRequestId } = paymentDetails;
    // console.log(merchantUserId);
    // console.log(subscriptionId);
    // console.log(authRequestId);

    

    // Payload
    const payload = {
      merchantId: MERCHENT_ID,
      merchantUserId: merchantUserId,
      subscriptionId: subscriptionId,
      authRequestId: authRequestId,
      paymentInstrument: { type: "UPI_QR" },
    };

    // Encode payload to Base64
    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base64EncodedPayload = bufferObj.toString("base64");
    

    // Generate X-Verify header
    const xVerify = generateXVerify(base64EncodedPayload, "/v3/recurring/auth/init");

    // Log the request details
    // console.log("Payload:", payload);
    // console.log("Base64 Payload:", base64Payload);
    // console.log("X-Verify:", xVerify);

    const options = {
      method: "post",
      url: submit_auth_request_url,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-CALLBACK-URL": CALLBACK_URL,
      },
      data: {
        request: base64EncodedPayload,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log("Response Data:", response.data);
        const intentUrl = response.data.data.redirectUrl;

        if (intentUrl) {
          res.json({ intentUrl }); // Send the intent URL to the client
        } else {
          res.status(400).json({ error: "Intent URL not found in response." });
        }
      })
      .catch(function (error) {
        console.error("Error making API request:", error);
        res.status(500).json({ error: "Failed to start recurring payment." });
      });
  } catch (error) {
    console.error("Error processing recurring payment:", error.message);
    res.status(500).json({ error: "Failed to process recurring payment." });
  }
};

const auth_request_status = async (req, res) => {
  try {
    const { userName } = req.query;

    // Fetch payment details using userName
    const paymentDetails = await User.findOne({ userName });

    if (!paymentDetails || !paymentDetails.authRequestId) {
      return res.status(404).json({ error: "Payment details not found." });
    }

    const { authRequestId } = paymentDetails;

    function generatexVerify(hashInput) {
      const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
      return `${hash}###${SALT_INDEX}`;
    }

    const apiPath = `/v3/recurring/auth/status/${MERCHENT_ID}/${authRequestId}`;
    const url = `${auth_request_status_url}${apiPath}`;

    // Generate X-Verify header
    const xVerify = generatexVerify(apiPath + SALT_KEY);

    const options = {
      method: "get",
      url,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
    };

    // Make API call
    // axios
    //   .request(options)
    //   .then(function (response) {
    //     console.log("Response Data:", response.data);

    //     const transactionId = `TX${Date.now()}`;
    //     const user = User.findOneAndUpdate(
    //       { userName },
    //       { transactionId },
    //       { new: true } // Return the updated document
    //     ).lean();

    //     if (!user) {
    //       return res.status(404).json({ error: "User not found." });
    //     }

    //     res.status(201).json({
    //       success: true,
    //       // data: user,
    //       response: response.data,
    //     });
    //   })
    //   .catch(function (error) {
    //     console.error("Error fetching auth request status:", error);
    //     res.status(500).json({ error: "Failed to fetch auth request status." });
    //   });

    // Make API call
    const response = await axios.request(options);

    console.log("API Response Data:", response.data);

    const transactionId = `TX${Date.now()}`;
    const updatedUser = await User.findOneAndUpdate(
      { userName },
      { transactionId },
      { new: true } // Return the updated document
    ).lean(); // Convert to plain JavaScript object

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(201).json({
      success: true,
      data: updatedUser,
      response: response.data,
    });

  } catch (error) {
    console.error("Error processing auth request status:", error.message);
    res.status(500).json({ error: "Failed to process auth request status." });
  }
};

const recurring_INIT = async (req, res) => {
  try {
    const { subscriptionId } = req.query;

    // Fetch subscription details from the database
    const subscription = await User.findOne({ subscriptionId });

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    const { transactionId, merchantUserId, amount } = subscription;

    // Generate JSON Payload
    const payload = {
      merchantId: MERCHENT_ID, // From environment variables
      merchantUserId, // Merchant's unique user ID
      subscriptionId,
      transactionId, // Generate unique transaction ID
      autoDebit: true, // Set as per requirement
      amount: amount, // Amount in paisa
    };

    // Convert Payload to Base64
    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base64Payload = bufferObj.toString("base64");

    // Generate X-Verify header
    const urlPath = "/v3/recurring/debit/init";
    const hash = crypto
      .createHash("sha256")
      .update(base64Payload + urlPath + SALT_KEY)
      .digest("hex");
    const xVerify = `${hash}###${SALT_INDEX}`;

    // Configure the request options
    const options = {
      method: "post",
      url: recurring_INIT_url,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-Verify": xVerify,
        "X-CALLBACK-URL": CALLBACK_RECURRING_URL,
      },
      data: {
        request: base64Payload,
      },
    };

    // axios
    //   .request(options)
    //   .then(function (response) {
    //     console.log("Response Data:", response.data);

    //     const notificationId = response.data.data.notificationId;

    //     const user = User.findOneAndUpdate(
    //       { subscriptionId },
    //       { notificationId },
    //       { new: true } // Return the updated document
    //     );

    //     if (!user) {
    //       return res.status(404).json({ error: "User not found." });
    //     }

    //     res.status(201).json({
    //       success: true,
    //       data: user,
    //       response: response.data,
    //     });

    //     return res.status(200).json({ success: true, data: response.data });
    //   })
    //   .catch(function (error) {
    //     console.error("Error making API request:", error);
    //     res.status(500).json({ error: "Failed to process recurring init." });
    //   });

     // Make API call
     const response = await axios.request(options);

     console.log("Response Data:", response.data);
 
     // Extract `notificationId` and update the user
     const notificationId = response.data.data.notificationId;
 
     const updatedUser = await User.findOneAndUpdate(
       { subscriptionId },
       { notificationId },
       { new: true } // Return the updated document
     ).lean(); // Convert to a plain JavaScript object
 
     if (!updatedUser) {
       return res.status(404).json({ error: "User not found." });
     }
 
     res.status(201).json({
       success: true,
       data: updatedUser,
       response: response.data,
     });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to process recurring init.",
      error: error
    })
  }
};

const recurring_debit_execute = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await User.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const { merchantUserId, subscriptionId, notificationId} = transaction; 

    // Construct payload
    const payload = {
      merchantId: MERCHENT_ID,
      merchantUserId: merchantUserId || "",
      subscriptionId,
      notificationId,
      transactionId,
    };
    
    // Base64 encode payload
    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base64Payload = bufferObj.toString("base64");

    // Generate X-VERIFY header
    const API_ENDPOINT = "/v3/recurring/debit/execute";
    const xVerify = generateXVerify(base64Payload, API_ENDPOINT);

    const options = {
      method: "post",
      url: recurring_debit_execute_url,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      data: {
        response: base64Payload,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log("Response:", response.data);

        if (response.data.success) {
          console.log("Transaction Successful:", response.data.data);
          res.status(200).json({
            success: true,
            response: response.data,
          });
        } else {
          console.error("Transaction Failed:", response.data.message);
          res.status(400).json({
            success: false,
            message: "Error in Transaction",
            data: response.data
          })
        }

      })
      .catch(function (error) {
        console.error("Error:", error.response?.data || error.message);
        res.status(400).json({
          success: false,
          error: error.response?.data || error.message
        })
      });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error in debit execution",
      error: error
    })
  }
};

const recurring_debit_execute_status = async (req, res) => {
  try {
    const { userName } = req.params;

    const user = await User.findOne({ userName });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const transactionId = user.transactionId;
    const apiPath = `/v3/recurring/debit/status/${MERCHENT_ID}/${transactionId}`;
    const xVerify = generateXVerify(null, apiPath);

    const options = {
      method: "get",
      url: `${recurring_debit_execute_status_url}${apiPath}`,
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
    };

    const response = await axios.request(options);

    if (response.data.success) {
      res.json({ status: "success", data: response.data.data });
    } else {
      res
        .status(400)
        .json({ status: "failure", message: response.data.message });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const cancel_subscription = async (req, res) => {
  try {
    const { userName } = req.params;
    const user = await User.findOne({ userName });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { merchantUserId, subscriptionId } = user;

    const payload = {
      merchantId: MERCHENT_ID,
      merchantUserId: merchantUserId,
      subscriptionId: subscriptionId,
    };

    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base64Payload = bufferObj.toString("base64");

    const apiPath = "/v3/recurring/subscription/cancel";
    const xVerify = generateXVerify(base64Payload, apiPath);

    const options = {
      method: "post",
      url: cancel_subscription_url,
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-CALLBACK-URL": CALLBACK_cancel_subscription,
      },
      data: {
        request: base64Payload,
      },
    };

    const response = await axios.request(options);

    if (response.data.success) {
      res.json({
        status: "success",
        message: response.data.message,
        data: response.data.data,
      });
    } else {
      res
        .status(400)
        .json({ status: "failure", message: response.data.message });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });

  }
};

module.exports = {
  create_user_subscription,
  user_subscription_status,
  fetch_all_subscriptions,
  submit_auth_request,
  auth_request_status,
  recurring_INIT,
  recurring_debit_execute,
  recurring_debit_execute_status,
  cancel_subscription
};
