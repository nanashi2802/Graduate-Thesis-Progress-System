"use client";
// The sidebar links of the app shell (DESIGN.md §5.1). The active item has a 3 px maroon left marker and maroon text.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

export function NavLinks({ items, className }: { items: readonly NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <ul className={cn("flex flex-col", className)}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center border-l-[3px] px-4 text-sm outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring",
                active ? "border-primary font-semibold text-link" : "border-transparent text-foreground hover:bg-border",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
