"use client";

import {
  LoaderCircle,
  Pencil,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useTransition,
} from "react";

export function BotaoEditarDiligencia({
  diligenciaId,
}: {
  diligenciaId: string;
}) {
  const router =
    useRouter();

  const [
    carregando,
    iniciarTransicao,
  ] = useTransition();

  function editar() {
    iniciarTransicao(() => {
      router.push(
        `/protected/diligencias/${diligenciaId}/editar`
      );
    });
  }

  return (
    <button
      type="button"
      onClick={editar}
      disabled={carregando}
      className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-70"
    >
      {carregando ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Pencil className="h-4 w-4" />
      )}

      {carregando
        ? "Abrindo edição..."
        : "Editar diligência"}
    </button>
  );
}