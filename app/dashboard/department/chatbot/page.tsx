import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChatbotWorkspace from "@/app/components/ChatbotWorkspace";

export default async function DepartmentChatbotPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "department") redirect("/dashboard/admin");

  const hasuraToken = (session as any).hasuraToken;

  return <ChatbotWorkspace bearerToken={hasuraToken} />;
}
