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



// Routes import 
const paymentRouter = require("./routes/payment.route");

// Routes decleartion
app.use('/api/payment',paymentRouter)

module.exports = app;
