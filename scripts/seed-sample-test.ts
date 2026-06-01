/**
 * Creates one published sample test with 10 questions (MCQ + numeric).
 * Run after db:seed:  npm run db:seed-sample
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey || url.includes("your-project")) {
  console.error("Configure .env.local with real Supabase credentials first.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const QUESTIONS = [
  {
    type: "mcq" as const,
    text: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correct: { option: "4" },
    marks: 1,
  },
  {
    type: "numeric" as const,
    text: "What is 10 ÷ 4? (decimal)",
    correct: { value: 2.5 },
    tolerance: 0.01 as number,
    marks: 2,
  },
  {
    type: "mcq" as const,
    text: "Which is a prime number?",
    options: ["9", "15", "17", "21"],
    correct: { option: "17" },
    marks: 1,
  },
  {
    type: "numeric" as const,
    text: "Square root of 81?",
    correct: { value: 9 },
    marks: 1,
  },
  {
    type: "mcq" as const,
    text: "Sum of angles in a triangle (degrees)?",
    options: ["90", "180", "270", "360"],
    correct: { option: "180" },
    marks: 1,
  },
  {
    type: "numeric" as const,
    text: "If x + 5 = 12, what is x?",
    correct: { value: 7 },
    marks: 1,
  },
  {
    type: "mcq" as const,
    text: "2³ equals?",
    options: ["6", "8", "9", "12"],
    correct: { option: "8" },
    marks: 1,
  },
  {
    type: "numeric" as const,
    text: "Convert 0.5 to a fraction denominator 10 (numerator)?",
    correct: { value: 5 },
    marks: 1,
  },
  {
    type: "mcq" as const,
    text: "Which fraction equals 1/2?",
    options: ["2/5", "3/6", "4/6", "5/8"],
    correct: { option: "3/6" },
    marks: 1,
  },
  {
    type: "numeric" as const,
    text: "Area of rectangle 3 × 7?",
    correct: { value: 21 },
    marks: 2,
  },
];

async function main() {
  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .single();

  if (!adminProfile) {
    console.error("No admin profile found. Run npm run db:seed first.");
    process.exit(1);
  }

  const { data: existing } = await admin
    .from("tests")
    .select("id")
    .eq("title", "Sample Mathematics Quiz")
    .maybeSingle();

  if (existing) {
    console.log("Sample test already exists:", existing.id);
    return;
  }

  const { data: test, error: testError } = await admin
    .from("tests")
    .insert({
      title: "Sample Mathematics Quiz",
      description: "10-question demo for Phase 2 test-taking.",
      instructions:
        "Answer each question. You may skip and return later. Submit when finished. Timer pauses when you switch tabs.",
      duration_minutes: 30,
      status: "published",
      created_by: adminProfile.id,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (testError || !test) {
    console.error("Failed to create test:", testError?.message);
    process.exit(1);
  }

  const rows = QUESTIONS.map((q, i) => ({
    test_id: test.id,
    order_index: i,
    type: q.type,
    question_text: q.text,
    marks: q.marks,
    correct_answer: q.correct,
    options: q.type === "mcq" ? q.options : null,
    numeric_tolerance: q.type === "numeric" ? (q.tolerance ?? null) : null,
  }));

  const { error: qError } = await admin.from("questions").insert(rows);

  if (qError) {
    console.error("Failed to create questions:", qError.message);
    process.exit(1);
  }

  console.log("Created published test:", test.id);
  console.log("Students will see it on /dashboard after refresh.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
