"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { sendPasswordChangedAlertEmail } from "@/lib/mailer";

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export async function changeFirstLoginPasswordAction({
  currentPassword,
  newPassword,
}: ChangePasswordInput) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to change password.");
  }

  const userId = session.user.id;

  const getUserRes = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
    },
    body: JSON.stringify({
      query: `
        query GetUserForPasswordChange($id: uuid!) {
          users_by_pk(id: $id) {
            id
            email
            password
            must_change_password
          }
        }
      `,
      variables: { id: userId },
    }),
  });

  const getUserData = await getUserRes.json();

  if (getUserData.errors) {
    throw new Error(getUserData.errors[0].message);
  }

  const user = getUserData?.data?.users_by_pk;

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.must_change_password) {
    throw new Error("Password change is not required for this account.");
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new Error("Current password is incorrect.");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password must be different from current password.");
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
        mutation UpdateFirstLoginPassword($id: uuid!, $password: String!) {
          update_users_by_pk(
            pk_columns: { id: $id }
            _set: {
              password: $password
              must_change_password: false
            }
          ) {
            id
          }
        }
      `,
      variables: {
        id: userId,
        password: newHashedPassword,
      },
    }),
  });

  const updateData = await updateRes.json();
  if (updateData.errors) {
    throw new Error(updateData.errors[0].message);
  }

  await sendPasswordChangedAlertEmail({ to: user.email });

  return { success: true };
}