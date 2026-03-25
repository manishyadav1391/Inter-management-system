import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import DepartmentForm from "@/app/components/DepartmentForm";

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
        departments_by_pk(id: $id) {
          id
          name
          head_id
          head { id email }
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

  if (!data.departments_by_pk) redirect("/dashboard/admin/departments");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {data.departments_by_pk.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Edit department details and assign a head
        </p>
      </div>
      <DepartmentForm
        initialData={data.departments_by_pk}
        departmentHeads={data.users}
        hasuraToken={hasuraToken}
      />
    </div>
  );
}