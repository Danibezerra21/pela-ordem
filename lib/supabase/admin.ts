import "server-only";

import {
  createClient as createSupabaseClient,
} from "@supabase/supabase-js";

export function createAdminClient() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const secretKey =
    process.env
      .SUPABASE_SECRET_KEY ??
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não configurada."
    );
  }

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY não configurada."
    );
  }

  return createSupabaseClient(
    url,
    secretKey,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,

        detectSessionInUrl:
          false,
      },
    }
  );
}