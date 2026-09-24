import Link from "next/link";
import type { ComponentProps } from "react";

/** Offline pages use document navigation so the service worker can save and reopen them. */
export default function OfflineLink(props: ComponentProps<typeof Link>) {
  const href = props.href;
  if (typeof href !== "string" || !/^\/(r\/|my(?:[?#]|$))/.test(href)) return <Link {...props} />;
  const anchor = { ...props };
  delete anchor.prefetch;
  delete anchor.replace;
  delete anchor.scroll;
  delete anchor.onNavigate;
  return <a {...(anchor as ComponentProps<"a">)} href={href} />;
}
