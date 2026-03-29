import { auth } from "@/auth";
import { redirect } from "next/navigation";
import InstituteForm from "@/app/components/InstituteForm";

export default async function NewInstitutePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "admin") redirect("/dashboard/department");

  const hasuraToken = (session as any).hasuraToken;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Add Institute</h1>
        <p className="text-gray-500 text-sm mt-1">
          Create a new institute available for intern assignments
        </p>
      </div>
      <InstituteForm hasuraToken={hasuraToken} />
    </div>
  );
}
