"use client";

import type {
  ButtonHTMLAttributes,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import {
  Loader2,
} from "lucide-react";


type LoadingButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?:
      boolean;

    loadingText?:
      string;
  };


export function LoadingButton({
  children,
  loading,
  loadingText = "Carregando...",
  disabled,
  className = "",
  type = "button",
  ...props
}: LoadingButtonProps) {
  const {
    pending,
  } =
    useFormStatus();


  const carregando =
    loading ??
    (
      type === "submit"
        ? pending
        : false
    );


  return (
    <button
      {...props}
      type={
        type
      }
      disabled={
        disabled ||
        carregando
      }
      aria-disabled={
        disabled ||
        carregando
      }
      aria-busy={
        carregando
      }
      data-loading={
        carregando
          ? "true"
          : "false"
      }
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {carregando ? (
        <>
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />

          <span>
            {loadingText}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}