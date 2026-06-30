// Password reset is no longer needed with OTP auth. Redirect to login.
import { redirect } from "next/navigation";

export default function ResetPasswordRedirect() {
  redirect("/login");
}
