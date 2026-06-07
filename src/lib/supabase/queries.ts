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

export async function countStudents(supabase: unknown, teacherId?: string): Promise<number> {
  const client = supabase as any;
  let query = client
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  if (teacherId) {
    query = query.eq("created_by", teacherId);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function listTestsForAdmin(supabase: unknown, teacherId?: string): Promise<TestListItem[]> {
  const client = supabase as any;
  let query = client
    .from("tests")
    .select("id, title, status, created_at");

  if (teacherId) {
    query = query.eq("created_by", teacherId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

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
        id: p?.id ?? attempt.student_id,
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
  const client = supabase as any;

  const { data: attempts } = await client
    .from("attempts")
    .select("id")
    .eq("test_id", testId);

  if (!attempts?.length) return [];

  const attemptIds = attempts.map((a: any) => a.id);
  const { data: responses } = await client
    .from("responses")
    .select("attempt_id, question_id, is_correct, awarded_marks, time_spent_seconds, selected_option, numeric_answer, status")
    .in("attempt_id", attemptIds);

  return responses ?? [];
}

export async function listProfilesForAdmin(
  supabase: unknown,
  teacherId?: string
): Promise<Profile[]> {
  const client = supabase as any;
  let query = client
    .from("profiles")
    .select("id, email, full_name, role, created_by, created_at, updated_at");

  if (teacherId) {
    query = query.or(`created_by.eq.${teacherId},id.eq.${teacherId}`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) {
    if (error) {
      console.error("Error in listProfilesForAdmin:", error);
    }
    return [];
  }

  return data.map((p: any) => {
    let username = null;
    if (p.email) {
      username = p.email.split("@")[0];
    }
    return {
      ...p,
      username,
    };
  }) as Profile[];
}

export async function listAllAttemptsForAdmin(
  supabase: unknown,
  teacherId?: string
): Promise<Attempt[]> {
  const client = supabase as any;

  if (teacherId) {
    // 1. Get student profiles created by this teacher
    const { data: students, error: studentError } = await client
      .from("profiles")
      .select("id")
      .eq("created_by", teacherId);

    if (studentError || !students?.length) return [];

    const studentIds = students.map((s: any) => s.id);

    // 2. Get attempts for those students
    const { data, error } = await client
      .from("attempts")
      .select("*")
      .in("student_id", studentIds)
      .order("started_at", { ascending: false });

    if (error || !data) return [];
    return data;
  } else {
    const { data, error } = await client
      .from("attempts")
      .select("*")
      .order("started_at", { ascending: false });

    if (error || !data) return [];
    return data;
  }
}

export async function getTestVisibilityForAdmin(
  supabase: unknown,
  testId: string
): Promise<string[]> {
  const client = supabase as {
    from(table: "test_visibility"): {
      select(columns: string): {
        eq(
          column: string,
          value: string
        ): Promise<{ data: { student_id: string }[] | null; error: { message: string } | null }>;
      };
    };
  };

  const { data, error } = await client
    .from("test_visibility")
    .select("student_id")
    .eq("test_id", testId);

  if (error || !data) return [];
  return data.map((d) => d.student_id);
}


