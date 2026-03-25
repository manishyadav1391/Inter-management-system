import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={role} email={session.user?.email ?? ""} />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}