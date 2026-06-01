import type {
  Attempt,
  EmailNotificationLog,
  Profile,
  PublishedTestListItem,
  Question,
  Test,
  TestListItem,
} from "@/types/database";

export type AdminTestDetail = Test & { question_count: number };

export type AttemptWithStudent = Attempt & {
  student: Pick<Profile, "email" | "full_name">;
};

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

export async function getTestForAdmin(
  supabase: unknown,
  testId: string
): Promise<AdminTestDetail | null> {
  const client = supabase as {
    from(table: "tests"): {
      select(columns: string): {
        eq(
          column: string,
          value: string
        ): {
          single(): Promise<{
            data: Test | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const { data: test, error } = await client
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (error || !test) return null;

  const qClient = supabase as {
    from(table: "questions"): {
      select(columns: string, options: { count: "exact"; head: true }): {
        eq(
          column: string,
          value: string
        ): Promise<{ count: number | null }>;
      };
    };
  };

  const { count } = await qClient
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("test_id", testId);

  return { ...test, question_count: count ?? 0 };
}

export async function listQuestionsForTest(
  supabase: unknown,
  testId: string
): Promise<Question[]> {
  const client = supabase as {
    from(table: "questions"): {
      select(columns: string): {
        eq(
          column: string,
          value: string
        ): {
          order(
            column: string,
            options: { ascending: boolean }
          ): Promise<{
            data: Question[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const { data, error } = await client
    .from("questions")
    .select("*")
    .eq("test_id", testId)
    .order("order_index", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function listAttemptsForTest(
  supabase: unknown,
  testId: string
): Promise<AttemptWithStudent[]> {
  const attemptClient = supabase as {
    from(table: "attempts"): {
      select(columns: string): {
        eq(
          column: string,
          value: string
        ): {
          order(
            column: string,
            options: { ascending: boolean }
          ): Promise<{
            data: Attempt[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const { data: attempts, error } = await attemptClient
    .from("attempts")
    .select("*")
    .eq("test_id", testId)
    .order("started_at", { ascending: false });

  if (error || !attempts?.length) return [];

  const studentIds = Array.from(
    new Set(attempts.map((a) => a.student_id))
  );
  const profileClient = supabase as {
    from(table: "profiles"): {
      select(columns: string): {
        in(
          column: string,
          values: string[]
        ): Promise<{
          data: Pick<Profile, "id" | "email" | "full_name">[] | null;
        }>;
      };
    };
  };

  const { data: profiles } = await profileClient
    .from("profiles")
    .select("id, email, full_name")
    .in("id", studentIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return attempts.map((attempt) => {
    const p = profileMap.get(attempt.student_id);
    return {
      ...attempt,
      student: {
        email: p?.email ?? "",
        full_name: p?.full_name ?? null,
      },
    };
  });
}

export async function listEmailLogForTest(
  supabase: unknown,
  testId: string
): Promise<EmailNotificationLog[]> {
  const client = supabase as {
    from(table: "email_notifications_log"): {
      select(columns: string): {
        eq(
          column: string,
          value: string
        ): {
          order(
            column: string,
            options: { ascending: boolean }
          ): Promise<{
            data: EmailNotificationLog[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const { data, error } = await client
    .from("email_notifications_log")
    .select("*")
    .eq("test_id", testId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function listResponsesForTest(
  supabase: unknown,
  testId: string
) {
  const client = supabase as {
    from(table: "responses"): {
      select(columns: string): {
        in(column: string, values: string[]): Promise<{
          data: { question_id: string; is_correct: boolean | null; awarded_marks: number | null }[] | null;
        }>;
      };
    };
    from(table: "attempts"): {
      select(columns: string): {
        eq(column: string, value: string): Promise<{ data: { id: string }[] | null }>;
      };
    };
  };

  const { data: attempts } = await client
    .from("attempts")
    .select("id")
    .eq("test_id", testId);

  if (!attempts?.length) return [];

  const attemptIds = attempts.map((a) => a.id);
  const { data: responses } = await client
    .from("responses")
    .select("question_id, is_correct, awarded_marks")
    .in("attempt_id", attemptIds);

  return responses ?? [];
}
