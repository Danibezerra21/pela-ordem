"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";

type EstadoPagina =
  | "carregando"
  | "pronto"
  | "salvando"
  | "erro"
  | "concluido";

/* =====================================================
   VALIDAÇÃO DA SENHA
===================================================== */

function senhaForte(
  senha: string
) {
  return (
    senha.length >= 6 &&
    /[a-z]/.test(
      senha
    ) &&
    /[A-Z]/.test(
      senha
    ) &&
    /\d/.test(
      senha
    ) &&
    /[^A-Za-z0-9]/.test(
      senha
    )
  );
}

/* =====================================================
   SESSÃO RECEBIDA PELO CONVITE PADRÃO DO SUPABASE
===================================================== */

function lerFragmentoConvite() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const hash =
    window.location.hash.replace(
      /^#/,
      ""
    );

  if (!hash) {
    return null;
  }

  const parametros =
    new URLSearchParams(
      hash
    );

  return {
    accessToken:
      parametros.get(
        "access_token"
      ),

    refreshToken:
      parametros.get(
        "refresh_token"
      ),

    erro:
      parametros.get(
        "error"
      ),

    descricaoErro:
      parametros.get(
        "error_description"
      ),
  };
}

/* =====================================================
   PÁGINA
===================================================== */

export default function DefinirSenhaPage() {
  const router =
    useRouter();

  const [
    estado,
    setEstado,
  ] =
    useState<EstadoPagina>(
      "carregando"
    );

  const [
    mensagem,
    setMensagem,
  ] =
    useState("");

  const [
    senha,
    setSenha,
  ] =
    useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] =
    useState("");

  /* ===================================================
     PREPARA A SESSÃO DO CONVITE
  =================================================== */

  useEffect(
    () => {
      let ativo =
        true;

      async function prepararSessao() {
        try {
          const supabase =
            createClient();

          /*
            Primeiro verifica se a sessão
            já foi gravada anteriormente.

            Isso permite atualizar a página
            sem perder o fluxo.
          */

          const {
            data:
              sessaoAtual,

            error:
              erroSessaoAtual,
          } =
            await supabase
              .auth
              .getSession();

          if (
            erroSessaoAtual
          ) {
            throw erroSessaoAtual;
          }

          if (
            sessaoAtual
              .session
          ) {
            if (ativo) {
              setEstado(
                "pronto"
              );
            }

            return;
          }

          /*
            O template padrão do Supabase
            envia access_token e refresh_token
            no fragmento da URL.
          */

          const fragmento =
            lerFragmentoConvite();

          if (
            fragmento?.erro
          ) {
            throw new Error(
              fragmento
                .descricaoErro ??
                "Não foi possível validar o convite."
            );
          }

          if (
            !fragmento
              ?.accessToken ||
            !fragmento
              ?.refreshToken
          ) {
            throw new Error(
              "Não foi encontrada uma sessão válida para este convite. Ele pode ter expirado ou já ter sido utilizado."
            );
          }

          /*
            Converte os tokens recebidos
            no convite em uma sessão válida
            do Supabase no navegador.
          */

          const {
            error:
              erroDefinirSessao,
          } =
            await supabase
              .auth
              .setSession({
                access_token:
                  fragmento
                    .accessToken,

                refresh_token:
                  fragmento
                    .refreshToken,
              });

          if (
            erroDefinirSessao
          ) {
            throw erroDefinirSessao;
          }

          /*
            Remove os tokens da barra
            de endereço por segurança.
          */

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname +
              window.location.search
          );

          if (ativo) {
            setEstado(
              "pronto"
            );
          }
        } catch (
          erro
        ) {
          if (!ativo) {
            return;
          }

          setMensagem(
            erro instanceof Error
              ? erro.message
              : "Não foi possível validar o convite."
          );

          setEstado(
            "erro"
          );
        }
      }

      prepararSessao();

      return () => {
        ativo =
          false;
      };
    },
    []
  );

  /* ===================================================
     SALVAR NOVA SENHA
  =================================================== */

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensagem("");

    if (
      senha !==
      confirmarSenha
    ) {
      setMensagem(
        "As senhas informadas não coincidem."
      );

      return;
    }

    if (
      !senhaForte(
        senha
      )
    ) {
      setMensagem(
        "A senha deve possuir pelo menos 6 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial."
      );

      return;
    }

    try {
      setEstado(
        "salvando"
      );

      const supabase =
        createClient();

      const {
        data:
          sessaoAtual,

        error:
          erroSessao,
      } =
        await supabase
          .auth
          .getSession();

      if (
        erroSessao
      ) {
        throw erroSessao;
      }

      if (
        !sessaoAtual
          .session
      ) {
        throw new Error(
          "Sua sessão de ativação expirou. Solicite um novo convite ao administrador."
        );
      }

      const {
        error:
          erroSenha,
      } =
        await supabase
          .auth
          .updateUser({
            password:
              senha,
          });

      if (
        erroSenha
      ) {
        throw erroSenha;
      }

      setEstado(
        "concluido"
      );

      /*
        Faz os Server Components
        reconhecerem a sessão atual.
      */

      router.refresh();

      router.replace(
        "/protected"
      );
    } catch (
      erro
    ) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível definir a senha."
      );

      setEstado(
        "pronto"
      );
    }
  }

  /* ===================================================
     CARREGANDO
  =================================================== */

  if (
    estado ===
    "carregando"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <section className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
          <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-[#0b1f3a]" />

          <h1 className="mt-5 text-xl font-semibold">
            Validando convite
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Estamos preparando seu acesso ao NOTE LITIS.
          </p>
        </section>
      </main>
    );
  }

  /* ===================================================
     CONVITE INVÁLIDO
  =================================================== */

  if (
    estado ===
    "erro"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <section className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-700" />
          </div>

          <p className="mt-6 text-sm font-medium text-muted-foreground">
            NOTE LITIS
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            Convite indisponível
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {mensagem}
          </p>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Solicite ao administrador da sua empresa a verificação do seu acesso ou o envio de um novo convite.
          </p>
        </section>
      </main>
    );
  }

  /* ===================================================
     FORMULÁRIO
  =================================================== */

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1f3a] text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>

        <p className="mt-6 text-sm font-medium text-muted-foreground">
          NOTE LITIS
        </p>

        <h1 className="mt-1 text-2xl font-bold">
          Defina sua senha
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Seu acesso foi autorizado por uma empresa usuária do NOTE LITIS. Defina sua senha para concluir a ativação.
        </p>

        {/* REQUISITOS */}

        <div className="mt-6 rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            A senha deve possuir:
          </p>

          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />

              Pelo menos 6 caracteres
            </p>

            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />

              Uma letra maiúscula e uma minúscula
            </p>

            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />

              Pelo menos um número
            </p>

            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />

              Pelo menos um caractere especial
            </p>
          </div>
        </div>

        {/* ERRO */}

        {mensagem && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {mensagem}
          </div>
        )}

        {/* FORMULÁRIO */}

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-6 space-y-4"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">
              Nova senha
            </span>

            <input
              type="password"
              value={
                senha
              }
              onChange={(
                event
              ) =>
                setSenha(
                  event
                    .target
                    .value
                )
              }
              required
              minLength={6}
              autoComplete="new-password"
              disabled={
                estado ===
                "salvando"
              }
              className="w-full rounded-lg border bg-background px-3 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">
              Confirmar senha
            </span>

            <input
              type="password"
              value={
                confirmarSenha
              }
              onChange={(
                event
              ) =>
                setConfirmarSenha(
                  event
                    .target
                    .value
                )
              }
              required
              minLength={6}
              autoComplete="new-password"
              disabled={
                estado ===
                "salvando"
              }
              className="w-full rounded-lg border bg-background px-3 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <button
            type="submit"
            disabled={
              estado ===
              "salvando" ||
              estado ===
              "concluido"
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {estado ===
            "salvando" ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />

                Salvando...
              </>
            ) : estado ===
              "concluido" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />

                Senha criada
              </>
            ) : (
              "Criar senha e acessar"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}