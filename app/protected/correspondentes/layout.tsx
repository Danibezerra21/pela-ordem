import type {
  ReactNode,
} from "react";

import {
  exigirPermissao,
} from "@/lib/permissoes";

export default async function CorrespondentesLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  await exigirPermissao(
    "correspondentes.visualizar"
  );

  return (
    <>
      {children}
    </>
  );
}