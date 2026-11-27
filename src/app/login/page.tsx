import type { Metadata } from "next";
import { Suspense } from "react";
import { ParcelaLogo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";
import { LogoIntro } from "./logo-intro";
import { SitePlan } from "./site-plan";

export const metadata: Metadata = { title: "Sign in | Parcela" };

// Logged-in visitors never reach this page: src/proxy.ts sends them to "/".
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-[1.1fr_1fr]">
      <LogoIntro />

      {/* Left: the Costa Preciosa site plan (large screens only) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex xl:p-16">
        {/* No entrance animation here: the intro's logo lands on this one. */}
        <div>
          <ParcelaLogo className="text-[15px] text-white" markClassName="size-9" introTarget />
        </div>

        <div className="w-full max-w-[600px] 2xl:max-w-[780px]">
          <p
            className="login-enter font-mono text-[11px] tracking-[0.24em] text-grey uppercase"
            style={{ animationDelay: "120ms" }}
          >
            Site map
          </p>
          <h2
            className="login-enter mt-3 mb-10 text-[2.5rem] leading-none font-semibold tracking-[-0.02em] 2xl:text-[3.25rem]"
            style={{ animationDelay: "180ms" }}
          >
            Costa Preciosa
          </h2>
          <SitePlan />
        </div>

        <p className="login-enter text-[13px] text-grey" style={{ animationDelay: "400ms" }}>
          AAAC Corporation <span className="text-ink-3">/</span> Lot sales and accounts
        </p>
      </aside>

      {/* Right: the form */}
      <section className="flex flex-col px-6 py-8 sm:px-12 lg:py-12">
        <div className="lg:hidden">
          <ParcelaLogo className="text-[13px] text-ink" markClassName="size-8" introTarget />
        </div>

        <div className="login-enter mx-auto flex w-full max-w-[400px] flex-1 flex-col pt-14 pb-12 lg:justify-center lg:pt-12" style={{ animationDelay: "80ms" }}>
          <Suspense fallback={<div className="h-[460px]" />}>
            <LoginFormWithNext searchParams={searchParams} />
          </Suspense>
        </div>

        <p className="mx-auto w-full max-w-[400px] text-[12px] text-grey">
          Secure access for AAAC Corporation admins and agents.
        </p>
      </section>
    </main>
  );
}

async function LoginFormWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}
