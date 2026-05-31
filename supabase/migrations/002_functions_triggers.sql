-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER attempts_updated_at
  BEFORE UPDATE ON public.attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER responses_updated_at
  BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role public.user_role;
  meta_name TEXT;
BEGIN
  meta_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    meta_role := 'admin';
  ELSE
    meta_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, meta_name, meta_role)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Role helpers for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'student'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Lock published tests once any attempt exists
CREATE OR REPLACE FUNCTION public.lock_test_on_first_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.tests
  SET is_locked = true, updated_at = now()
  WHERE id = NEW.test_id AND is_locked = false;
  RETURN NEW;
END;
$$;

CREATE TRIGGER attempts_lock_test
  AFTER INSERT ON public.attempts
  FOR EACH ROW EXECUTE FUNCTION public.lock_test_on_first_attempt();

-- Prevent editing locked tests (questions) at DB level
CREATE OR REPLACE FUNCTION public.prevent_locked_test_question_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  locked BOOLEAN;
BEGIN
  SELECT is_locked INTO locked FROM public.tests WHERE id = COALESCE(NEW.test_id, OLD.test_id);
  IF locked THEN
    RAISE EXCEPTION 'Test is locked because students have started attempts';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER questions_prevent_locked_changes
  BEFORE INSERT OR UPDATE OR DELETE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_test_question_changes();

CREATE OR REPLACE FUNCTION public.prevent_locked_test_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_locked AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.instructions IS DISTINCT FROM NEW.instructions OR
    OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes
  ) THEN
    RAISE EXCEPTION 'Cannot modify core fields of a locked test';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tests_prevent_locked_core_updates
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_test_updates();
