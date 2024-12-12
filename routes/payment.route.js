const express = require("express");

const {
    create_user_subscription,
    user_subscription_status,
    fetch_all_subscriptions,
    submit_auth_request
} = require("../controllers/payment.controller");

const router = express.Router();

router.route("/create-user-subscription").post(create_user_subscription);

router.route("/user-subscription-status").get(user_subscription_status);

router.route("/fetch-all-subscriptions").get(fetch_all_subscriptions);

router.route("/submit-auth-request").get(submit_auth_request);

router.route("/auth-request-status").patch(auth_request_status);

router.route("/recurring-INIT").patch(recurring_INIT);

router.route("/recurring-debit-execute/:transactionId").post(recurring_debit_execute);

ter.route("/recurring_debit_execute_status/:userName").get(recurring_debit_execute_status);






module.exports = router;