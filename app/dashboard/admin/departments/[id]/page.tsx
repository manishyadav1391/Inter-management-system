import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import DepartmentForm from "@/app/components/DepartmentForm";
import DeleteDepartmentButton from "@/app/components/DeleteDepartmentButton";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id }      = await params;
  const hasuraToken = (session as any).hasuraToken;

  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query GetDepartment($id: uuid!) {
        departments(
          where: {
            id: { _eq: $id }
            deleted_at: { _is_null: true }
          }
          limit: 1
        ) {
          id
          name
          head_id
        }
        users(
          where: { role: { _eq: "department" } }
          order_by: { email: asc }
        ) {
          id
          email
        }
      }
    `,
    variables: { id },
  });

  const department = data.departments?.[0] ?? null;

  if (!department) redirect("/dashboard/admin/departments");

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {department.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Edit department details and assign a head
          </p>
        </div>
        <DeleteDepartmentButton id={id} hasuraToken={hasuraToken} />
      </div>
      <DepartmentForm
        initialData={department}
        departmentHeads={data.users}
        hasuraToken={hasuraToken}
      />
    </div>
  );
}