import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import InternForm from "@/app/components/InternForm";

export default async function NewInternPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const hasuraToken = (session as any).hasuraToken;

  // Fetch departments and institutes for dropdowns
  const data = await hasuraFetch({
  hasuraToken,
  query: `
    query {
      departments        { id name }
      institutes         { id name }
      internship_status  { id status }
    }
  `,
});


  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Intern</h1>
      <InternForm
        departments={data.departments}
        institutes={data.institutes}
        statuses={data.internship_status}
        hasuraToken={hasuraToken}
      />
    </div>
  );
}