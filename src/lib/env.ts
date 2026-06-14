const PLACEHOLDER_HOSTS = ["your-project.supabase.co", "xxxxxxxx.supabase.co"];

export function getSupabaseAnonEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel, then Redeploy."
    );
  }

  if (
    PLACEHOLDER_HOSTS.some((h) => url.includes(h)) ||
    anonKey.includes("your-anon-key")
  ) {
    throw new Error(
      "Supabase env vars are still placeholders. Use real values from Supabase → API, then Redeploy on Vercel."
    );
  }

  return { url, anonKey };
}

export function getAppUrl(fallback?: string) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    fallback ??
    "http://localhost:3000"
  );
}

export type ResendConfig = {
  apiKey: string;
  fromEmail: string;
};

export function getResendConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !fromEmail) return null;
  if (apiKey.includes("xxxxxxxx") || apiKey.length < 10) return null;

  return { apiKey, fromEmail };
}

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const portStr = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || user || "";

  if (!host || !portStr || !user || !pass) return null;

  const port = parseInt(portStr, 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    fromEmail,
  };
}

