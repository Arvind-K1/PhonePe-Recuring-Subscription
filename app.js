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


// Routes import 
const paymentRouter = require("./routes/payment.route");

// Routes decleartion
app.use('/api/payment',paymentRouter)

module.exports = app;
