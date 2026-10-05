import type {
  ReactNode,
} from "react";

import {
  exigirPermissao,
} from "@/lib/permissoes";

export default async function FinanceiroLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  await exigirPermissao(
    "financeiro.visualizar"
  );

  return (
    <>
      {children}
    </>
  );
}