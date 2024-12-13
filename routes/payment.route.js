const express = require("express");

const {
    create_user_subscription,
    user_subscription_status,
    fetch_all_subscriptions,
    submit_auth_request,
    auth_request_status,
    recurring_INIT,
    recurring_debit_execute,
    recurring_debit_execute_status,
    cancel_subscription
} = require("../controllers/payment.controller");

const router = express.Router();

router.route("/create-user-subscription").post(create_user_subscription);

router.route("/user-subscription-status").get(user_subscription_status);

router.route("/fetch-all-subscriptions").get(fetch_all_subscriptions);

router.route("/submit-auth-request").get(submit_auth_request);

router.route("/auth-request-status").patch(auth_request_status);

router.route("/recurring-INIT").patch(recurring_INIT);

router.route("/recurring-debit-execute/:transactionId").get(recurring_debit_execute);

router.route("/recurring-debit-execute-status/:userName").get(recurring_debit_execute_status);

router.route("/cancel-subscription/:userName").get(cancel_subscription);








module.exports = router;