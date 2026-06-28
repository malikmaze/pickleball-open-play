import { redirect } from "next/navigation";
import { GuestLandingPage } from "@/components/guest-landing-page";
import { isAdminUser } from "@/lib/auth";

export default async function HomePage() {
  if (await isAdminUser()) {
    redirect("/admin");
  }

  return <GuestLandingPage />;
}
