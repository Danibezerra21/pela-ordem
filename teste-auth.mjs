import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function carregarEnv() {
  const conteudo = readFileSync(".env.local", "utf8");
  const resultado = {};

  for (const linhaBruta of conteudo.split(/\r?\n/)) {
    const linha = linhaBruta.trim();

    if (!linha || linha.startsWith("#")) {
      continue;
    }

    const indice = linha.indexOf("=");

    if (indice <= 0) {
      continue;
    }

    const chave = linha.slice(0, indice).trim();
    let valor = linha.slice(indice + 1).trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    resultado[chave] = valor;
  }

  return resultado;
}

const env = carregarEnv();

const supabaseUrl =
  env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Não encontrei as variáveis públicas do Supabase no .env.local."
  );

  process.exit(1);
}

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

if (!email || !password) {
  console.error(
    "Informe TEST_EMAIL e TEST_PASSWORD antes de executar."
  );

  process.exit(1);
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

const {
  data,
  error,
} = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  console.log({
    sucesso: false,
    message: error.message,
    status: error.status,
    code: error.code,
  });

  process.exit(0);
}

console.log({
  sucesso: true,
  usuario_id: data.user?.id,
  email: data.user?.email,
});

await supabase.auth.signOut();