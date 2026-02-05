import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default async function OwnerRegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/owner/login");
  }

  return <RegisterForm />;
}
