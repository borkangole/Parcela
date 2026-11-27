import Link from "next/link";
import { ParcelaMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "No access | Parcela" };

// Shown when a logged-in user opens a page their role isn't allowed to see.
export default function NoAccessPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <ParcelaMark className="size-12 text-ink" />
      <h1 className="mt-8 text-2xl font-semibold tracking-[-0.01em] text-ink">This page isn&apos;t available to you.</h1>
      <p className="mt-3 max-w-sm text-[15px] text-grey">
        Your account doesn&apos;t have access to it. If you need it for your work, ask an administrator.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-8 h-10 bg-ink px-5 text-white hover:bg-ink-2" })}>
        Back to the home page
      </Link>
    </main>
  );
}
