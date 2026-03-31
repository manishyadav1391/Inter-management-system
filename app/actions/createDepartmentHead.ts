"use server";
import bcrypt from "bcryptjs";
import { sendCredentialsEmail } from "@/lib/mailer";

export async function createDepartmentHeadAction(formData: {
  email:         string;
  password:      string;
  department_id: string;
}) {
  // 1. Hash password on server
  const hashedPassword = await bcrypt.hash(formData.password, 10);

  // 2. Create user with role=department
  const res = await fetch(
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
    {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          mutation CreateDepartmentHead(
            $email:    String!
            $password: String!
            $deptId:   uuid!
          ) {
            insert_users_one(object: {
              email:         $email
              password:      $password
              role:          "department"
              department_id: $deptId
              must_change_password: true
            }) { id email }
          }
        `,
        variables: {
          email:    formData.email,
          password: hashedPassword,
          deptId:   formData.department_id,
        },
      }),
    }
  );

  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);

  const userId = data.data.insert_users_one.id;

  try {
    // Send credentials before assigning head to avoid inconsistent assignment.
    await sendCredentialsEmail({
      to: formData.email,
      password: formData.password,
      role: "department",
    });
  } catch (emailError: any) {
    await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          mutation RollbackDepartmentHead($id: uuid!) {
            delete_users_by_pk(id: $id) { id }
          }
        `,
        variables: { id: userId },
      }),
    });

    throw new Error(
      `Department head was not created because credential email could not be sent: ${emailError?.message ?? "Unknown email error"}`
    );
  }

  // 3. Set head_id on the department
  const deptRes = await fetch(
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
    {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          mutation SetDepartmentHead($deptId: uuid!, $headId: uuid!) {
            update_departments_by_pk(
              pk_columns: { id: $deptId }
              _set: { head_id: $headId }
            ) { id name }
          }
        `,
        variables: {
          deptId: formData.department_id,
          headId: userId,
        },
      }),
    }
  );

  const deptData = await deptRes.json();
  if (deptData.errors) throw new Error(deptData.errors[0].message);

  return data.data.insert_users_one;
}