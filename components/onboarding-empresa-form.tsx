"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CircleCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TipoDocumento =
  | "cpf"
  | "cnpj";

function somenteDigitos(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function formatarCPF(
  valor: string
) {
  const numeros =
    somenteDigitos(
      valor
    ).slice(
      0,
      11
    );

  return numeros
    .replace(
      /^(\d{3})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /(\d{3})(\d{1,2})$/,
      "$1-$2"
    );
}

function formatarCNPJ(
  valor: string
) {
  const numeros =
    somenteDigitos(
      valor
    ).slice(
      0,
      14
    );

  return numeros
    .replace(
      /^(\d{2})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2"
    )
    .replace(
      /(\d{4})(\d{1,2})$/,
      "$1-$2"
    );
}

function cpfValido(
  cpfOriginal: string
) {
  const cpf =
    somenteDigitos(
      cpfOriginal
    );

  if (
    cpf.length !== 11 ||
    /^(\d)\1+$/.test(
      cpf
    )
  ) {
    return false;
  }

  const calcular = (
    tamanho: number
  ) => {
    let soma = 0;

    for (
      let i = 0;
      i < tamanho;
      i += 1
    ) {
      soma +=
        Number(
          cpf[i]
        ) *
        (
          tamanho +
          1 -
          i
        );
    }

    const resto =
      (
        soma *
        10
      ) %
      11;

    return resto === 10
      ? 0
      : resto;
  };

  return (
    calcular(9) ===
      Number(
        cpf[9]
      ) &&
    calcular(10) ===
      Number(
        cpf[10]
      )
  );
}

function cnpjValido(
  cnpjOriginal: string
) {
  const cnpj =
    somenteDigitos(
      cnpjOriginal
    );

  if (
    cnpj.length !== 14 ||
    /^(\d)\1+$/.test(
      cnpj
    )
  ) {
    return false;
  }

  const calcular = (
    base: string,
    pesos: number[]
  ) => {
    const soma =
      base
        .split("")
        .reduce(
          (
            total,
            digito,
            indice
          ) =>
            total +
            Number(
              digito
            ) *
              pesos[
                indice
              ],
          0
        );

    const resto =
      soma %
      11;

    return resto < 2
      ? 0
      : 11 -
          resto;
  };

  const primeiro =
    calcular(
      cnpj.slice(
        0,
        12
      ),
      [
        5, 4, 3, 2,
        9, 8, 7, 6,
        5, 4, 3, 2,
      ]
    );

  const segundo =
    calcular(
      cnpj.slice(
        0,
        12
      ) +
        primeiro,
      [
        6, 5, 4, 3,
        2, 9, 8, 7,
        6, 5, 4, 3,
        2,
      ]
    );

  return (
    primeiro ===
      Number(
        cnpj[12]
      ) &&
    segundo ===
      Number(
        cnpj[13]
      )
  );
}

function obterMensagemErro(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const mensagem =
      (
        error as {
          message?: unknown;
        }
      ).message;

    if (
      typeof mensagem ===
        "string" &&
      mensagem.trim()
    ) {
      return mensagem;
    }
  }

  return "Não foi possível concluir o cadastro.";
}

