import Image from "next/image";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
export const instant = false;



async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="text-center">
            <Image 
            src="/veyra-logo.svg" 
            alt="Veyra Studios" 
            width={340} 
            height={180} 
            priority 
            unoptimized
            className="mx-auto"
            />
          <p className="mt-2 text-sm text-slate-500">Sign in to ServiceDesk</p>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid email or password.
          </p>
        )}

        <label className="block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 py-2 font-medium text-white hover:bg-slate-700"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}