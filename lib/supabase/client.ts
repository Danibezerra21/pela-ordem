import {
  createBrowserClient,
} from "@supabase/ssr";

export function createClient() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const publishableKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não configurada."
    );
  }

  if (!publishableKey) {
    throw new Error(
      "Chave pública do Supabase não configurada."
    );
  }

  return createBrowserClient(
    url,
    publishableKey
  );
}