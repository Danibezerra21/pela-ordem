"use server";

import { redirect } from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";


export async function sair() {

  const supabase =
    await createClient();


  const {
    error,
  } =
    await supabase
      .auth
      .signOut();


  if (error) {
    throw new Error(
      `Não foi possível encerrar a sessão: ${error.message}`
    );
  }


  redirect(
    "/auth/login"
  );
}