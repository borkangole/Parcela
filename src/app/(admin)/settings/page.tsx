import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Settings | Parcela" };

export default function SettingsPage() {
  return (
    <ComingNext
      section="System"
      title="Settings"
      step="Step 8"
      summary={"Company-wide rules."}
      points={[
        "Commission rules: rate, % of price or % collected, when it's earned",
        "Default payment terms and late penalties",
        "Project details for Costa Preciosa",
      ]}
    />
  );
}
