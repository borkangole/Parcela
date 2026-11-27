import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Contracts | Parcela" };

export default function ContractsPage() {
  return (
    <ComingNext
      section="Sales"
      title="Contracts"
      step="Step 7"
      summary={"Reservations and contracts, with the payment schedule each one creates."}
      points={[
        "Reserve an available lot for a buyer (two can't reserve the same lot)",
        "Set the price, reservation fee, down payment, months and interest",
        "The payment schedule is generated automatically",
        "Closing and title transfer, from deed to new title",
      ]}
    />
  );
}
