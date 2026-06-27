import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (!["SUPERVISOR", "POLICE"].includes(session.user.role)) {
    redirect("/dashboard");
  }
  return children;
}
