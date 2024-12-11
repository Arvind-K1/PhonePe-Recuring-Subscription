const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    merchantUserId: {
        type: String
    },
    merchantSubscriptionId: {
        type: String
    },
    subscriptionId: {
        type: String
    },
    authRequestId: {
        type: String
    },
    amount: {
        type: Number
    },
    mobileNumber: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        enum: ["CREATED","ACTIVE","SUSPENDED","REVOKED","CANCELLED","PAUSED","EXPIRED","FAILED","CANCEL_IN_PROGRESS"],
        default: "CREATED"
    }

},{
    timestamps: true
});

const User = mongoose.model("User",userSchema);

module.exports = User