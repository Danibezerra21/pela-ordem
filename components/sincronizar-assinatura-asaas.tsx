"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type StatusAsaas = {
  ok?: boolean;
  status?: string;
  reconciliado?: boolean;
};

export function SincronizarAssinaturaAsaas() {
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;
    let tentativas = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function verificar() {
      if (cancelado) {
        return;
      }

      tentativas += 1;

      try {
        const resposta = await fetch(
          "/api/asaas/status",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const dados =
          (await resposta.json()) as StatusAsaas;

        if (cancelado) {
          return;
        }

        /*
         * Só atualizamos a página quando ESTA chamada
         * efetivamente reconciliou o pagamento.
         *
         * Isso evita loop de refresh quando a
         * assinatura já estava ativa.
         */
        if (
          dados.status === "ativa" &&
          dados.reconciliado === true
        ) {
          router.refresh();
          return;
        }

        /*
         * Não existe contratação aguardando.
         * Não há motivo para continuar consultando.
         */
        if (dados.status === "sem_contratacao") {
          return;
        }

        /*
         * Pagamento ainda está sendo processado.
         * Consulta novamente por até 2 minutos.
         */
        if (
          dados.status === "processando" &&
          tentativas < 24
        ) {
          timer = setTimeout(
            verificar,
            5000
          );
        }
      } catch (error) {
        console.error(
          "Erro ao sincronizar assinatura:",
          error
        );

        if (
          !cancelado &&
          tentativas < 24
        ) {
          timer = setTimeout(
            verificar,
            5000
          );
        }
      }
    }

    verificar();

    return () => {
      cancelado = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [router]);

  return null;
}