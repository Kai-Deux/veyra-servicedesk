import bcrypt from "bcryptjs";
import { db } from "./db";

const demoUsers = [
  { email: "admin@veyra.test", name: "Demo Admin", role: "ADMIN" },
  { email: "agent@veyra.test", name: "Demo Agent", role: "AGENT" },
  { email: "user@veyra.test", name: "Demo User", role: "USER" },
] as const;

// Demo-only password. Never use a shared password like this in production.
const DEMO_PASSWORD = "ChangeMe123!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of demoUsers) {
    const existing = await db.orm.public.User.where({ email: u.email })
      .all()
      .first();

    if (existing) {
      console.log(`exists:  ${u.email}`);
      continue;
    }

    const created = await db.orm.public.User.create({
      email: u.email,
      name: u.name,
      role: u.role,
      passwordHash,
    });
    console.log(`created: ${created.email} (${created.role})`);
  }

  const all = await db.orm.public.User.all();
  console.log(`total users: ${all.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.close());