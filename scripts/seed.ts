/**
 * Seed admin + sample students via Supabase Admin API.
 * Run: npm run db:seed (requires .env.local with service role key)
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const isPlaceholder =
  !url ||
  !serviceKey ||
  url.includes("your-project.supabase.co") ||
  url.includes("xxxxxxxx") ||
  serviceKey.includes("your-service-role") ||
  serviceKey.includes("your-anon") ||
  anonKey?.includes("your-anon");

if (isPlaceholder) {
  console.error(`
❌  .env.local still has EXAMPLE values — seed cannot run.

Your error "ENOTFOUND your-project.supabase.co" means the URL was not replaced.

FIX:
  1. Open Supabase → Project Settings → API
  2. Copy Project URL (looks like https://abcdefgh.supabase.co)
  3. Copy anon key and service_role key (Reveal)
  4. Edit THIS file:  ${resolve(process.cwd(), ".env.local")}

     NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REAL-ID.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...   (long string)
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...       (long string)

  5. Save, then run:  npm run db:seed

Do NOT use values from .env.example — those are fake.
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
    // Reset password to the configured seed password
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password: password,
    });
    if (updateError) {
      console.warn(`⚠️ Failed to reset password for ${email}: ${updateError.message}`);
    } else {
      console.log(`Reset password for: ${email}`);
    }

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
