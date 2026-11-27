import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Inquiries | Parcela" };

export default function InquiriesPage() {
  return (
    <ComingNext
      section="Sales"
      title="Inquiries"
      step="Step 6"
      summary={"Clients asking agents about lots, from first message to reservation."}
      points={[
        "Inquiries logged by agents from their phones",
        "Status: New, Following up, Reserved, Lost",
        "Which agent, which lot, and the next follow-up",
        "Turn an inquiry into a reservation in one step",
      ]}
    />
  );
}
