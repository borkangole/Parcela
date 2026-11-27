"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Audience = "admin" | "agent";

const COPY: Record<Audience, { title: string; lead: string; button: string }> = {
  admin: {
    title: "Welcome back.",
    lead: "Sign in to manage lots, sales and payments.",
    button: "Sign in",
  },
  agent: {
    title: "Your next sale starts here.",
    lead: "Check which lots are available and log your clients' inquiries.",
    button: "Sign in as agent",
  },
};

// Messages for the error codes Better Auth returns
const ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match an account. Check both and try again.",
  BANNED_USER: "This account has been deactivated. Ask your administrator to turn it back on.",
  TOO_MANY_REQUESTS: "Too many attempts. Wait a minute, then try again.",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string) {
  return {
    email: !email ? "Enter your email address." : !EMAIL_RE.test(email) ? "Enter a valid email address." : "",
    password: !password
      ? "Enter your password."
      : password.length < 8
        ? "Passwords are at least 8 characters."
        : "",
  };
}

/** Only allow redirects within this site (never "//other-site.com"). */
function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const ids = { email: useId(), password: useId(), emailErr: useId(), passwordErr: useId() };
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [audience, setAudience] = useState<Audience>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");

  const errors = validate(email, password);
  const showEmailErr = touched.email && errors.email;
  const showPasswordErr = touched.password && errors.password;
  const copy = formError ? { ...COPY[audience], title: "Let's try that again." } : COPY[audience];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (errors.email) return emailRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();

    setPending(true);
    setFormError("");
    const { error } = await signIn.email({ email: email.trim(), password });
    if (error) {
      setPending(false);
      setFormError(ERRORS[error.code ?? ""] ?? "We couldn't sign you in. Please try again.");
      setPassword("");
      setTouched((t) => ({ ...t, password: false })); // don't add "Enter your password" under the error
      passwordRef.current?.focus();
      return;
    }
    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <div className="w-full">
      {/* Admin / Agent switch */}
      <div
        role="radiogroup"
        aria-label="Sign in as"
        className="relative mb-10 inline-grid grid-cols-2 rounded-md border border-border p-1 text-sm"
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[4px] bg-ink transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
            audience === "agent" && "translate-x-full",
          )}
        />
        {(["admin", "agent"] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={audience === a}
            onClick={() => setAudience(a)}
            className={cn(
              "relative z-10 h-9 rounded-[4px] px-5 font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cherry",
              audience === a ? "text-white" : "text-grey hover:text-ink",
            )}
          >
            {a === "admin" ? "Admin" : "Agent"}
          </button>
        ))}
      </div>

      <div key={`${audience}-${Boolean(formError)}`} className="login-swap">
        <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink">{copy.title}</h1>
        <p className="mt-3 min-h-[3em] text-[15px] leading-normal text-grey">{copy.lead}</p>
      </div>

      <div aria-live="polite">
        {formError && (
          <p
            role="alert"
            className="login-swap mt-8 border-l-2 border-cherry bg-[#c8102e0d] py-3 pr-4 pl-4 text-sm text-ink"
          >
            {formError}
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor={ids.email} className="text-[13px] font-medium text-ink">
            Email
          </Label>
          <Input
            ref={emailRef}
            id={ids.email}
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder={audience === "admin" ? "you@aaac.ph" : "agent@aaac.ph"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // On blur, only flag a wrongly typed email. "Required" waits for Sign in.
            onBlur={() => email && setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={Boolean(showEmailErr)}
            aria-describedby={showEmailErr ? ids.emailErr : undefined}
            className="login-input"
          />
          {showEmailErr && (
            <p id={ids.emailErr} className="text-[13px] text-cherry">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor={ids.password} className="text-[13px] font-medium text-ink">
              Password
            </Label>
            <ForgotPassword />
          </div>
          <div className="relative">
            <Input
              ref={passwordRef}
              id={ids.password}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => {
                if (password) setTouched((t) => ({ ...t, password: true }));
                setCapsLock(false);
              }}
              onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
              aria-invalid={Boolean(showPasswordErr)}
              aria-describedby={showPasswordErr ? ids.passwordErr : undefined}
              className="login-input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-grey transition-colors outline-none hover:text-ink focus-visible:text-cherry"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {showPasswordErr ? (
            <p id={ids.passwordErr} className="text-[13px] text-cherry">
              {errors.password}
            </p>
          ) : capsLock ? (
            <p className="text-[13px] text-grey">Caps Lock is on.</p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="group/submit h-12 w-full gap-2 rounded-md bg-ink text-[15px] text-white transition-[background-color,transform] duration-200 hover:bg-ink-2 active:translate-y-px disabled:opacity-100"
        >
          {pending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              {copy.button}
              <ArrowRight className="size-4 text-cherry transition-transform duration-200 group-hover/submit:translate-x-1" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function ForgotPassword() {
  return (
    <Dialog>
      <DialogTrigger className="text-[13px] text-grey underline-offset-4 transition-colors outline-none hover:text-ink hover:underline focus-visible:text-cherry focus-visible:underline">
        Forgot password?
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            Parcela accounts are managed by your administrator. Ask an admin to set a new password for you,
            then sign in with it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button className="bg-ink text-white hover:bg-ink-2" />}>Got it</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
