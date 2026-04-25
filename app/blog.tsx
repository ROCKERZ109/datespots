// pages/blog.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import Head from 'next/head';

// ─── Types ────────────────────────────────────
export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    category: string;
    tags: string[];
    author: string;
    readTime: number;
    publishedAt: Date;
}

// ─── Theme Toggle ─────────────────────────────
const ThemeToggle: React.FC = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    useEffect(() => setMounted(true), []);
    if (!mounted) return <button className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-800/50" />;

    return (
        <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-md flex items-center justify-center text-lg"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </motion.button>
    );
};

// ─── Category Config ──────────────────────────
const BLOG_CATEGORIES = [
    { value: '', label: 'All Posts' },
    { value: 'city-guide', label: '🏙️ City Guide' },
    { value: 'hidden-gems', label: '💎 Hidden Gems' },
    { value: 'food-drink', label: '☕ Food & Drink' },
    { value: 'neighborhoods', label: '🏘️ Neighborhoods' },
    { value: 'seasonal', label: '🌸 Seasonal' },
    { value: 'history', label: '🏛️ History & Culture' },
];

// ─── Blog Card Component ──────────────────────
const BlogCard: React.FC<{ post: BlogPost; featured?: boolean }> = ({ post, featured = false }) => {
    const [imgError, setImgError] = useState(false);

    const categoryMeta: Record<string, { emoji: string; color: string }> = {
        'city-guide': { emoji: '🏙️', color: 'bg-sky-500' },
        'hidden-gems': { emoji: '💎', color: 'bg-violet-500' },
        'food-drink': { emoji: '☕', color: 'bg-amber-500' },
        'neighborhoods': { emoji: '🏘️', color: 'bg-emerald-500' },
        'seasonal': { emoji: '🌸', color: 'bg-rose-500' },
        'history': { emoji: '🏛️', color: 'bg-indigo-500' },
    };

    const cat = categoryMeta[post.category] || { emoji: '📝', color: 'bg-gray-500' };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    };

    if (featured) {
        return (
            <Link href={`/blog/${post.slug}`}>
                <motion.article
                    className="group relative bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] overflow-hidden border border-white/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/40 dark:shadow-black/20 hover:shadow-xl hover:shadow-rose-500/[0.08] transition-all duration-500 cursor-pointer"
                    whileHover={{ y: -4 }}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Image */}
                        <div className="relative h-64 lg:h-full min-h-[280px] overflow-hidden">
                            {post.coverImage && !imgError ? (
                                <motion.img
                                    src={post.coverImage}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                    whileHover={{ scale: 1.04 }}
                                    transition={{ duration: 0.6 }}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-rose-200 via-fuchsia-200 to-violet-300 dark:from-rose-800/40 dark:via-fuchsia-800/30 dark:to-violet-800/40 flex items-center justify-center">
                                    <span className="text-6xl opacity-30">🏙️</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent lg:bg-gradient-to-t lg:from-transparent lg:to-transparent" />

                            {/* Category badge */}
                            <div className={`absolute top-4 left-4 ${cat.color} text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5`}>
                                <span>{cat.emoji}</span>
                                <span className="capitalize tracking-wide">{post.category.replace('-', ' ')}</span>
                            </div>

                            {/* Featured badge */}
                            <div className="absolute top-4 right-4 bg-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                                <span>✨</span>
                                <span>Latest</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 lg:p-10 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
                                <span>{formatDate(post.publishedAt)}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span>{post.readTime} min read</span>
                            </div>

                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-4 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
                                {post.title}
                            </h2>

                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 line-clamp-3">
                                {post.excerpt}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {post.tags.slice(0, 4).map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/15"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                    By {post.author}
                                </span>
                                <span className="text-xs font-bold text-rose-500 dark:text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                    Read more
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.article>
            </Link>
        );
    }

    // Regular card
    return (
        <Link href={`/blog/${post.slug}`}>
            <motion.article
                className="group relative bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[20px] overflow-hidden border border-white/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/40 dark:shadow-black/20 hover:shadow-xl hover:shadow-rose-500/[0.08] transition-all duration-500 cursor-pointer h-full flex flex-col"
                whileHover={{ y: -6 }}
            >
                {/* Image */}
                <div className="relative h-48 overflow-hidden flex-shrink-0">
                    {post.coverImage && !imgError ? (
                        <motion.img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                            initial={{ scale: 1.05 }}
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.6 }}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rose-200 via-fuchsia-200 to-violet-300 dark:from-rose-800/40 dark:via-fuchsia-800/30 dark:to-violet-800/40 flex items-center justify-center">
                            <span className="text-4xl opacity-30">🏙️</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                    {/* Category */}
                    <div className={`absolute top-3 left-3 ${cat.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md backdrop-blur-md flex items-center gap-1`}>
                        <span>{cat.emoji}</span>
                        <span className="capitalize">{post.category.replace('-', ' ')}</span>
                    </div>

                    {/* Read time */}
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20 shadow-md">
                        {post.readTime} min
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-2.5 font-medium">
                        {formatDate(post.publishedAt)}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-2.5 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                        {post.title}
                    </h3>

                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.slice(0, 3).map((tag, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/15"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100/80 dark:border-gray-700/50">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                            {post.author}
                        </span>
                        <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Read
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </span>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
};

// ─── Main Blog Page ───────────────────────────
export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch posts
    useEffect(() => {
        const postsRef = collection(db, 'blog-posts');
        const q = query(postsRef, orderBy('publishedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    publishedAt: data.publishedAt?.toDate?.() || new Date(data.publishedAt),
                } as BlogPost;
            });
            setPosts(fetched);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter
    const filteredPosts = useMemo(() => {
        let result = [...posts];

        if (selectedCategory) {
            result = result.filter((p) => p.category === selectedCategory);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(term) ||
                    p.excerpt.toLowerCase().includes(term) ||
                    p.tags.some((t) => t.toLowerCase().includes(term))
            );
        }

        return result;
    }, [posts, selectedCategory, searchTerm]);

    const featuredPost = filteredPosts[0];
    const restPosts = filteredPosts.slice(1);

    return (
        <>
            <Head>
                <title>Blog — DateSpots | Gothenburg City Guides & Hidden Gems</title>
                <meta name="description" content="Discover Gothenburg's hidden gems, best neighborhoods, and local secrets through our curated city guides." />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50/50 to-violet-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative">

                {/* Background effects */}
                <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-rose-300/20 to-fuchsia-400/10 dark:from-rose-500/5 dark:to-fuchsia-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-violet-300/20 to-pink-400/10 dark:from-violet-500/5 dark:to-pink-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

                <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-10 relative z-10 max-w-6xl">

                    {/* ─── Header ─────────────────────────── */}
                    <header className="mb-14">
                        <div className="flex justify-between items-center mb-10">
                            <Link href="/">
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className="text-sm font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    DateSpots
                                </motion.span>
                            </Link>
                            <ThemeToggle />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, type: 'spring', damping: 15 }}
                            className="text-center"
                        >
                            <span className="text-xs font-bold text-rose-500/70 dark:text-rose-400/60 uppercase tracking-[0.2em] mb-3 block">
                                Explore Göteborg
                            </span>
                            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-none mb-4">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 dark:from-rose-400 dark:via-fuchsia-400 dark:to-violet-500">
                                    City Guides
                                </span>
                            </h1>
                            <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto font-light leading-relaxed">
                                Hidden gems, local favorites, and the best of Gothenburg — fresh guides every day.
                            </p>
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="mt-6 mx-auto w-20 h-[2px] bg-gradient-to-r from-transparent via-rose-400 to-transparent dark:via-rose-500/60 rounded-full"
                            />
                        </motion.div>
                    </header>

                    {/* ─── Search + Filters ──────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-10 space-y-4"
                    >
                        {/* Search bar */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-fuchsia-500/10 to-violet-500/10 rounded-[22px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-[18px] border border-white/50 dark:border-gray-700/50 shadow-lg px-5 py-1 transition-all duration-300 group-focus-within:shadow-xl group-focus-within:shadow-rose-500/[0.06] group-focus-within:border-rose-200/60 dark:group-focus-within:border-rose-500/20">
                                <svg className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent py-3.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none font-medium"
                                    placeholder="Search guides..."
                                />
                                <AnimatePresence>
                                    {searchTerm && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={() => setSearchTerm('')}
                                            className="ml-2 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs"
                                        >
                                            ✕
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Category chips */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                            {BLOG_CATEGORIES.map((cat) => {
                                const isActive = selectedCategory === cat.value;
                                return (
                                    <motion.button
                                        key={cat.value}
                                        onClick={() => setSelectedCategory(isActive && cat.value ? '' : cat.value)}
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        className={`
                      flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border
                      ${isActive
                                                ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white border-transparent shadow-lg shadow-rose-500/25'
                                                : 'bg-white/60 dark:bg-gray-800/50 backdrop-blur-md text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/50 hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm'
                                            }
                    `}
                                    >
                                        {cat.label}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* ─── Content ───────────────────────── */}
                    {loading ? (
                        <div className="text-center py-24">
                            <motion.div
                                className="w-14 h-14 mx-auto mb-5 rounded-full border-[3px] border-rose-200 dark:border-rose-800 border-t-rose-500 dark:border-t-rose-400"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">Loading guides...</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-24 bg-white/40 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl border-2 border-dashed border-rose-200 dark:border-gray-700"
                        >
                            <div className="text-6xl mb-5">📝</div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No guides found</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your search or check back soon!</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-10">
                            {/* Featured post */}
                            {featuredPost && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <BlogCard post={featuredPost} featured />
                                </motion.div>
                            )}

                            {/* Grid */}
                            {restPosts.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {restPosts.map((post, index) => (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, y: 25 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(0.05 * index, 0.4), duration: 0.5 }}
                                        >
                                            <BlogCard post={post} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Footer ────────────────────────── */}
                    <footer className="mt-24 text-center pb-8">
                        <div className="inline-flex items-center space-x-2 text-sm text-gray-400 dark:text-gray-500">
                            <span>Made with</span>
                            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                💖
                            </motion.span>
                            <span>by DateSpots</span>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}