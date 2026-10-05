import type {
  ReactNode,
} from "react";

import {
  exigirMaster,
} from "@/lib/permissoes";

export default async function UsuariosLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  await exigirMaster();

  return (
    <>
      {children}
    </>
  );
}