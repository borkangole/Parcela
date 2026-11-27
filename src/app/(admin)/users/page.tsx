import { ComingNext } from "@/components/app/coming-next";

export const metadata = { title: "Users | Parcela" };

export default function UsersPage() {
  return (
    <ComingNext
      section="People"
      title="Users"
      step="Step 5"
      summary={"Who can sign in to Parcela, and with which role."}
      points={[
        "Add an admin or agent login",
        "Reset a password",
        "Deactivate an account without deleting its history",
      ]}
    />
  );
}
