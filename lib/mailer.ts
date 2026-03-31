import nodemailer from "nodemailer";

type UserRole = "intern" | "department";

type SendCredentialsEmailInput = {
  to: string;
  password: string;
  role: UserRole;
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
  const host = getRequiredEnv("SMTP_HOST");
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");
  const from = getRequiredEnv("SMTP_FROM");
  const appBaseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const loginUrl = `${appBaseUrl.replace(/\/$/, "")}/login`;

  const portValue = process.env.SMTP_PORT ?? "587";
  const port = Number(portValue);

  if (!Number.isFinite(port)) {
    throw new Error("SMTP_PORT must be a valid number");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

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