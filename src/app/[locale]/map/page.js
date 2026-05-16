import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { site } from "../../../lib/site.js";
import MapClient from "../../../components/MapClient.js";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("map") };
}

export default async function MapPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main
      style={{
        position: "relative",
        height: "calc(100vh - 57px)",
        width: "100%",
      }}
    >
      <MapClient />
    </main>
  );
}
