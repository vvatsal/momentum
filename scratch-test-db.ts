import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnostics() {
  const adminId = "467c91c4-0f60-4faa-8223-e355d38eb331";
  const email = "admin@example.com";
  const password = "change-me-admin-123";

  console.log(`Resetting password for user ${adminId} to ${password}...`);
  const { data: updateData, error: updateError } = await serviceClient.auth.admin.updateUserById(adminId, {
    password: password
  });

  if (updateError) {
    console.error("Failed to update password:", updateError.message);
    return;
  }

  console.log("SUCCESS: Password updated. Signing in anon client...");
  
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("Failed to sign in:", authError.message);
    return;
  }

  console.log("SUCCESS: Signed in! Running tests table query as authenticated admin...");
  
  const testId = "8d2c10d3-40b5-44ca-bff2-5131d6b35efe"; // From previous database query
  const { data: test, error: testError } = await anonClient
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (testError) {
    console.error("ERROR querying tests table with RLS:", testError.message, testError);
  } else {
    console.log("SUCCESS! Retrieved test:", test.title, "Created by:", test.created_by);
  }
}

runDiagnostics();
