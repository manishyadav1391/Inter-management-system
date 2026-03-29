import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import InstituteForm from "@/app/components/InstituteForm";
import DeleteInstituteButton from "@/app/components/DeleteInstituteButton";

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
        institutes(
          where: {
            id: { _eq: $id }
            deleted_at: { _is_null: true }
          }
          limit: 1
        ) {
          id
          name
          location
        }
      }
    `,
    variables: { id },
  });

  const institute = data.institutes?.[0] ?? null;

  if (!institute) redirect("/dashboard/admin/institutes");

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {institute.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Edit institute details
          </p>
        </div>
        <DeleteInstituteButton id={id} hasuraToken={hasuraToken} />
      </div>
      <InstituteForm
        initialData={institute}
        hasuraToken={hasuraToken}
      />
    </div>
  );
}
