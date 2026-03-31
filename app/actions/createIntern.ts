"use server";
import bcrypt from "bcryptjs";
import { sendCredentialsEmail } from "@/lib/mailer";

export async function createInternAction(formData: {
  name:          string;
  email:         string;
  password:      string;
  gender:        string;
  phone:         string;
  department_id: string;
  institute_id:  string;
  status_id:     string;
  start_date:    string;
  end_date:      string;
}) {
  // 1. Hash the password on the server
  const hashedPassword = await bcrypt.hash(formData.password, 10);

  // 2. Create user account using admin secret
  const userRes = await fetch(
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
    {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          mutation CreateUser($email: String!, $password: String!, $dept: uuid) {
            insert_users_one(object: {
              email:         $email
              password:      $password
              role:          "intern"
              department_id: $dept
            }) {
              id
            }
          }
        `,
        variables: {
          email:    formData.email,
          password: hashedPassword,
          dept:     formData.department_id || null,
        },
      }),
    }
  );

  const userData = await userRes.json();

  if (userData.errors) {
    throw new Error(userData.errors[0].message);
  }

  const userId = userData.data.insert_users_one.id;

  // 3. Create intern profile linked to the new user
  const internRes = await fetch(
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
    {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          mutation CreateIntern($object: interns_insert_input!) {
            insert_interns_one(object: $object) { id }
          }
        `,
        variables: {
          object: {
            user_id:       userId,
            name:          formData.name,
            gender:        formData.gender        || null,
            phone:         formData.phone         || null,
            department_id: formData.department_id || null,
            institute_id:  formData.institute_id  || null,
            status_id:     formData.status_id     || null,
            start_date:    formData.start_date    || null,
            end_date:      formData.end_date      || null,
          },
        },
      }),
    }
  );

  const internData = await internRes.json();

  if (internData.errors) {
    throw new Error(internData.errors[0].message);
  }

  try {
    await sendCredentialsEmail({
      to: formData.email,
      password: formData.password,
      role: "intern",
    });
  } catch (emailError: any) {
    // Delete user to rollback both user + intern (intern has FK with cascade delete).
    await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          mutation RollbackIntern($id: uuid!) {
            delete_users_by_pk(id: $id) { id }
          }
        `,
        variables: { id: userId },
      }),
    });

    throw new Error(
      `Intern was not created because credential email could not be sent: ${emailError?.message ?? "Unknown email error"}`
    );
  }

  return internData.data.insert_interns_one;
}