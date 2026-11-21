import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
export const instant = false;

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { name, email, role } = session.user;

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-lg font-medium">{name ?? email}</p>
          <p className="text-sm text-slate-500">{email}</p>
          <span className="mt-3 inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
            {role}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/tickets" className="text-sm underline">
  Tickets
</Link>
          <Link href="/admin" className="text-sm underline">
            Admin area
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-sm underline">Sign out</button>
          </form>
        </div>
      </div>
    </main>
  );
}