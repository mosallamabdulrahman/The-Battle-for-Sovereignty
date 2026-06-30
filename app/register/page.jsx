// This page is no longer used. Redirect to the unified quick login page.
import { redirect } from "next/navigation";

export default function RegisterRedirect() {
  redirect("/login");
}
