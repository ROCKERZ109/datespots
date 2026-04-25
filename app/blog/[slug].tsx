// pages/blog/[slug].tsx
import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { BlogPost } from "@/pages/blog";

// ─── Theme Toggle ─────────────────────────────
const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);
  if (!mounted)
    return (
      <button className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-800/50" />
    );

  return (
    <motion.button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-md flex items-center justify-center text-lg"
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </motion.button>
  );
};

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      try {
        const postsRef = collection(db, "blog-posts");
        const q = query(postsRef, where("slug", "==", slug));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          const fetchedPost = {
            id: doc.id,
            ...data,
            publishedAt:
              data.publishedAt?.toDate?.() || new Date(data.publishedAt),
          } as BlogPost;

          setPost(fetchedPost);

          // Fetch related posts (same category, different slug)
          const relatedQuery = query(
            postsRef,
            where("category", "==", fetchedPost.category),
            orderBy("publishedAt", "desc"),
            limit(4),
          );
          const relatedSnapshot = await getDocs(relatedQuery);
          const related = relatedSnapshot.docs
            .map(
              (d) =>
                ({
                  id: d.id,
                  ...d.data(),
                  publishedAt:
                    d.data().publishedAt?.toDate?.() ||
                    new Date(d.data().publishedAt),
                }) as BlogPost,
            )
            .filter((p) => p.slug !== slug);

          setRelatedPosts(related.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching blog post:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50/50 to-violet-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-14 h-14 mx-auto mb-5 rounded-full border-[3px] border-rose-200 dark:border-rose-800 border-t-rose-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-400 text-sm font-medium">
            Loading article...
          </p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50/50 to-violet-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Post not found
          </h1>
          <p className="text-gray-400 mb-6">
            This article doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <span className="text-rose-500 font-semibold hover:underline cursor-pointer">
              ← Back to Blog
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} — DateSpots Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.coverImage && (
          <meta property="og:image" content={post.coverImage} />
        )}
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50/50 to-violet-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative">
        {/* BG orbs */}
        <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-rose-300/15 to-fuchsia-400/10 dark:from-rose-500/5 dark:to-fuchsia-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-10 relative z-10 max-w-3xl">
          {/* ─── Nav ───────────────────────────── */}
          <div className="flex justify-between items-center mb-10">
            <Link href="/blog">
              <motion.span
                whileHover={{ x: -3 }}
                className="text-sm font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                All Guides
              </motion.span>
            </Link>
            <ThemeToggle />
          </div>

          {/* ─── Hero Image ────────────────────── */}
          {post.coverImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl overflow-hidden mb-10 shadow-xl shadow-gray-200/30 dark:shadow-black/20"
            >
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </motion.div>
          )}

          {/* ─── Article Header ────────────────── */}
          <motion.header
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4 font-medium">
              <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 px-2.5 py-1 rounded-lg font-bold capitalize">
                {post.category.replace("-", " ")}
              </span>
              <span>{formatDate(post.publishedAt)}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span>{post.readTime} min read</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4 tracking-tight">
              {post.title}
            </h1>

            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed font-light">
              {post.excerpt}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                {post.author[0]}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {post.author}
              </span>
            </div>
          </motion.header>

          {/* ─── Article Content ───────────────── */}
          <motion.article
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-gray dark:prose-invert max-w-none
              prose-headings:font-extrabold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300
              prose-a:text-rose-500 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-2xl prose-img:shadow-lg
              prose-blockquote:border-rose-400 prose-blockquote:bg-rose-50/50 dark:prose-blockquote:bg-rose-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4
              prose-strong:text-gray-800 dark:prose-strong:text-gray-100
              prose-li:text-gray-600 dark:prose-li:text-gray-300
              mb-16"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* ─── Tags ──────────────────────────── */}
          <div className="flex flex-wrap gap-2 mb-12 pb-10 border-b border-gray-200/60 dark:border-gray-700/50">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/15"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* ─── Related Posts ─────────────────── */}
          {relatedPosts.length > 0 && (
            <div className="mb-16">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6">
                More like this
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedPosts.map((related) => (
                  <Link key={related.id} href={`/blog/${related.slug}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/50 dark:border-gray-700/50 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      {related.coverImage && (
                        <img
                          src={related.coverImage}
                          alt={related.title}
                          className="w-full h-28 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-rose-500 transition-colors">
                          {related.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          {related.readTime} min read
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ─── Footer ────────────────────────── */}
          <footer className="text-center pb-8">
            <Link href="/blog">
              <motion.span
                whileHover={{ x: -3 }}
                className="text-sm font-bold text-rose-500 dark:text-rose-400 cursor-pointer flex items-center gap-1.5 justify-center"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to all guides
              </motion.span>
            </Link>
          </footer>
        </div>
      </div>
    </>
  );
}
