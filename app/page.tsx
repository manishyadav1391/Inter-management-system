import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // Not logged in → go to login
  if (!session) redirect("/login");

  // Logged in → go to correct dashboard based on role
  const role = (session.user as any).role;
  if (role === "admin")      redirect("/dashboard/admin");
  if (role === "department") redirect("/dashboard/department");
  if (role === "intern")     redirect("/dashboard/intern");

  // Fallback
  redirect("/login");
}