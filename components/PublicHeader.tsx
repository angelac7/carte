import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-card">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-serif text-2xl">
          Carte
        </Link>
        <div className="flex gap-5 text-sm">
          <Link href="/login" className="text-muted hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className="text-muted hover:text-ink">
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}
