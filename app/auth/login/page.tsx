import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user) {
    redirect(
      session.user.role === "ADMIN"
        ? "/admin"
        : (sp.callbackUrl ?? "/student"),
    );
  }

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: String(formData.get("callbackUrl") || "/admin"),
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/auth/login?error=CredentialsSignin");
      }
      throw err;
    }
  }

  return (
    <div className="container-page flex min-h-[70dvh] items-center justify-center py-16">
      <form action={login} className="w-full max-w-sm grid gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Sign in
        </h1>
        <input type="hidden" name="callbackUrl" value={sp.callbackUrl ?? "/admin"} />
        <label className="grid gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="min-h-11 rounded-md border border-border bg-bg px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="min-h-11 rounded-md border border-border bg-bg px-3"
          />
        </label>
        {sp.error && (
          <p className="text-sm text-danger">Invalid credentials or locked account.</p>
        )}
        <button
          type="submit"
          className="min-h-11 rounded-md bg-accent font-medium text-bg"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
