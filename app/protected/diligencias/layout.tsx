import type {
  ReactNode,
} from "react";

import {
  exigirPermissao,
} from "@/lib/permissoes";

export default async function DiligenciasLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  await exigirPermissao(
    "diligencias.visualizar"
  );

  return (
    <>
      {children}
    </>
  );
}