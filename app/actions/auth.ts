"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase env unset or transient failure: drop the local session and
    // redirect anyway. The user pill is the only auth-aware UI; a failed
    // signout shouldn't trap them.
  }
  redirect("/");
}
