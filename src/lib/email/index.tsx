import { render } from "@react-email/render";
import * as React from "react";
import { IS_PRODUCTION, EMAIL_CONFIG } from "./config";
import { getResendClient } from "./resend";
import { AccountExpiredEmail } from "./templates/account-expired";
import { InvoiceEmail } from "./templates/invoice";
import { OnboardingEmail } from "./templates/onboarding";
import { QuotaFullEmail } from "./templates/quota-full";
import { EmailPayload } from "./types";

/**
 * Utility to mask email addresses for logging to prevent PII exposure.
 * Example: "john.doe@example.com" -> "j***@example.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "invalid-email";
  return `${local[0]}***@${domain}`;
}

/**
 * Sends an email based on the provided payload using Resend.
 * Each payload type is mapped to a high-quality React Email template.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { to, name } = payload;
  let html = "";
  let subject = "";

  try {
    // Template rendering moved inside the try block so rendering errors hit the same failure path
    switch (payload.type) {
      case "onboarding":
        html = await render(
          <OnboardingEmail
            name={name}
            company={payload.company}
            loginUrl={`${EMAIL_CONFIG.APP.URL}/login`}
          />,
        );
        subject = `Welcome to ${EMAIL_CONFIG.APP.NAME}, ${name}!`;
        break;

      case "account-expired":
        html = await render(
          <AccountExpiredEmail
            name={name}
            expirationDate={payload.expirationDate}
            reactivateUrl={payload.reactivateUrl}
          />,
        );
        subject = `Alert: Your ${EMAIL_CONFIG.APP.NAME} subscription has expired`;
        break;

      case "invoice":
        html = await render(
          <InvoiceEmail
            name={name}
            invoiceNumber={payload.invoiceNumber}
            amount={payload.amount}
            currency={payload.currency}
            dueDate={payload.dueDate}
            paymentUrl={payload.paymentUrl}
          />,
        );
        subject = `New Invoice ${payload.invoiceNumber} from ${EMAIL_CONFIG.APP.NAME}`;
        break;

      case "quota-full":
        html = await render(
          <QuotaFullEmail name={name} upgradeUrl={payload.upgradeUrl} />,
        );
        subject = `Action Required: Your ${EMAIL_CONFIG.APP.NAME} quota is full`;
        break;

      default:
        throw new Error(
          `EMAIL_SERVICE_ERROR: Unsupported email type: ${(payload as any).type}`,
        );
    }

    // Skip actual sending if not in production to prevent accidental emails during dev/test
    if (!IS_PRODUCTION) {
      console.info(
        `[EMAIL_SKIPPED] Type: ${payload.type}, Recipient: ${maskEmail(to)} (Reason: Environment is not production)`,
      );
      return;
    }

    // Initialize client lazily only when a send attempt is actually made
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.APP.FROM,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw new Error(
        `RESEND_API_ERROR: ${error.message} (Code: ${error.name})`,
      );
    }

    // Log success with masked recipient to comply with PII rules
    console.info(
      `[EMAIL_SENT] Type: ${payload.type}, Recipient: ${maskEmail(to)}, JobID: ${data?.id}`,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";

    // Log failure with masked recipient
    console.error(
      `[EMAIL_FAILURE] Type: ${payload.type}, Recipient: ${maskEmail(to)}, Error: ${message}`,
    );

    throw new Error(`EMAIL_SEND_FAILED: ${message}`);
  }
}
