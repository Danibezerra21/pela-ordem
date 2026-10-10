import type {
  ReactNode,
} from "react";

import {
  exigirPermissao,
} from "@/lib/permissoes";

export default async function NovaDiligenciaLayout({
  children,
}: {
  children: ReactNode;
}) {
  await exigirPermissao(
    "diligencias.criar"
  );

  return (
    <>
      {children}
    </>
  );
}