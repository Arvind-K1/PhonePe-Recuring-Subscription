const express = require("express");


const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("PhonePe app is working");
});

// Callback endpoint
app.post("/api/callback", (req, res) => {
    console.log("Callback received:", req.body);
    res.send("Callback received successfully.");
});

app.post('/api/recurring/callback', async (req, res) => {
    try {
        const decodedResponse = JSON.parse(Buffer.from(req.body.response, 'base64').toString('utf8'));

        // Validate the response
        const { data } = decodedResponse;
        if (data.notificationDetails.state === 'NOTIFIED') {
            console.log('Recurring INIT Notification received:', data);
            // Perform further actions, e.g., updating subscription status, etc.
        } else if (data.notificationDetails.state === 'FAILED') {
            console.error('Recurring INIT Failed:', data);
            // Handle failure
        }

        res.status(200).send('Callback received');
    } catch (error) {
        console.error('Error in Callback Handler:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/cancel-subscription/callback', async (req, res) => {
    try {
      const base64Response = req.body.response;
      const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString('utf-8'));
  
      if (decodedResponse.success) {
        console.log('Callback received:', decodedResponse);
  
        // Update subscription state in database
        const { subscriptionDetails } = decodedResponse.data;
        await db.updateSubscriptionState(subscriptionDetails.subscriptionId, subscriptionDetails.state);
  
        res.status(200).send('Callback processed successfully');
      } else {
        res.status(400).send('Invalid callback response');
      }
    } catch (error) {
      console.error('Error processing callback:', error);
      res.status(500).send('Error processing callback');
    }
  });



// Routes import 
const paymentRouter = require("./routes/payment.route");

// Routes decleartion
app.use('/api/payment',paymentRouter)

module.exports = app;
