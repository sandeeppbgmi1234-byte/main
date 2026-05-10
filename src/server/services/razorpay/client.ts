import Razorpay from "razorpay";
import { razorpayConfig } from "./config.server";

let instance: Razorpay | null = null;

/**
 * Returns a singleton instance of the Razorpay SDK.
 */
export function getRazorpayClient(): Razorpay {
  if (!instance) {
    instance = new Razorpay({
      key_id: razorpayConfig.keyId,
      key_secret: razorpayConfig.keySecret,
    });
  }
  return instance;
}