export function OnboardingEmpresaForm() {
  const router =
    useRouter();

  const [
    nomeEmpresa,
    setNomeEmpresa,
  ] =
    useState("");

  const [
    tipoDocumento,
    setTipoDocumento,
  ] =
    useState<TipoDocumento>(
      "cnpj"
    );

  const [
    documento,
    setDocumento,
  ] =
    useState("");

  const [
    erro,
    setErro,
  ] =
    useState<
      string | null
    >(null);

  const [
    carregando,
    setCarregando,
  ] =
    useState(false);

  function alterarTipo(
    tipo: TipoDocumento
  ) {
    setTipoDocumento(
      tipo
    );

    setDocumento(
      ""
    );

    setErro(
      null
    );
  }

  function alterarDocumento(
    valor: string
  ) {
    setDocumento(
      tipoDocumento ===
        "cpf"
        ? formatarCPF(
            valor
          )
        : formatarCNPJ(
            valor
          )
    );
  }

  async function concluir(
    evento:
      React.FormEvent
  ) {
    evento.preventDefault();

    setErro(
      null
    );

    const nome =
      nomeEmpresa
        .trim()
        .replace(
          /\s+/g,
          " "
        );

    if (
      nome.length < 2
    ) {
      setErro(
        "Informe o nome do escritório ou empresa."
      );

      return;
    }

    const documentoLimpo =
      somenteDigitos(
        documento
      );

    if (
      tipoDocumento ===
        "cpf" &&
      !cpfValido(
        documentoLimpo
      )
    ) {
      setErro(
        "Informe um CPF válido."
      );

      return;
    }

    if (
      tipoDocumento ===
        "cnpj" &&
      !cnpjValido(
        documentoLimpo
      )
    ) {
      setErro(
        "Informe um CNPJ válido."
      );

      return;
    }

    setCarregando(
      true
    );

    try {
      const supabase =
        createClient();

      const {
        error:
          rpcError,
      } =
        await supabase
          .rpc(
            "criar_empresa_inicial",
            {
              p_nome_empresa:
                nome,

              p_tipo_documento:
                tipoDocumento,

              p_documento:
                documentoLimpo,
            }
          );

      if (
        rpcError
      ) {
        console.error(
          "Erro ao criar empresa inicial:",
          rpcError
        );

        setErro(
          rpcError.message ||
            "Não foi possível concluir o cadastro."
        );

        return;
      }

      router.replace(
        "/protected"
      );

      router.refresh();
    } catch (
      error: unknown
    ) {
      console.error(
        "Erro inesperado no onboarding:",
        error
      );

      setErro(
        obterMensagemErro(
          error
        )
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl border">
          <Building2 className="h-5 w-5" />
        </div>

        <CardTitle className="text-2xl">
          Configure seu escritório
        </CardTitle>

        <CardDescription>
          Falta apenas identificar
          a conta que utilizará o
          NOTE LITIS.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={
            concluir
          }
          className="space-y-6"
        >
          <div className="grid gap-2">
            <Label
              htmlFor="empresa"
            >
              Nome do escritório
              ou empresa
            </Label>

            <Input
              id="empresa"
              value={
                nomeEmpresa
              }
              onChange={(
                e
              ) =>
                setNomeEmpresa(
                  e.target
                    .value
                )
              }
              placeholder="Ex.: Silva Advocacia"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>
              Documento da conta
            </Label>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={
                  tipoDocumento ===
                  "cnpj"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  alterarTipo(
                    "cnpj"
                  )
                }
              >
                CNPJ
              </Button>

              <Button
                type="button"
                variant={
                  tipoDocumento ===
                  "cpf"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  alterarTipo(
                    "cpf"
                  )
                }
              >
                CPF
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="documento"
            >
              {tipoDocumento ===
              "cpf"
                ? "CPF"
                : "CNPJ"}
            </Label>

            <Input
              id="documento"
              inputMode="numeric"
              value={
                documento
              }
              onChange={(
                e
              ) =>
                alterarDocumento(
                  e.target
                    .value
                )
              }
              placeholder={
                tipoDocumento ===
                "cpf"
                  ? "000.000.000-00"
                  : "00.000.000/0000-00"
              }
              required
            />

            <p className="text-xs leading-5 text-muted-foreground">
              O número completo do CPF ou CNPJ não ficará armazenado no cadastro.
              O documento será utilizado para identificar a conta e verificar a
              elegibilidade ao período gratuito.
            </p>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="flex gap-3">
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-medium">
                  7 dias gratuitos
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  O período gratuito
                  começará quando você
                  concluir esta etapa.
                  Nenhuma cobrança será
                  realizada durante o
                  teste.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm leading-6 text-muted-foreground">
              Você será cadastrado
              como usuário Master
              desta conta e poderá
              gerenciar os demais
              acessos do escritório.
            </p>
          </div>

          {erro && (
            <p className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              carregando
            }
          >
            {carregando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              "Começar período gratuito"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}