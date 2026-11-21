import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/src/prisma/db";

export const instant = false;

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"] as const;
const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;

const priorityBar: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-amber-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-slate-400",
};

function label(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace("_", " ");
}

function Stat({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href?: string;
}) {
  const body = (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80">
      {body}
    </Link>
  ) : (
    body
  );
}

function Bar({
  name,
  count,
  total,
  color,
}: {
  name: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{name}</span>
        <span className="text-slate-500">{count}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { id, name, email, role } = session.user;
  const isStaff = role === "AGENT" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  // Access rule first: users only ever load their own tickets.
  const tickets = isStaff
    ? await db.orm.public.Ticket.all()
    : await db.orm.public.Ticket.where({ requesterId: Number(id) }).all();

  const users = isAdmin ? await db.orm.public.User.all() : [];

  const total = tickets.length;
  const active = tickets.filter(
    (t) => t.status !== "RESOLVED" && t.status !== "CLOSED"
  );
  const urgentActive = active.filter((t) => t.priority === "URGENT").length;
  const unassigned = active.filter((t) => t.assigneeId == null).length;

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-500">
              {name ?? email} ·{" "}
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                {role}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/tickets/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              New ticket
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            title={isStaff ? "All tickets" : "My tickets"}
            value={total}
            href="/tickets"
          />
          <Stat title="Active" value={active.length} />
          <Stat title="Urgent and active" value={urgentActive} />
          {isStaff ? (
            <Stat title="Unassigned" value={unassigned} />
          ) : (
            <Stat
              title="Resolved"
              value={tickets.filter((t) => t.status === "RESOLVED").length}
              href="/tickets?status=RESOLVED"
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">By status</h2>
            {STATUSES.map((s) => (
              <Bar
                key={s}
                name={label(s)}
                count={tickets.filter((t) => t.status === s).length}
                total={total}
                color="bg-slate-900"
              />
            ))}
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">By priority</h2>
            {PRIORITIES.map((p) => (
              <Bar
                key={p}
                name={label(p)}
                count={tickets.filter((t) => t.priority === p).length}
                total={total}
                color={priorityBar[p]}
              />
            ))}
          </section>
        </div>

        {isAdmin && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Accounts</h2>
              <Link href="/admin" className="text-sm underline">
                Admin area
              </Link>
            </div>
            <div className="mt-3 flex gap-6 text-sm">
              {(["ADMIN", "AGENT", "USER"] as const).map((r) => (
                <p key={r}>
                  <span className="text-xl font-semibold">
                    {users.filter((u) => u.role === r).length}
                  </span>{" "}
                  <span className="text-slate-500">{label(r)}s</span>
                </p>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}