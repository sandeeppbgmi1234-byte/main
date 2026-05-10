/**
 * React Email template for alerting users about Instagram token expiration.
 */
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { EMAIL_CONFIG } from "../config";

export interface InstagramTokenExpiredEmailProps {
  name: string;
  expiredAt: string;
  reconnectUrl: string;
}

export const InstagramTokenExpiredEmail = ({
  name,
  expiredAt,
  reconnectUrl,
}: InstagramTokenExpiredEmailProps) => (
  <Html>
    <Head />
    <Preview>Action Required: Your Instagram Connection has Expired</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Heading style={styles.h1}>Instagram Connection Expired</Heading>
        <Text style={styles.text}>Hi {name},</Text>
        <Text style={styles.text}>
          Your connection to Instagram for <strong>{EMAIL_CONFIG.APP.NAME}</strong> has expired on <strong>{expiredAt}</strong>. 
          This happens periodically for security reasons (typically every 60 days).
        </Text>
        <Text style={styles.text}>
          Because the connection has expired, your automations have been paused. To resume them, please reconnect your Instagram account.
        </Text>
        <Section style={styles.buttonContainer}>
          <Button style={styles.button} href={reconnectUrl}>
            Reconnect Instagram
          </Button>
        </Section>
        <Text style={styles.footerNote}>
          It only takes a few seconds to reconnect and resume your automations.
        </Text>
      </Container>
    </Body>
  </Html>
);

const styles = {
  main: {
    backgroundColor: EMAIL_CONFIG.COLORS.SLATE[50],
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "40px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    borderTop: `4px solid ${EMAIL_CONFIG.COLORS.DANGER}`,
    borderLeft: `1px solid ${EMAIL_CONFIG.COLORS.SLATE[200]}`,
    borderRight: `1px solid ${EMAIL_CONFIG.COLORS.SLATE[200]}`,
    borderBottom: `1px solid ${EMAIL_CONFIG.COLORS.SLATE[200]}`,
    maxWidth: "580px",
  },
  h1: {
    color: EMAIL_CONFIG.COLORS.DANGER,
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "30px 0",
  },
  text: {
    color: EMAIL_CONFIG.COLORS.SLATE[600],
    fontSize: "16px",
    lineHeight: "24px",
    textAlign: "left" as const,
  },
  buttonContainer: {
    textAlign: "center" as const,
    margin: "34px 0",
  },
  button: {
    padding: "12px 24px",
    backgroundColor: EMAIL_CONFIG.COLORS.DANGER,
    borderRadius: "6px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
  },
  footerNote: {
    color: EMAIL_CONFIG.COLORS.SLATE[600],
    fontSize: "14px",
    lineHeight: "20px",
    textAlign: "center" as const,
    marginTop: "30px",
    fontStyle: "italic",
  },
};
