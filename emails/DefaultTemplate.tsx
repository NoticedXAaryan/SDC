import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface DefaultEmailProps {
  userName: string;
  bodyText: string;
  subject: string;
}

export const DefaultEmail = ({
  userName,
  bodyText,
  subject,
}: DefaultEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{subject}</Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>{bodyText}</Text>
        <Text style={footer}>
          Best regards,<br />
          Student Tech Club
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  padding: "0 48px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 48px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  padding: "0 48px",
  marginTop: "32px",
};

export default DefaultEmail;
