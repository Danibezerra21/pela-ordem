"use client";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  cn,
} from "@/lib/utils";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";


function senhaValida(
  senha: string
) {
  return (
    senha.length >= 6 &&
    /[A-Z]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[^A-Za-z0-9]/.test(
      senha
    )
  );
}


export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [
    nome,
    setNome,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    repeatPassword,
    setRepeatPassword,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const router =
    useRouter();


  const handleSignUp =
    async (
      e:
        React.FormEvent
    ) => {
      e.preventDefault();

      setError(null);


      const nomeLimpo =
        nome
          .trim()
          .replace(
            /\s+/g,
            " "
          );


      if (
        nomeLimpo.length <
        2
      ) {
        setError(
          "Informe seu nome."
        );
        return;
      }


      if (
        password !==
        repeatPassword
      ) {
        setError(
          "As senhas não coincidem."
        );
        return;
      }


      if (
        !senhaValida(
          password
        )
      ) {
        setError(
          "A senha deve ter pelo menos 6 caracteres, com letra maiúscula, minúscula, número e caractere especial."
        );
        return;
      }


      setIsLoading(
        true
      );


      try {
        const supabase =
          createClient();


        const {
          error:
            signUpError,
        } =
          await supabase
            .auth
            .signUp({
              email:
                email.trim(),
              password,

              options: {
                data: {
                  nome:
                    nomeLimpo,
                },

                emailRedirectTo:
                  `${window.location.origin}/protected`,
              },
            });


        if (
          signUpError
        ) {
          throw signUpError;
        }


        router.push(
          "/auth/sign-up-success"
        );
      } catch (
        erro:
          unknown
      ) {
        setError(
          erro instanceof
            Error
            ? erro.message
            : "Não foi possível concluir o cadastro."
        );
      } finally {
        setIsLoading(
          false
        );
      }
    };


  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Criar conta
          </CardTitle>

          <CardDescription>
            Comece seu período
            gratuito no NOTE LITIS.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={
              handleSignUp
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label
                  htmlFor="nome"
                >
                  Seu nome
                </Label>

                <Input
                  id="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Nome completo"
                  required
                  value={nome}
                  onChange={(
                    e
                  ) =>
                    setNome(
                      e.target
                        .value
                    )
                  }
                />
              </div>


              <div className="grid gap-2">
                <Label
                  htmlFor="email"
                >
                  E-mail
                </Label>

                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@escritorio.com.br"
                  required
                  value={
                    email
                  }
                  onChange={(
                    e
                  ) =>
                    setEmail(
                      e.target
                        .value
                    )
                  }
                />
              </div>


              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                >
                  Senha
                </Label>

                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={
                    password
                  }
                  onChange={(
                    e
                  ) =>
                    setPassword(
                      e.target
                        .value
                    )
                  }
                />

                <p className="text-xs text-muted-foreground">
                  Mínimo de 6
                  caracteres, com
                  maiúscula,
                  minúscula, número
                  e caractere
                  especial.
                </p>
              </div>


              <div className="grid gap-2">
                <Label
                  htmlFor="repeat-password"
                >
                  Confirmar senha
                </Label>

                <Input
                  id="repeat-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={
                    repeatPassword
                  }
                  onChange={(
                    e
                  ) =>
                    setRepeatPassword(
                      e.target
                        .value
                    )
                  }
                />
              </div>


              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}


              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading
                }
              >
                {isLoading
                  ? "Criando conta..."
                  : "Criar conta"}
              </Button>
            </div>


            <div className="mt-5 text-center text-sm">
              Já possui uma conta?{" "}

              <Link
                href="/auth/login"
                className="underline underline-offset-4"
              >
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}