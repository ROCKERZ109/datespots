// pages/index.tsx


"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, getDocs, setDoc, where, deleteDoc, Timestamp } from 'firebase/firestore';
import DateCard from '../components/DateCard';
import AddDateForm from '../components/AddDateForm';
import { DateSpot, Vote } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// 🔐 Auth Button
// ─────────────────────────────────────────────
const AuthButton: React.FC<{ inApp: boolean }> = ({ inApp }) => {
  const [user, loading] = useAuthState(auth);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleGoogleSignIn = async () => {
    if (inApp) {
      setShowLoginDialog(true);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (
        error.code?.includes('popup-closed-by-user') ||
        error.code?.includes('popup-blocked')
      ) {
        console.log('Google sign-in was cancelled by user or popup conflict.');
        return;
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-pink-500" />
        <span className="text-sm text-gray-600 dark:text-gray-300">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {user ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-9 h-9 rounded-full border-2 border-rose-400 dark:border-rose-500 shadow-md shadow-rose-500/20"
              />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:inline">
              {user.displayName}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <motion.button
          onClick={handleGoogleSignIn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-600 rounded-2xl px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-gray-900 transition-all shadow-lg shadow-gray-200/50 dark:shadow-black/20"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Sign in with Google</span>
        </motion.button>
      )}

      {/* In-app browser warning */}
      <AnimatePresence>
        {showLoginDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-rose-100 dark:border-gray-700"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Almost there!
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Google sign-in doesn't work in in-app browsers. Please open in <strong>Safari</strong> or <strong>Chrome</strong>.
              </p>
              <motion.button
                onClick={() => setShowLoginDialog(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-semibold shadow-lg shadow-rose-500/30 transition-all"
              >
                Got it
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────
// 🌗 Theme Toggle
// ─────────────────────────────────────────────
const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600"
        aria-label="Switch theme"
      />
    );
  }

  return (
    <motion.button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-gray-900 transition-all shadow-md flex items-center justify-center text-lg"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </motion.button>
  );
};

// ─────────────────────────────────────────────
// 📐 Haversine distance
// ─────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor;
  return [/FBAN|FBAV/i, /Instagram/i, /Line/i, /Twitter/i, /LinkedInApp/i, /Messenger/i].some(
    (p) => p.test(ua)
  );
}

// ─────────────────────────────────────────────
// 💖 Floating Hearts Background
// ─────────────────────────────────────────────
const FloatingHearts: React.FC = () => {
  const hearts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${8 + i * 12}%`,
        size: 16 + Math.random() * 20,
        duration: 8 + Math.random() * 6,
        delay: i * 1.5,
        emoji: ['💖', '💕', '🌹', '✨', '💗', '🩷', '🤍', '💐'][i],
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          className="absolute bottom-0 opacity-0"
          style={{ left: h.left, fontSize: h.size }}
          animate={{ y: [0, -800], opacity: [0, 0.3, 0.15, 0], rotate: [0, 25, -25, 0] }}
          transition={{ duration: h.duration, repeat: Infinity, delay: h.delay, ease: 'easeOut' }}
        >
          {h.emoji}
        </motion.span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// 🏠 Category Options
// ─────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'romantic', label: '💕 Romantic' },
  { value: 'food', label: '🍽️ Food & Drinks' },
  { value: 'outdoor', label: '🌳 Outdoor' },
  { value: 'indoor', label: '🏠 Indoor' },
  { value: 'culture', label: '🎭 Arts & Culture' },
  { value: 'adventure', label: '🎯 Adventure' },
  { value: 'water', label: '🌊 Water Activities' },
  { value: 'view', label: '🌆 Viewpoints' },
  { value: 'entertainment', label: '🎪 Entertainment' },
];

// ─────────────────────────────────────────────
// 🏡 Main Home Component
// ─────────────────────────────────────────────
export default function Home() {
  const [user, loadingUser] = useAuthState(auth);
  const [dateSpots, setDateSpots] = useState<DateSpot[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'distance' | 'createdAt'>('rating');
  const [showAddForm, setShowAddForm] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [inApp, setInApp] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(300);

  // ─── Effects ────────────────────────────────
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error('Location error', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  // Fetch user votes
  useEffect(() => {
    if (user) {
      const votesRef = collection(db, 'votes');
      const q = query(votesRef, where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const votes: Record<string, 'up' | 'down'> = {};
        snapshot.forEach((doc) => {
          const voteData = doc.data() as Vote;
          votes[voteData.dateSpotId] = voteData.voteType;
        });
        setUserVotes(votes);
      });
      return () => unsubscribe();
    } else {
      setUserVotes({});
    }
  }, [user]);

  // Fetch date spots
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAndListen = async () => {
      try {
        await getDocs(collection(db, 'datespots'));
      } catch (error) {
        console.error('Error initializing', error);
      }

      const spotsRef = collection(db, 'datespots');
      const q = query(spotsRef, orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const spots = snapshot.docs.map(mapFirestoreDoc);
          setDateSpots(spots);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching date spots:', err);
          setError('Failed to load date spots. Please try again later.');
          setLoading(false);
        }
      );
    };

    initializeAndListen();
    return () => unsubscribe?.();
  }, []);

  // ─── Helpers ────────────────────────────────
  const mapFirestoreDoc = (doc: any): DateSpot => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      rating: data.rating || 0,
      totalVotes: data.totalVotes || 0,
      priceLevel: data.priceLevel || 2,
      tags: data.tags || ['date spot'],
      upvotes: data.upvotes || 0,
      downvotes: data.downvotes || 0,
    } as DateSpot;
  };

  const scrollToTop = () => {
    if (searchRef.current) {
      const top = searchRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - 20, behavior: 'smooth' });
    }
  };

  // ─── Filtered + Sorted ─────────────────────
  const filteredSpots = useMemo(() => {
    let result = [...dateSpots];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (spot) =>
          spot.name.toLowerCase().includes(term) ||
          spot.location.toLowerCase().includes(term) ||
          spot.description.toLowerCase().includes(term) ||
          spot.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    if (selectedCategory) {
      result = result.filter((spot) => spot.category === selectedCategory);
    }

    if (minRating > 0) {
      result = result.filter((spot) => spot.rating >= minRating);
    }

    // Distance filter
    if (userLocation && !showAllLocations) {
      result = result.filter((spot) => {
        if (!spot.coordinates) return false;
        const spotLat = spot.coordinates.latitude;
        const spotLng = spot.coordinates.longitude;
        if (spotLat === undefined || spotLng === undefined) return false;
        return haversine(userLocation.lat, userLocation.lng, spotLat, spotLng) <= maxDistance;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'distance' && userLocation && a.coordinates && b.coordinates) {
        const da = haversine(userLocation.lat, userLocation.lng, a.coordinates.latitude, a.coordinates.longitude);
        const db2 = haversine(userLocation.lat, userLocation.lng, b.coordinates.latitude, b.coordinates.longitude);
        return da - db2;
      }
      switch (sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        case 'createdAt': return b.createdAt.getTime() - a.createdAt.getTime();
        default: return 0;
      }
    });

    return result;
  }, [dateSpots, searchTerm, selectedCategory, minRating, sortBy, userLocation, showAllLocations, maxDistance]);

  // ─── Handlers ───────────────────────────────
  const handleAddSpot = useCallback(
    async (spotData: Omit<DateSpot, 'id' | 'createdAt'>) => {
      if (!user) {
        alert('Please sign in with Google to add a new date spot!');
        return;
      }

      try {
        const spotsRef = collection(db, 'datespots');
        await addDoc(spotsRef, {
          ...spotData,
          priceLevel: parseInt(spotData.priceLevel.toString()) as 1 | 2 | 3 | 4,
          tags: spotData.tags.length > 0 ? spotData.tags : ['date spot'],
          rating: spotData.rating,
          totalVotes: 1,
          upvotes: 0,
          downvotes: 0,
          createdAt: new Date(),
          createdBy: user.uid,
          createdByDisplayName: user.displayName || 'Anonymous',
          createdByPhotoURL: user.photoURL || null,
          petFriendly: spotData.petFriendly || false,
        });
        setShowAddForm(false);
      } catch (err) {
        console.error('Error adding date spot:', err);
        throw err;
      }
    },
    [user]
  );

  const handleVoteSpot = useCallback(
    async (documentId: string, voteType: 'up' | 'down' | 'remove') => {
      if (!user) {
        alert('Please sign in with Google to vote on date spots!');
        return;
      }

      try {
        const spotRef = doc(db, 'datespots', documentId);
        const spot = dateSpots.find((s) => s.id === documentId);
        if (!spot) return;

        const userCurrentVote = userVotes[documentId];

        if (voteType === 'remove') {
          if (userCurrentVote) {
            const votesRef = collection(db, 'votes');
            const q = query(votesRef, where('userId', '==', user.uid), where('dateSpotId', '==', documentId));
            const voteSnapshot = await getDocs(q);
            voteSnapshot.forEach(async (voteDoc) => await deleteDoc(voteDoc.ref));

            const updateData =
              userCurrentVote === 'up'
                ? { upvotes: Math.max(0, (spot.upvotes || 0) - 1) }
                : { downvotes: Math.max(0, (spot.downvotes || 0) - 1) };
            await updateDoc(spotRef, updateData);
          }
          return;
        }

        if (userCurrentVote) {
          if (userCurrentVote === voteType) {
            // Toggle off
            const votesRef = collection(db, 'votes');
            const q = query(votesRef, where('userId', '==', user.uid), where('dateSpotId', '==', documentId));
            const voteSnapshot = await getDocs(q);
            voteSnapshot.forEach(async (voteDoc) => await deleteDoc(voteDoc.ref));

            const updateData =
              userCurrentVote === 'up'
                ? { upvotes: Math.max(0, (spot.upvotes || 0) - 1) }
                : { downvotes: Math.max(0, (spot.downvotes || 0) - 1) };
            await updateDoc(spotRef, updateData);
            return;
          } else {
            // Switch vote
            const votesRef = collection(db, 'votes');
            const q = query(votesRef, where('userId', '==', user.uid), where('dateSpotId', '==', documentId));
            const voteSnapshot = await getDocs(q);
            voteSnapshot.forEach(async (voteDoc) => await updateDoc(voteDoc.ref, { voteType }));

            const updateData =
              userCurrentVote === 'up'
                ? { upvotes: Math.max(0, (spot.upvotes || 0) - 1), downvotes: (spot.downvotes || 0) + 1 }
                : { upvotes: (spot.upvotes || 0) + 1, downvotes: Math.max(0, (spot.downvotes || 0) - 1) };
            await updateDoc(spotRef, updateData);
            return;
          }
        }

        // New vote
        const votesRef = collection(db, 'votes');
        await addDoc(votesRef, {
          userId: user.uid,
          dateSpotId: documentId,
          voteType,
          createdAt: new Date(),
        });

        const updateData =
          voteType === 'up'
            ? { upvotes: (spot.upvotes || 0) + 1 }
            : { downvotes: (spot.downvotes || 0) + 1 };
        await updateDoc(spotRef, updateData);
      } catch (error) {
        console.error('Error voting on date spot:', error);
      }
    },
    [dateSpots, user, userVotes]
  );

  // ─── Render ─────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50/50 to-violet-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative">

      {/* Subtle noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03] z-0"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
      />

      {/* Gradient orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-rose-300/20 to-fuchsia-400/10 dark:from-rose-500/5 dark:to-fuchsia-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-violet-300/20 to-pink-400/10 dark:from-violet-500/5 dark:to-pink-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* ─── Header ─────────────────────────── */}
        <header className="text-center mb-16 relative">
          <FloatingHearts />

          {/* Top bar */}
          <div className="flex justify-between items-center mb-12">
            <div />
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <AuthButton inApp={inApp} />
            </div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', damping: 15 }}
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none mb-5">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 dark:from-rose-400 dark:via-fuchsia-400 dark:to-violet-500 drop-shadow-sm">
                DateSpots
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto font-light leading-relaxed"
          >
            Discover & share the most romantic spots in Göteborg and beyond. Crowdsourced by people like you.
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-8 mx-auto w-24 h-[2px] bg-gradient-to-r from-transparent via-rose-400 to-transparent dark:via-rose-500/60 rounded-full"
          />
        </header>

        {/* ─── Filter Section (Redesigned) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-12 space-y-5"
        >

          {/* ✦ Hero Search Bar */}
          <div ref={searchRef} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-fuchsia-500/20 to-violet-500/20 dark:from-rose-500/10 dark:via-fuchsia-500/10 dark:to-violet-500/10 rounded-[28px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-[22px] border border-white/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/30 dark:shadow-black/20 px-6 py-1 transition-all duration-300 group-focus-within:shadow-xl group-focus-within:shadow-rose-500/[0.08] group-focus-within:border-rose-200/60 dark:group-focus-within:border-rose-500/20">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onFocus={scrollToTop}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent py-4 text-base sm:text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none font-medium"
                placeholder="Search spots, locations, vibes..."
              />
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchTerm('')}
                    className="ml-2 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm transition-colors"
                  >
                    ✕
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ✦ Category Chips — Horizontally Scrollable */}
          <div className="relative">
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {CATEGORY_OPTIONS.map((option) => {
                const isActive = selectedCategory === option.value;
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => setSelectedCategory(isActive ? '' : option.value)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`
                      flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 border
                      ${isActive
                        ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 dark:from-rose-500 dark:to-fuchsia-600 text-white border-transparent shadow-lg shadow-rose-500/25'
                        : 'bg-white/60 dark:bg-gray-800/50 backdrop-blur-md text-gray-600 dark:text-gray-300 border-gray-200/60 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/70 hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm'
                      }
                    `}
                  >
                    {option.label}
                  </motion.button>
                );
              })}
            </div>
            {/* Fade edges for scroll hint */}
            <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-rose-50/80 dark:from-gray-950/80 to-transparent pointer-events-none sm:hidden" />
          </div>

          {/* ✦ Controls Row — Rating, Distance, Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

            {/* Rating Filter — Interactive Hearts */}
            <div className="flex items-center bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 px-4 py-2.5 shadow-sm gap-1.5">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-2">Min</span>
              {[
                { value: 0, label: 'Any' },
                { value: 3.5, label: '3.5' },
                { value: 4, label: '4' },
                { value: 4.5, label: '4.5' },
              ].map((opt) => {
                const isActive = minRating === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    onClick={() => setMinRating(opt.value)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={`
                      px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200
                      ${isActive
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400'
                      }
                    `}
                  >
                    {opt.value > 0 ? `${opt.label} 💖` : opt.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Distance Controls */}
            <div className="flex items-center bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 px-4 py-2.5 shadow-sm flex-1 min-w-0 gap-4">
              {userLocation ? (
                <>
                  <label className="flex items-center cursor-pointer group flex-shrink-0">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={showAllLocations}
                        onChange={() => setShowAllLocations(!showAllLocations)}
                      />
                      <div className={`block w-11 h-6 rounded-full transition-colors duration-300 ${showAllLocations ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <div className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${showAllLocations ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="ml-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {showAllLocations ? '🌍 All' : '📍 Near'}
                    </span>
                  </label>

                  <AnimatePresence>
                    {!showAllLocations && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: '100%' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3 overflow-hidden flex-1 min-w-0"
                      >
                        <input
                          type="range"
                          min="5"
                          max="1000"
                          step="5"
                          value={maxDistance}
                          onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-rose-500"
                        />
                        <span className="text-xs font-bold text-rose-500 dark:text-rose-400 tabular-nums whitespace-nowrap min-w-[48px] text-right">
                          {maxDistance} km
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Enable location for distance filter
                </span>
              )}
            </div>

            {/* Sort Pills */}
            <div className="flex items-center bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-1.5 shadow-sm gap-1">
              {[
                { value: 'distance', icon: '📍', label: 'Near' },
                { value: 'rating', icon: '💖', label: 'Top' },
                { value: 'name', icon: '📝', label: 'A-Z' },
                { value: 'createdAt', icon: '✨', label: 'New' },
              ].map((opt) => {
                const isActive = sortBy === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as any)}
                    whileTap={{ scale: 0.92 }}
                    className={`
                      relative px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap
                      ${isActive
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sortIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-rose-500 to-fuchsia-500 rounded-xl shadow-md shadow-rose-500/20"
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      />
                    )}
                    <span className="relative z-10">{opt.icon} {opt.label}</span>
                  </motion.button>
                );
              })}
            </div>

          </div>

          {/* ✦ Active Filters Summary */}
          <AnimatePresence>
            {(selectedCategory || minRating > 0 || searchTerm) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 flex-wrap overflow-hidden"
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Active:</span>
                {searchTerm && (
                  <motion.span
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/20"
                  >
                    🔍 "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-violet-900 dark:hover:text-violet-100 ml-0.5">✕</button>
                  </motion.span>
                )}
                {selectedCategory && (
                  <motion.span
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-500/20"
                  >
                    {CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label}
                    <button onClick={() => setSelectedCategory('')} className="hover:text-rose-900 dark:hover:text-rose-100 ml-0.5">✕</button>
                  </motion.span>
                )}
                {minRating > 0 && (
                  <motion.span
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-pink-500/20"
                  >
                    {minRating}+ 💖
                    <button onClick={() => setMinRating(0)} className="hover:text-pink-900 dark:hover:text-pink-100 ml-0.5">✕</button>
                  </motion.span>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSearchTerm(''); setSelectedCategory(''); setMinRating(0); }}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 font-semibold underline underline-offset-2 decoration-dashed transition-colors ml-1"
                >
                  Clear all
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

        {/* ─── Content ────────────────────────── */}
        {error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-red-50/80 dark:bg-red-900/10 backdrop-blur-xl text-red-700 dark:text-red-300 rounded-3xl shadow-xl border border-red-200/50 dark:border-red-900/30"
          >
            <div className="text-6xl mb-5">💔</div>
            <h3 className="text-2xl font-bold mb-2">Something went wrong</h3>
            <p className="text-red-600/80 dark:text-red-300/70">{error}</p>
          </motion.div>
        ) : loading ? (
          <div className="text-center py-24">
            <motion.div
              className="w-16 h-16 mx-auto mb-6 rounded-full border-[3px] border-rose-200 dark:border-rose-800 border-t-rose-500 dark:border-t-rose-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-gray-400 dark:text-gray-500 font-medium">Loading romantic spots...</p>
          </div>
        ) : filteredSpots.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white/40 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl border-2 border-dashed border-rose-200 dark:border-gray-700"
          >
            <motion.div
              className="text-7xl mb-6"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🌹
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              No spots found
            </h3>
            <p className="text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
              Try adjusting your filters or be the first to add a romantic spot!
            </p>
          </motion.div>
        ) : (
          <div>
            {/* Results count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8 flex items-center space-x-2"
            >
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                Found
              </span>
              <span className="text-sm font-bold text-rose-500 dark:text-rose-400">
                {filteredSpots.length}
              </span>
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                romantic spot{filteredSpots.length !== 1 ? 's' : ''}
              </span>
            </motion.div>

            {/* Cards Grid — Staggered */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
              {filteredSpots.map((spot, index) => (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.5, ease: 'easeOut' }}
                >
                  <DateCard
                    spot={spot}
                    onVote={handleVoteSpot}
                    user={user}
                    userVote={userVotes[spot.id] || null}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Footer ─────────────────────────── */}
        <footer className="mt-24 text-center pb-8">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-400 dark:text-gray-500">
            <span>Made with</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              💖
            </motion.span>
            <span>for anyone who appreciates thoughtful date ideas</span>
          </div>
        </footer>
      </div>

      {/* ─── Floating Add Button (FAB) ────────── */}
      <motion.button
        onClick={() => {
          if (user) {
            setShowAddForm(true);
          } else {
            alert('Please sign in with Google to add a new date spot!');
          }
        }}
        className="fixed bottom-7 right-7 z-40 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 text-white text-2xl sm:text-3xl shadow-2xl shadow-rose-500/30 dark:shadow-rose-500/20 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-rose-500/30"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', damping: 12 }}
        title="Add new date spot"
      >
        +
      </motion.button>

      {/* ─── Add Date Form Modal ──────────────── */}
      <AnimatePresence>
        {showAddForm && user && (
          <motion.div
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Add a New Spot
                  </h2>
                  <motion.button
                    onClick={() => setShowAddForm(false)}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ✕
                  </motion.button>
                </div>
                <AddDateForm
                  onAdd={handleAddSpot}
                  onCancel={() => setShowAddForm(false)}
                  allSpots={dateSpots}
                  userLocation={userLocation}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
