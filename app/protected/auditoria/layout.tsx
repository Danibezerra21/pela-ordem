import type {
  ReactNode,
} from "react";

import {
  exigirPermissao,
} from "@/lib/permissoes";

export default async function AuditoriaLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  await exigirPermissao(
    "auditoria.visualizar"
  );

  return (
    <>
      {children}
    </>
  );
}