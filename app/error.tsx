"use client";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

type ErrorPageProps = { error: Error & { digest?: string }; reset: () => void };

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-16">
      <h1 className="font-serif text-4xl leading-tight">Something went wrong</h1>
      <p className="mt-3 leading-relaxed text-muted">
        This page hit an unexpected problem. Try again, or head back to the start.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
      {error.digest && <p className="mt-6 text-xs text-muted">Error code: {error.digest}</p>}
    </main>
  );
}
