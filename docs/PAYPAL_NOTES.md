# PayPal API Integration Notes & Verification

## Verified API Families

### 1. Orders v2
- **Create Order**: `POST https://api-m.sandbox.paypal.com/v2/checkout/orders`
  - Headers:
    - `Authorization: Bearer <ACCESS_TOKEN>`
    - `Content-Type: application/json`
    - `PayPal-Request-Id: <IDEMPOTENCY_KEY>`
  - Key payload parameters:
    - `intent: "CAPTURE"`
    - `purchase_units[0].reference_id`
    - `purchase_units[0].custom_id`
    - `purchase_units[0].amount.currency_code = "USD"`
    - `purchase_units[0].amount.value`
    - `payment_source.paypal.experience_context.return_url`
    - `payment_source.paypal.experience_context.cancel_url`
    - `payment_source.paypal.experience_context.user_action = "PAY_NOW"`
  - Response:
    - `id`: PayPal Order ID
    - `status`: `"CREATED"` or `"PAYER_ACTION_REQUIRED"`
    - `links[]`: find `rel === "approve"` for buyer redirect URL.
- **Show Order Details**: `GET https://api-m.sandbox.paypal.com/v2/checkout/orders/{order_id}`
  - Status transitions: `CREATED` -> `APPROVED` (buyer approved) -> `COMPLETED` (after capture).
- **Capture Order**: `POST https://api-m.sandbox.paypal.com/v2/checkout/orders/{order_id}/capture`
  - Headers:
    - `PayPal-Request-Id: <CAPTURE_IDEMPOTENCY_KEY>`
    - `Content-Type: application/json`
  - Body: `{}` (empty JSON object)
  - Capture ID path: `purchase_units[0].payments.captures[0].id`
  - Capture Status path: `purchase_units[0].payments.captures[0].status`
  - Idempotent Replay detection: If order status is already `COMPLETED` or response is `ORDER_ALREADY_CAPTURED`, backend returns existing capture ID with status `IDEMPOTENT_REPLAY`.

### 2. Payments v2 (Refunds)
- **Refund Captured Payment**: `POST https://api-m.sandbox.paypal.com/v2/payments/captures/{capture_id}/refund`
  - Headers:
    - `PayPal-Request-Id: <REFUND_IDEMPOTENCY_KEY>`
  - Body: `{ "amount": { "value": "<AMOUNT>", "currency_code": "USD" }, "note_to_payer": "<NOTE>" }`
  - Response: `id` (Refund ID), `status: "COMPLETED"`.

### 3. Webhooks Verification
- **Verify Webhook Signature**: `POST https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature`
  - Headers passed from incoming webhook request:
    - `paypal-transmission-id`
    - `paypal-transmission-time`
    - `paypal-cert-url`
    - `paypal-auth-algo`
    - `paypal-transmission-sig`
  - Body to verification endpoint:
    ```json
    {
      "transmission_id": "<paypal-transmission-id>",
      "transmission_time": "<paypal-transmission-time>",
      "cert_url": "<paypal-cert-url>",
      "auth_algo": "<paypal-auth-algo>",
      "transmission_sig": "<paypal-transmission-sig>",
      "webhook_id": "<PAYPAL_WEBHOOK_ID>",
      "webhook_event": <RAW_PARSED_EVENT_JSON>
    }
    ```
  - Verification response field: `verification_status === "SUCCESS"`.

### 4. OAuth 2.0 Token
- **Token Endpoint**: `POST https://api-m.sandbox.paypal.com/v1/oauth2/token`
  - Headers:
    - `Authorization: Basic base64(PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET)`
    - `Content-Type: application/x-www-form-urlencoded`
  - Body: `grant_type=client_credentials`
  - Caching strategy: Cache access token in-memory with expiration `expires_in - 60` seconds buffer.
  - Automatic retry: On HTTP 401, invalidate cached token and retry exactly once.
