"use server";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { sendPasswordChangedAlertEmail, sendPasswordResetEmail } from "@/lib/mailer";

type RequestResetInput = {
  email: string;
};

type ResetWithTokenInput = {
  token: string;
  newPassword: string;
};

type PasswordResetTokenPayload = JWTPayload & {
  purpose?: string;
  email?: string;
};

const RESET_TOKEN_PURPOSE = "password-reset";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required.");
  }
  return new TextEncoder().encode(secret);
}

export async function requestPasswordResetAction({ email }: RequestResetInput) {
  const normalizedEmail = email.trim().toLowerCase();

  const res = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
    },
    body: JSON.stringify({
      query: `
        query GetUserByEmail($email: String!) {
          users(where: { email: { _eq: $email } }, limit: 1) {
            id
            email
          }
        }
      `,
      variables: { email: normalizedEmail },
    }),
  });

  const data = await res.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  const user = data?.data?.users?.[0];

  // Avoid email enumeration by returning success either way.
  if (!user) {
    return { success: true };
  }

  const token = await new SignJWT({
    purpose: RESET_TOKEN_PURPOSE,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setExpirationTime("30m")
    .sign(getJwtSecret());

  const appBaseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${appBaseUrl.replace(/\/$/, "")}/change-password?token=${encodeURIComponent(token)}`;

  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
  });

  return { success: true };
}

export async function resetPasswordWithTokenAction({
  token,
  newPassword,
}: ResetWithTokenInput) {
  let payload: PasswordResetTokenPayload;

  try {
    const verified = await jwtVerify(token, getJwtSecret());
    payload = verified.payload;
  } catch {
    throw new Error("Reset link is invalid or expired.");
  }

  if (payload.purpose !== RESET_TOKEN_PURPOSE || !payload.sub || !payload.email) {
    throw new Error("Reset link is invalid.");
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  const updateRes = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
    },
    body: JSON.stringify({
      query: `
        mutation ResetPasswordByToken($id: uuid!, $password: String!) {
          update_users_by_pk(
            pk_columns: { id: $id }
            _set: {
              password: $password
              must_change_password: false
            }
          ) {
            id
            email
          }
        }
      `,
      variables: {
        id: payload.sub,
        password: newHashedPassword,
      },
    }),
  });

  const updateData = await updateRes.json();
  if (updateData.errors) {
    throw new Error(updateData.errors[0].message);
  }

  const updatedUser = updateData?.data?.update_users_by_pk;
  if (!updatedUser) {
    throw new Error("User not found for password reset.");
  }

  if (updatedUser.email !== payload.email) {
    throw new Error("Reset link does not match this user.");
  }

  await sendPasswordChangedAlertEmail({ to: updatedUser.email });

  return { success: true };
}