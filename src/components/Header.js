"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.js";
import { routing } from "../i18n/routing.js";
import { site } from "../lib/site.js";

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span>{site.emoji}</span>
        <span>{site.name}</span>
      </Link>
      <nav>
        <Link href="/">{t("home")}</Link>
        <Link href="/map">{t("map")}</Link>
        <Link href="/blog">{t("blog")}</Link>
        <Link href="/about">{t("about")}</Link>
        {routing.locales.length > 1 && (
          <span className="locale-switch">
            {routing.locales.map((l) => (
              <Link
                key={l}
                href={pathname}
                locale={l}
                className={l === locale ? "active" : ""}
              >
                {l}
              </Link>
            ))}
          </span>
        )}
      </nav>
    </header>
  );
}
