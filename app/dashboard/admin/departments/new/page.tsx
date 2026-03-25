
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import DepartmentForm from "@/app/components/DepartmentForm";

export default async function NewDepartmentPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const hasuraToken = (session as any).hasuraToken;

  // Fetch users with role=department to show as head options
  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query {
        users(
          where: { role: { _eq: "department" } }
          order_by: { email: asc }
        ) {
          id
          email
        }
      }
    `,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Add Department</h1>
        <p className="text-gray-500 text-sm mt-1">
          Create a new department and optionally assign a head
        </p>
      </div>
      <DepartmentForm
        departmentHeads={data.users}
        hasuraToken={hasuraToken}
      />
    </div>
  );
}