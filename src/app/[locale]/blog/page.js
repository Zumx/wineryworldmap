import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "../../../i18n/navigation.js";
import { listPosts } from "../../../lib/blog.js";

export async function generateMetadata() {
  const t = await getTranslations("blog");
  return { title: t("heading") };
}

export default async function BlogIndex({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const posts = await listPosts(locale);

  return (
    <main className="container">
      <div className="prose">
        <h1>{t("heading")}</h1>
      </div>
      {posts.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              {post.date && <div className="post-meta">{post.date}</div>}
              {post.excerpt && <p>{post.excerpt}</p>}
              <Link href={`/blog/${post.slug}`}>{t("readMore")}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
