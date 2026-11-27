import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Lots | Parcela" };

export default function LotsPage() {
  return (
    <ComingNext
      section="Inventory"
      title="Lots"
      step="Step 4"
      summary={"Every lot in Costa Preciosa, its size, price and status."}
      points={[
        "A table of all 39 lots with filters by block and status",
        "Each lot's page: area, price, title number, history",
        "Set prices per lot or per square metre",
        "Put a lot on hold or release it, with the reason recorded",
      ]}
    />
  );
}
