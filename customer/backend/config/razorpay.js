const dotenv = require("dotenv");
const Razorpay = require("razorpay");

dotenv.config();

const hasRazorpayKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const razorpay = hasRazorpayKeys
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

const createRazorpayOrder = async (orderPayload) => {
  if (razorpay && typeof razorpay.orders?.create === "function") {
    return await razorpay.orders.create(orderPayload);
  }

  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderPayload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.description ||
        data?.error?.reason ||
        "Razorpay order could not be created."
    );
  }

  return data;
};

const razorpayRequest = async (path, payload, extraHeaders = {}) => {
  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.description ||
        data?.error?.reason ||
        data?.message ||
        "RazorpayX request failed."
    );
  }

  return data;
};

const createRazorpayXContact = (contactPayload) =>
  razorpayRequest("/contacts", contactPayload);

const createRazorpayXFundAccount = (fundAccountPayload) =>
  razorpayRequest("/fund_accounts", fundAccountPayload);

const createRazorpayXPayout = (payoutPayload, idempotencyKey) =>
  razorpayRequest("/payouts", payoutPayload, {
    "X-Payout-Idempotency": idempotencyKey,
  });

module.exports = {
  razorpay,
  createRazorpayOrder,
  createRazorpayXContact,
  createRazorpayXFundAccount,
  createRazorpayXPayout,
};
