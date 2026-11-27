import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Commissions | Parcela" };

export default function CommissionsPage() {
  return (
    <ComingNext
      section="Money"
      title="Commissions"
      step="Step 8"
      summary={"What each agent has earned and been paid."}
      points={[
        "Commission per sale, from the company's commission rule",
        "Pending until the rule's condition is met, then Eligible",
        "Mark as paid with a reference number",
      ]}
    />
  );
}
