import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/src/prisma/db";

export const instant = false;

const priorityStyle: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-800",
};

function label(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace("_", " ");
}

export default async function TicketsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { id, role } = session.user;
  const isStaff = role === "AGENT" || role === "ADMIN";

  const rows = isStaff
    ? await db.orm.public.Ticket.all()
    : await db.orm.public.Ticket.where({ requesterId: Number(id) }).all();

  const tickets = [...rows].sort((a, b) => b.id - a.id);

  const users = isStaff ? await db.orm.public.User.all() : [];
  const nameById = new Map(users.map((u) => [u.id, u.name ?? u.email]));

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {isStaff ? "All tickets" : "My tickets"}
            </h1>
            <p className="text-sm text-slate-500">
              {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm underline">
              Dashboard
            </Link>
            <Link
              href="/tickets/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              New ticket
            </Link>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No tickets yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      <span className="text-slate-400">#{t.id}</span> {t.title}
                    </p>
                    {isStaff && (
                      <p className="text-sm text-slate-500">
                        Requested by {nameById.get(t.requesterId) ?? "unknown"}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyle[t.priority] ?? ""}`}
                    >
                      {label(t.priority)}
                    </span>
                    <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                      {label(t.status)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}