export function SupabaseConfigAlert() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const ok =
    url.includes(".supabase.co") &&
    !url.includes("your-project") &&
    key.length > 20 &&
    !key.includes("your-anon");

  if (ok) return null;

  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive"
    >
      <p className="font-medium">Supabase is not configured on this site</p>
      <p className="mt-1 text-xs">
        The live app was built without valid Supabase keys, so login cannot call{" "}
        <code className="rounded bg-destructive/10 px-1">*.supabase.co</code>.
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
        <li>Vercel → Settings → Environment Variables</li>
        <li>
          Set <strong>Production</strong>:{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        </li>
        <li>Deployments → ⋯ → Redeploy (required after env changes)</li>
      </ol>
    </div>
  );
}
