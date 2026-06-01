/**
 * Seed admin + sample students via Supabase Admin API.
 * Run: npm run db:seed (requires .env.local with service role key)
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(`
Missing Supabase credentials.

1. Copy:  cp .env.example .env.local
2. Edit .env.local and set:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   (from Supabase → Project Settings → API)

3. Run again:  npm run db:seed
`);
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-admin-123";
const studentEmails = (
  process.env.SEED_STUDENT_EMAILS ??
  "student1@example.com,student2@example.com,student3@example.com"
)
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
const studentPassword =
  process.env.SEED_STUDENT_PASSWORD ?? "change-me-student-123";

async function upsertUser(
  email: string,
  password: string,
  role: "admin" | "student",
  fullName: string
) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);

  if (existing) {
    await admin.from("profiles").upsert({
      id: existing.id,
      email,
      full_name: fullName,
      role,
    });
    console.log(`Updated profile: ${email} (${role})`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });

  if (error) {
    console.error(`Failed to create ${email}:`, error.message);
    return null;
  }

  await admin.from("profiles").upsert({
    id: data.user!.id,
    email,
    full_name: fullName,
    role,
  });

  console.log(`Created: ${email} (${role})`);
  return data.user!.id;
}

async function main() {
  console.log("Seeding users...\n");

  const adminId = await upsertUser(
    adminEmail,
    adminPassword,
    "admin",
    "Admin User"
  );

  for (let i = 0; i < studentEmails.length; i++) {
    await upsertUser(
      studentEmails[i],
      studentPassword,
      "student",
      `Student ${i + 1}`
    );
  }

  console.log("\nDone.");
  if (adminId) {
    console.log(`Admin id: ${adminId}`);
  }
  console.log("\nCredentials (change in production):");
  console.log(`  Admin:   ${adminEmail} / ${adminPassword}`);
  console.log(`  Students: ${studentEmails.join(", ")} / ${studentPassword}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
