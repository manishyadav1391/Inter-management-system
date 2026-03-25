import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import DepartmentInternForm from "@/app/components/DepartmentInternForm";

export default async function DepartmentNewInternPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "department") redirect("/dashboard/admin");

  const hasuraToken    = (session as any).hasuraToken;
  const departmentId   = (session.user as any).departmentId;

  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query {
        institutes        { id name   }
        internship_status { id status }
      }
    `,
  });

  // Empty intern with department pre-filled from session
  const emptyIntern = {
    id:           null,
    name:         "",
    gender:       "",
    phone:        "",
    start_date:   "",
    end_date:     "",
    status_id:    "",
    institute_id: "",
    department_id: departmentId,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Intern</h1>
      <DepartmentInternForm
        intern={emptyIntern}
        institutes={data.institutes}
        statuses={data.internship_status}
        hasuraToken={hasuraToken}
      />
    </div>
  );
}