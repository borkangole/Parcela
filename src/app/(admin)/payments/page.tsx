import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Payments | Parcela" };

export default function PaymentsPage() {
  return (
    <ComingNext
      section="Money"
      title="Payments"
      step="Step 8"
      summary={"Money received, checked by accounting before it counts."}
      points={[
        "Record a payment: amount, date, method, receipt number",
        "Verify payments before they count toward a balance",
        "Void a payment with a reason (payments are never deleted)",
        "Balances and past due computed from the schedule",
      ]}
    />
  );
}
