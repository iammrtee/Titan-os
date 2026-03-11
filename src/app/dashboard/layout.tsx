import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user profile for role
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user's projects for the sidebar
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="dashboard-layout">
      <Sidebar
        user={
          profile ?? {
            id: user.id,
            email: user.email ?? "",
            role: "starter",
            created_at: "",
          }
        }
        projects={projects || []}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
