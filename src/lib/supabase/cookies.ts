/** Cookie options compatible with Next.js ResponseCookies and Supabase SSR. */
export type SupabaseCookieOptions = {
  path?: string;
  maxAge?: number;
  domain?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
  expires?: Date;
  partitioned?: boolean;
};

export type CookieToSet = {
  name: string;
  value: string;
  options?: SupabaseCookieOptions;
};
