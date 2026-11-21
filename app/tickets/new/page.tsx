import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/src/prisma/db";

export const instant = false;

const PRIORITIES = ["LOW", "MEDIUM","URGENT"] as const;

async function createTicket(formData:FormData) {
    "use server";

    const session = await auth();
    if (!session) redirect("/login");

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description")?? "").trim();
    const priority = PRIORITIES.find((p) => p === formData.get("priority"));

    if (!title || title.length > 120 || !description || !priority) {
        redirect("/tickets/new?error=1");
    }

    await db.orm.public.Ticket.create({
        title,
        description,
        priority,
        requesterId: Number(session.user.id),
    });

    redirect("/tickets");
}

export default async function NewTicketPage({
   searchParams,

}: {
    searchParams: Promise<{ error?: String }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { error } = await searchParams;

    return (
        <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
            <div className="mx-auto max-w-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">New ticket</h1>
                    <Link href="/tickets" className="text-sm underline">
                    Back to tickets
                    </Link>
                </div>

                <form
                action={createTicket}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
                    {error && (
                        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                            Please fill in the title and description
                        </p>
                    )}

                    <label className="block text-sm font-medium">
                        Title
                        <input
                        name="title"
                        required
                        maxLength={120}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Description  
                        <textarea
                        name="description"
                        required
                        rows={5}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Priority  
                        <select
                        name="priority"
                        defaultValue="MEDIUM"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                            {PRIORITIES.map((p)=>(
                                <option key={p} value={p}>
                                    {p.charAt(0) + p.slice(1).toLocaleLowerCase()}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                    type="submit"
                    className="w-full rounded-md bg-slate-900 py-2 font-medium text-white">
                        Submit ticket
                    </button>
                </form>
            </div>
        </main>
    );
}