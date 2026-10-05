import type {
  ReactNode,
} from "react";

import {
  exigirPermissao,
} from "@/lib/permissoes";

export default async function ImportacoesLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  await exigirPermissao(
    "importacoes.visualizar"
  );

  return (
    <>
      {children}
    </>
  );
}