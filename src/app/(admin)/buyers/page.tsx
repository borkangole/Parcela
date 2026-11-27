import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Buyers | Parcela" };

export default function BuyersPage() {
  return (
    <ComingNext
      section="Sales"
      title="Buyers"
      step="Step 5"
      summary={"Everyone who reserved or bought a lot. Buyers don't log in; these are records."}
      points={[
        "Name, contact details and documents",
        "Every lot and contract they have",
        "Their balance and payment history at a glance",
      ]}
    />
  );
}
