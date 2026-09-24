import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-card">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="font-serif text-2xl">
          Carte
        </Link>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/discover" className="text-muted hover:text-ink">
            Discover
          </Link>
          <Link href="/my" className="text-muted hover:text-ink">
            My Carte
          </Link>
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
