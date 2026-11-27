import { redirect } from "next/navigation";

// "/" sends admins to the dashboard. The dashboard's layout sends agents on to /agent.
export default function Home() {
  redirect("/dashboard");
}
