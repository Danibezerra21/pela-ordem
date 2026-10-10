"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

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


const CHAVE_USUARIO_ATIVACAO =
  "note-litis.usuario-ativacao";


/* =====================================================
   VALIDAÇÃO DA SENHA
===================================================== */

function senhaForte(
  senha: string
) {
  return (
    senha.length >= 6 &&
    /[a-z]/.test(senha) &&
    /[A-Z]/.test(senha) &&
    /\d/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha)
  );
}


/* =====================================================
   FRAGMENTO RECEBIDO PELO SUPABASE
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
     PREPARA A SESSÃO DE ATIVAÇÃO
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
            O convite TEM prioridade absoluta.

            Não podemos aceitar primeiro uma sessão
            previamente existente no navegador.
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


          /*
            NOVO CONVITE / RECUPERAÇÃO

            Se existem tokens na URL, eles definem
            inequivocamente qual usuário está
            concluindo a ativação.
          */

          if (
            fragmento
              ?.accessToken &&
            fragmento
              ?.refreshToken
          ) {

            const {
              data,
              error,
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


            if (error) {
              throw error;
            }


            if (
              !data
                .user
                ?.id
            ) {
              throw new Error(
                "Não foi possível identificar o usuário deste convite."
              );
            }


            /*
              Guarda somente o ID do usuário cuja
              ativação foi efetivamente validada.

              Nenhum token é armazenado manualmente.
            */

            window
              .sessionStorage
              .setItem(
                CHAVE_USUARIO_ATIVACAO,
                data.user.id
              );


            /*
              Retira access_token e refresh_token
              da barra de endereço.
            */

            window
              .history
              .replaceState(
                {},
                document.title,
                window
                  .location
                  .pathname +
                  window
                    .location
                    .search
              );


            if (ativo) {
              setEstado(
                "pronto"
              );
            }


            return;
          }


          /*
            Se a página foi atualizada depois de os
            tokens terem sido removidos da URL,
            somente aceitamos continuar se houver
            uma ativação iniciada nesta aba E a
            sessão atual pertencer ao mesmo usuário.
          */

          const usuarioEsperado =
            window
              .sessionStorage
              .getItem(
                CHAVE_USUARIO_ATIVACAO
              );


          if (
            !usuarioEsperado
          ) {
            throw new Error(
              "Não foi encontrada uma ativação válida. Abra novamente o link recebido por e-mail."
            );
          }


          const {
            data:
              dadosUsuario,

            error:
              erroUsuario,
          } =
            await supabase
              .auth
              .getUser();


          if (erroUsuario) {
            throw erroUsuario;
          }


          if (
            !dadosUsuario
              .user ||
            dadosUsuario
              .user
              .id !==
              usuarioEsperado
          ) {

            window
              .sessionStorage
              .removeItem(
                CHAVE_USUARIO_ATIVACAO
              );


            throw new Error(
              "A sessão atual não corresponde ao usuário deste convite. Abra novamente o link recebido por e-mail."
            );
          }


          if (ativo) {
            setEstado(
              "pronto"
            );
          }

        } catch (erro) {

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
      FormEvent<HTMLFormElement>
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


      const usuarioEsperado =
        window
          .sessionStorage
          .getItem(
            CHAVE_USUARIO_ATIVACAO
          );


      if (
        !usuarioEsperado
      ) {
        throw new Error(
          "Sua sessão de ativação não é válida. Abra novamente o link recebido por e-mail."
        );
      }


      /*
        Não usamos apenas getSession().

        Confirmamos com o servidor quem é
        efetivamente o usuário autenticado.
      */

      const {
        data:
          dadosUsuario,

        error:
          erroUsuario,
      } =
        await supabase
          .auth
          .getUser();


      if (erroUsuario) {
        throw erroUsuario;
      }


      if (
        !dadosUsuario
          .user ||
        dadosUsuario
          .user
          .id !==
          usuarioEsperado
      ) {
        throw new Error(
          "A sessão autenticada não corresponde ao usuário que recebeu este convite."
        );
      }


      /*
        GRAVA A SENHA
      */

      const {
        data:
          usuarioAtualizado,

        error:
          erroSenha,
      } =
        await supabase
          .auth
          .updateUser({
            password:
              senha,
          });


      if (erroSenha) {
        throw erroSenha;
      }


      if (
        !usuarioAtualizado
          .user ||
        usuarioAtualizado
          .user
          .id !==
          usuarioEsperado
      ) {
        throw new Error(
          "Não foi possível confirmar a atualização da senha."
        );
      }


      /*
        A ativação terminou.
      */

      window
        .sessionStorage
        .removeItem(
          CHAVE_USUARIO_ATIVACAO
        );


      setEstado(
        "concluido"
      );


      /*
        IMPORTANTE:

        Não aproveitamos a sessão temporária
        recebida pelo convite.

        O usuário precisa provar que a senha
        recém-criada funciona realizando um
        login normal.
      */

      const {
        error:
          erroLogout,
      } =
        await supabase
          .auth
          .signOut({
            scope:
              "local",
          });


      if (erroLogout) {
        throw erroLogout;
      }


      window
        .location
        .replace(
          "/auth/login?ativado=1"
        );

    } catch (erro) {

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
            Solicite ao administrador da sua empresa a verificação do acesso ou o envio de um novo convite.
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


        {mensagem && (

          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {mensagem}
          </div>

        )}


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
              "Criar senha"
            )}

          </button>

        </form>

      </section>

    </main>
  );
}