import type {
  ReactNode,
} from "react";

import {
  exigirPermissao,
} from "@/lib/permissoes";

export default async function EditarDiligenciaLayout({
  children,
}: {
  children: ReactNode;
}) {
  await exigirPermissao(
    "diligencias.editar"
  );

  return (
    <>
      {children}
    </>
  );
}