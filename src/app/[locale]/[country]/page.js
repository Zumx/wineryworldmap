import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "../../../i18n/navigation.js";
import { site } from "../../../lib/site.js";
import { listCountries, countryBySlug } from "../../../lib/data.js";

export async function generateStaticParams() {
  const countries = await listCountries();
  return countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }) {
  const { country } = await params;
  const data = await countryBySlug(country);
  if (!data) return {};
  return {
    title: `${site.mappedNoun} in ${data.name}`,
    description: `Explore ${data.count.toLocaleString()} ${site.mappedNoun} mapped in ${data.name}, sourced from OpenStreetMap.`,
    alternates: { canonical: `/${country}` },
  };
}

export default async function CountryPage({ params }) {
  const { locale, country } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("country");
  const data = await countryBySlug(country);
  if (!data) notFound();

  const named = (data.names || []).slice(0, 300);

  return (
    <main className="container prose">
      <Link href="/">{t("back")}</Link>
      <h1>{t("heading", { noun: site.mappedNoun, country: data.name })}</h1>
      <p>
        <strong>{t("count", { count: data.count, noun: site.mappedNoun })}</strong>
      </p>
      <p>{t("intro", { country: data.name })}</p>
      <p>
        <Link className="btn btn-primary" href="/map">
          {site.emoji} Open the interactive map
        </Link>
      </p>
      {named.length > 0 && (
        <>
          <h2>
            {site.mappedNoun} in {data.name}
          </h2>
          <ul>
            {named.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
