import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
export const instant = false;

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role !== "ADMIN") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">403</h1>
          <p className="mt-2 text-slate-500">Admins only.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Admin area</h1>
        <p className="text-slate-500">
          Only users with the ADMIN role can see this page. User management
          and reporting will go here.
        </p>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}