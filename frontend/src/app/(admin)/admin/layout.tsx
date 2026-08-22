import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { getCurrentUser } from "@/features/auth/services/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-bg-secondary">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
