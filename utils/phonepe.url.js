// Testing Purpose
const MERCHENT_ID = "PGTESTPAYUAT86";
const SALT_INDEX = 1;
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const CALLBACK_URL = "http://localhost:3002/api/callback";


const create_user_subscription_url = "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/recurring/subscription/create";

const user_subscription_status_url = "https://api-preprod.phonepe.com/apis/pg-sandbox";

const fetch_all_subscriptions_url = "https://api-preprod.phonepe.com/apis/pg-sandbox"

const verify_VPA_url ="https://api-preprod.phonepe.com/apis/pg-sandbox/v3/vpa/{merchantId}/{vpa}/validate"

const submit_auth_request_url = "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/recurring/auth/init"

const auth_request_status_url = "https://api-preprod.phonepe.com/apis/pg-sandbox"

const recurring_INIT_url = "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/recurring/debit/init"

const recurring_debit_execute_url = "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/recurring/debit/execute"

const recurring_debit_execute_status_url = "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/recurring/debit/status/{merchantId}/{merchantTransactionId}"

const cancel_subscription_url = "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/recurring/subscription/cancel"

module.exports = {
    MERCHENT_ID,
    SALT_INDEX,
    SALT_KEY,
    CALLBACK_URL,
    create_user_subscription_url,
    user_subscription_status_url,
    fetch_all_subscriptions_url,
    verify_VPA_url,
    submit_auth_request_url,
    auth_request_status_url,
    recurring_INIT_url,
    recurring_debit_execute_url,
    recurring_debit_execute_status_url,
    cancel_subscription_url
}





