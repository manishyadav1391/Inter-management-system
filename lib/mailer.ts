import nodemailer from "nodemailer";

type UserRole = "intern" | "department";

type SendCredentialsEmailInput = {
  to: string;
  password: string;
  role: UserRole;
};

type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

type SendPasswordChangedAlertEmailInput = {
  to: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function sendCredentialsEmail({
  to,
  password,
  role,
}: SendCredentialsEmailInput) {
  const transporter = createMailTransporter();
  const from = getRequiredEnv("SMTP_FROM");
  const appBaseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const loginUrl = `${appBaseUrl.replace(/\/$/, "")}/login`;

  const roleLabel = role === "department" ? "Department Head" : "Intern";

  await transporter.sendMail({
    from,
    to,
    subject: `Your ${roleLabel} Login Credentials`,
    text: [
      `Hello,`,
      "",
      `Your ${roleLabel} account has been created in the Intern Management System.`,
      "",
      `Email (Username): ${to}`,
      `Temporary Password: ${password}`,
      "",
      `Login URL: ${loginUrl}`,
      "",
      "Please log in and change your password after your first sign-in.",
    ].join("\n"),
  });
}

function createMailTransporter() {
  const host = getRequiredEnv("SMTP_HOST");
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");

  const portValue = process.env.SMTP_PORT ?? "587";
  const port = Number(portValue);

  if (!Number.isFinite(port)) {
    throw new Error("SMTP_PORT must be a valid number");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailInput) {
  const transporter = createMailTransporter();
  const from = getRequiredEnv("SMTP_FROM");

  await transporter.sendMail({
    from,
    to,
    subject: "Reset Your IMS Password",
    text: [
      "Hello,",
      "",
      "We received a request to reset your Intern Management System password.",
      "",
      `Reset Link: ${resetUrl}`,
      "",
      "This link expires in 30 minutes.",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });
}

export async function sendPasswordChangedAlertEmail({
  to,
}: SendPasswordChangedAlertEmailInput) {
  const transporter = createMailTransporter();
  const from = getRequiredEnv("SMTP_FROM");
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.SMTP_FROM;

  await transporter.sendMail({
    from,
    to,
    subject: "Your IMS Password Was Changed",
    text: [
      "Hello,",
      "",
      "Your Intern Management System password was changed successfully.",
      "",
      "If this was not you, please contact support immediately.",
      `Support: ${supportEmail}`,
    ].join("\n"),
  });
}