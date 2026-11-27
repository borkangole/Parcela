import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Agents | Parcela" };

export default function AgentsPage() {
  return (
    <ComingNext
      section="People"
      title="Agents"
      step="Step 5"
      summary={"The sales agents, their logins and their results."}
      points={[
        "Agent records with contact details and commission rate",
        "Create an agent's login for the phone view",
        "Inquiries, reservations and sales per agent",
      ]}
    />
  );
}
