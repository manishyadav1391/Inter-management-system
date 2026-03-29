import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import InstituteForm from "@/app/components/InstituteForm";

export default async function EditInstitutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "admin") redirect("/dashboard/department");

  const { id } = await params;
  const hasuraToken = (session as any).hasuraToken;

  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query GetInstitute($id: uuid!) {
        institutes_by_pk(id: $id) {
          id
          name
          location
        }
      }
    `,
    variables: { id },
  });

  if (!data.institutes_by_pk) redirect("/dashboard/admin/institutes");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {data.institutes_by_pk.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Edit institute details
        </p>
      </div>
      <InstituteForm
        initialData={data.institutes_by_pk}
        hasuraToken={hasuraToken}
      />
    </div>
  );
}
