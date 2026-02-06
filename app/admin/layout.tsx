import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerByAuthUserId } from "@/lib/supabase/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/owner/login");
  }

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner || owner.role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
