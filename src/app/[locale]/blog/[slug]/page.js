import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Link } from "../../../../i18n/navigation.js";
import { listPosts, getPost } from "../../../../lib/blog.js";

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.meta.title || slug,
    description: post.meta.excerpt || undefined,
  };
}

export default async function BlogPost({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <main className="container prose">
      <Link href="/blog">{t("back")}</Link>
      <h1>{post.meta.title || slug}</h1>
      {post.meta.date && <p className="post-meta">{post.meta.date}</p>}
      <MDXRemote source={post.content} />
    </main>
  );
}
