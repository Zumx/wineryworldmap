import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "../../i18n/navigation.js";
import { site } from "../../lib/site.js";
import { listCountries } from "../../lib/data.js";
import MapClient from "../../components/MapClient.js";

export default async function Home({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const countries = (await listCountries()).slice(0, 60);

  return (
    <main>
      <section className="hero">
        <h1>
          {site.emoji} {site.name}
        </h1>
        <p>{t("intro")}</p>
        <div className="actions">
          <Link className="btn btn-primary" href="/map">
            {t("ctaMap")}
          </Link>
          <Link className="btn btn-ghost" href="/blog">
            {t("ctaBlog")}
          </Link>
        </div>
      </section>

      <div className="home-map">
        <MapClient embedded />
      </div>

      {countries.length > 0 && (
        <section className="container">
          <h2 className="prose">{t("countriesHeading")}</h2>
          <div className="country-grid">
            {countries.map((c) => (
              <Link key={c.slug} href={`/${c.slug}`}>
                <span className="c-name">{c.name}</span>
                <span className="c-count">
                  {c.count.toLocaleString()} {site.mappedNoun}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
