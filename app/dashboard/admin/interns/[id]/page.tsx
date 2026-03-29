import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import InternForm from "@/app/components/InternForm";
import DeleteButton from "@/app/components/DeleteButton";

export default async function EditInternPage({
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
  query GetIntern($id: uuid!) {
    interns(
      where: {
        id: { _eq: $id }
        deleted_at: { _is_null: true }
      }
      limit: 1
    ) {
      id
      name
      gender
      phone
      department_id
      institute_id
      start_date
      end_date
      status_id
      user {
        email
      }
    }
    departments(where: { deleted_at: { _is_null: true } }) { id name }
    institutes(where: { deleted_at: { _is_null: true } }) { id name }
    internship_status { id status }   
  }
`,
  variables: { id },
});

  const intern = data.interns?.[0] ?? null;

  if (!intern) redirect("/dashboard/admin/interns");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Intern</h1>
        <DeleteButton id={id} hasuraToken={hasuraToken} />
      </div>
    <InternForm
        departments={data.departments}
        institutes={data.institutes}
         statuses={data.internship_status}
        hasuraToken={hasuraToken}
        initialData={intern}
/>
    </div>
  );
}