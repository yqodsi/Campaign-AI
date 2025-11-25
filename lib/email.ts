import nodemailer from "nodemailer";

// Initialize SMTP transporter if configured
// Supports both Gmail service and custom SMTP servers
const smtpTransporter =
  process.env.SMTP_USER && process.env.SMTP_PASS
    ? process.env.SMTP_SERVICE === "gmail"
      ? // Use Gmail service (simpler, auto-configured)
        nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
      : // Use custom SMTP server
      process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
      : null
    : null;

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, body, from } = params;

  // Use SMTP if configured
  if (smtpTransporter) {
    try {
      const mailOptions = {
        from: from || process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: to,
        subject: subject,
        text: body, // Plain text version
        html: body.replace(/\n/g, "<br>"), // Convert newlines to HTML breaks
      };

      const info = await smtpTransporter.sendMail(mailOptions);

      console.log(
        `[Email] Sent successfully via SMTP. Message ID: ${info.messageId}`
      );
      console.log(`[Email] Response: ${info.response}`);
      return;
    } catch (error) {
      console.error(`[Email] SMTP send failed:`, error);
      throw error;
    }
  }

  // Mock mode if SMTP not configured
  console.log(`[Email] MOCK SEND (no SMTP configured)`);
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body: ${body.substring(0, 100)}...`);
}
