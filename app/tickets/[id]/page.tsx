import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/src/prisma/db";

export const instant = false;

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"] as const;

const priorityStyle: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-800",
};

function label(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace("_", " ");
}

// One place that decides who may touch a ticket. Everything below uses it.
async function loadTicketFor(ticketId: number) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!Number.isInteger(ticketId)) notFound();

  const userId = Number(session.user.id);
  const isStaff = session.user.role === "AGENT" || session.user.role === "ADMIN";

  const ticket = await db.orm.public.Ticket.where({ id: ticketId }).all().first();
  if (!ticket) notFound();
  if (!isStaff && ticket.requesterId !== userId) notFound();

  return { userId, isStaff, ticket };
}

async function updateStatus(formData: FormData) {
  "use server";
  const ticketId = Number(formData.get("ticketId"));
  const { isStaff } = await loadTicketFor(ticketId);
  if (!isStaff) return;

  const status = STATUSES.find((s) => s === formData.get("status"));
  if (!status) return;

  await db.orm.public.Ticket.where({ id: ticketId }).update({ status });
  revalidatePath(`/tickets/${ticketId}`);
}

async function assignToMe(formData: FormData) {
  "use server";
  const ticketId = Number(formData.get("ticketId"));
  const { isStaff, userId } = await loadTicketFor(ticketId);
  if (!isStaff) return;

  await db.orm.public.Ticket.where({ id: ticketId }).update({ assigneeId: userId });
  revalidatePath(`/tickets/${ticketId}`);
}

async function addComment(formData: FormData) {
  "use server";
  const ticketId = Number(formData.get("ticketId"));
  const { userId } = await loadTicketFor(ticketId);

  const body = String(formData.get("body") ?? "").trim();
  if (!body || body.length > 2000) return;

  await db.orm.public.Comment.create({ body, ticketId, authorId: userId });
  revalidatePath(`/tickets/${ticketId}`);
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = Number(id);
  const { isStaff, ticket } = await loadTicketFor(ticketId);

  const users = await db.orm.public.User.all();
  const nameById = new Map(users.map((u) => [u.id, u.name ?? u.email]));
  const roleById = new Map(users.map((u) => [u.id, u.role]));

  const commentRows = await db.orm.public.Comment.where({ ticketId }).all();
  const comments = [...commentRows].sort((a, b) => a.id - b.id);

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/tickets" className="text-sm underline">
          Back to tickets
        </Link>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold">
              <span className="text-slate-400">#{ticket.id}</span> {ticket.title}
            </h1>
            <div className="flex shrink-0 gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyle[ticket.priority] ?? ""}`}
              >
                {label(ticket.priority)}
              </span>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                {label(ticket.status)}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Requested by {nameById.get(ticket.requesterId) ?? "unknown"} ·{" "}
            {ticket.assigneeId
              ? `Assigned to ${nameById.get(ticket.assigneeId) ?? "unknown"}`
              : "Unassigned"}
          </p>

          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {isStaff && (
          <div className="flex flex-wrap items-end gap-6 rounded-xl border border-slate-200 bg-white p-6">
            <form action={updateStatus} className="flex items-end gap-2">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <label className="block text-sm font-medium">
                Status
                <select
                  name="status"
                  defaultValue={ticket.status}
                  className="mt-1 block rounded-md border border-slate-300 px-3 py-2"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                Update
              </button>
            </form>

            <form action={assignToMe}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                Assign to me
              </button>
            </form>
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Comments ({comments.length})
          </h2>

          {comments.length === 0 && (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}

          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-medium">
                {nameById.get(c.authorId) ?? "unknown"}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">
                  {label(roleById.get(c.authorId) ?? "USER")}
                </span>
              </p>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}

          <form
            action={addComment}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea
              name="body"
              required
              rows={3}
              maxLength={2000}
              placeholder="Write a comment..."
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Add comment
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}