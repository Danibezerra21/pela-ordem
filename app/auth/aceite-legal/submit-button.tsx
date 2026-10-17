"use client";

import {
  useFormStatus,
} from "react-dom";

import {
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

export function SubmitButton() {
  const {
    pending,
  } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={
        pending
      }
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Registrando aceite...
        </>
      ) : (
        <>
          <ShieldCheck className="h-4 w-4" />
          Aceitar e continuar
        </>
      )}
    </button>
  );
}
