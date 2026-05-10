import { getRazorpayClient } from "./client";
import { VerifyPaymentSchema } from "./schemas";
import type { VerifyPaymentInput, PaymentVerificationResult } from "./types";
import { PaymentVerificationError } from "./errors";
import { verifyHmacSignature } from "./utils";
import { razorpayConfig } from "./config.server";

/**
 * Verifies the signature of a payment.
 */
export async function verifyPayment(
  input: VerifyPaymentInput,
): Promise<PaymentVerificationResult> {
  const parsed = VerifyPaymentSchema.parse(input);

  const signaturePayload = `${parsed.razorpay_order_id}|${parsed.razorpay_payment_id}`;

  try {
    verifyHmacSignature(
      signaturePayload,
      parsed.razorpay_signature,
      razorpayConfig.keySecret,
    );
  } catch (err) {
    throw new PaymentVerificationError(err);
  }

  return {
    verified: true,
    orderId: parsed.razorpay_order_id,
    paymentId: parsed.razorpay_payment_id,
  };
}

/**
 * Fetch full payment details from the Razorpay API.
 */
export async function fetchPaymentDetails(paymentId: string) {
  const client = getRazorpayClient();
  return client.payments.fetch(paymentId);
}
