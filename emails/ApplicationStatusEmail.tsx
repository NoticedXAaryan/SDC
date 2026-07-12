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

interface ApplicationStatusEmailProps {
  userName: string;
  status: string;
  cycleName: string;
  feedback?: string;
}

export const ApplicationStatusEmail = ({
  userName,
  status,
  cycleName,
  feedback,
}: ApplicationStatusEmailProps) => {
  const isAccepted = status === "accepted";
  const subject = isAccepted 
    ? `Congratulations! Welcome to STC (${cycleName})`
    : `Update on your STC Application (${cycleName})`;

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{subject}</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            {isAccepted 
              ? "We are thrilled to let you know that you have been accepted to join the Student Tech Club! Your application stood out to us, and we are excited to have you on board."
              : "Thank you for applying to the Student Tech Club. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time."
            }
          </Text>
          {feedback && (
            <Text style={feedbackText}>
              <strong>Feedback:</strong> {feedback}
            </Text>
          )}
          <Text style={footer}>
            Best regards,<br />
            Student Tech Club Leadership Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

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

const feedbackText = {
  ...text,
  backgroundColor: "#f9f9f9",
  padding: "16px 48px",
  borderLeft: "4px solid #ccc",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  padding: "0 48px",
  marginTop: "32px",
};

export default ApplicationStatusEmail;
