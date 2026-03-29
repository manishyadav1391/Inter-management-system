import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import DepartmentInternForm from "@/app/components/DepartmentInternForm";

export default async function DepartmentEditInternPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "department") redirect("/dashboard/admin");

  const { id }      = await params;
  const hasuraToken = (session as any).hasuraToken;

  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query GetIntern($id: uuid!) {
        interns(
          where: {
            id: { _eq: $id }
            deleted_at: { _is_null: true }
          }
          limit: 1
        ) {
          id name gender phone
          start_date end_date
          status_id
          institute_id
          internship_status { status }
          institute         { name   }
        }
        institutes(where: { deleted_at: { _is_null: true } }) { id name }
        internship_status { id status }
      }
    `,
    variables: { id },
  });

  const intern = data.interns?.[0] ?? null;

  if (!intern) redirect("/dashboard/department");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Intern</h1>
      <DepartmentInternForm
        intern={intern}
        institutes={data.institutes}
        statuses={data.internship_status}
        hasuraToken={hasuraToken}
      />
    </div>
  );
}