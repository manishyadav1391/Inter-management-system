import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChatbotWorkspace from "@/app/components/ChatbotWorkspace";

export default async function AdminChatbotPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "admin") redirect("/dashboard/department");

  const hasuraToken = (session as any).hasuraToken;

  return <ChatbotWorkspace bearerToken={hasuraToken} chatScope="admin" />;
}
