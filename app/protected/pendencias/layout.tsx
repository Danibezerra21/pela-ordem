import type {
  ReactNode,
} from "react";

import {
  exigirPermissao,
} from "@/lib/permissoes";

export default async function PendenciasLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  await exigirPermissao(
    "pendencias.visualizar"
  );

  return (
    <>
      {children}
    </>
  );
}