"use client";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

type ErrorPageProps = { error: Error & { digest?: string }; reset: () => void };

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-16"
    >
      <p className="eyebrow text-tomato">Error</p>
      <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">
        Something went wrong
      </h1>
      <p className="mt-5 leading-relaxed text-muted">
        This page hit an unexpected problem. Try again, or head back to the start.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-xs text-muted">Error code: {error.digest}</p>
      )}
    </main>
  );
}
