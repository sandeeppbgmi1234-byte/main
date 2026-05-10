import crypto from "crypto";
import { clogger } from "../../utils/consola";

/**
 * Validates and decodes an Instagram/Meta signed_request
 *
 * @param signedRequest The form-encoded signed_request parameter from Meta
 * @returns The decoded payload if valid, null otherwise
 */
export function verifyAndDecodeSignedRequest(signedRequest: string): any | null {
  try {
    const secret = process.env.INSTAGRAM_APP_SECRET;
    if (!secret) {
      clogger.error("[SignedRequest] INSTAGRAM_APP_SECRET is not set");
      return null;
    }

    const [encodedSig, payload] = signedRequest.split(".");
    if (!encodedSig || !payload) {
      clogger.error("[SignedRequest] Invalid signed_request format");
      return null;
    }

    // Decode signature
    const sig = base64urlDecode(encodedSig);

    // Verify signature
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest();

    if (!crypto.timingSafeEqual(Buffer.from(sig, "binary"), expectedSig)) {
      clogger.error("[SignedRequest] Signature validation failed");
      return null;
    }

    // Decode payload
    const data = JSON.parse(base64urlDecode(payload));
    return data;
  } catch (error: any) {
    clogger.error("[SignedRequest] Error verifying request:", error.message);
    return null;
  }
}

/**
 * Base64URL decoding utility
 */
function base64urlDecode(str: string): string {
  // Replace characters per base64url encoding rules
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  
  // Pad string with '=' so its length is a multiple of 4
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error("Invalid base64url string");
    }
    base64 += new Array(5 - pad).join("=");
  }

  return Buffer.from(base64, "base64").toString("binary");
}
