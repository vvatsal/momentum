import type { PublishedTestListItem, TestListItem } from "@/types/database";

type ProfilesCountQuery = {
  from(table: "profiles"): {
    select(
      columns: string,
      options: { count: "exact"; head: true }
    ): {
      eq(
        column: string,
        value: string
      ): Promise<{ count: number | null; error: { message: string } | null }>;
    };
  };
};

type TestsAdminQuery = {
  from(table: "tests"): {
    select(columns: string): {
      order(
        column: string,
        options: { ascending: boolean }
      ): Promise<{ data: TestListItem[] | null; error: { message: string } | null }>;
    };
  };
};

type TestsStudentQuery = {
  from(table: "tests"): {
    select(columns: string): {
      eq(
        column: string,
        value: string
      ): {
        order(
          column: string,
          options: { ascending: boolean }
        ): Promise<{
          data: PublishedTestListItem[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export async function countStudents(supabase: unknown): Promise<number> {
  const client = supabase as ProfilesCountQuery;
  const { count, error } = await client
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  if (error) return 0;
  return count ?? 0;
}

export async function listTestsForAdmin(supabase: unknown): Promise<TestListItem[]> {
  const client = supabase as TestsAdminQuery;
  const { data, error } = await client
    .from("tests")
    .select("id, title, status, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function listPublishedTests(
  supabase: unknown
): Promise<PublishedTestListItem[]> {
  const client = supabase as TestsStudentQuery;
  const { data, error } = await client
    .from("tests")
    .select("id, title, description, starts_at, ends_at, duration_minutes")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
