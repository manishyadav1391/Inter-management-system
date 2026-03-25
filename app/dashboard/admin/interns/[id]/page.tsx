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
        interns_by_pk(id: $id) {
          id full_name email gender phone
          department_id institute_id
          join_date end_date status
        }
        departments { id name }
        institutes  { id name }
      }
    `,
    variables: { id },
  });

  if (!data.interns_by_pk) redirect("/dashboard/admin/interns");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Intern</h1>
        <DeleteButton id={id} hasuraToken={hasuraToken} />
      </div>
      <InternForm
        departments={data.departments}
        institutes={data.institutes}
        hasuraToken={hasuraToken}
        initialData={data.interns_by_pk}
      />
    </div>
  );
}