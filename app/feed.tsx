// pages/feed.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../lib/firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc,
  getDocs, where, deleteDoc, Timestamp, limit,
} from 'firebase/firestore';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { DateSpot } from '../types';
import Link from 'next/link';
import Head from 'next/head';

// ─── Types ────────────────────────────────────
interface DateStory {
  id: string;
  text: string;
  imageUrl: string;
  dateSpotId: string | null;
  dateSpotName: string | null;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  isAnonymous: boolean;
  hearts: number;
  createdAt: Date;
}

interface StoryHeart {
  userId: string;
  storyId: string;
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

// ─── Story Card ───────────────────────────────
const StoryCard: React.FC<{
  story: DateStory;
  isHearted: boolean;
  onHeart: (storyId: string) => void;
  user: any;
}> = ({ story, isHearted, onHeart, user }) => {
  const [imgError, setImgError] = useState(false);

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  return (
    <motion.div
      className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[20px] overflow-hidden border border-white/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/40 dark:shadow-black/20 hover:shadow-xl hover:shadow-rose-500/[0.08] transition-all duration-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      {/* Image */}
      {story.imageUrl && !imgError && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={story.imageUrl}
            alt="Date experience"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      )}

      <div className="p-5 space-y-3.5">
        {/* Author Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {story.isAnonymous ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                ?
              </div>
            ) : story.authorPhoto ? (
              <img
                src={story.authorPhoto}
                alt={story.authorName}
                className="w-8 h-8 rounded-full border-2 border-rose-200 dark:border-rose-500/30 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {story.authorName[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-none">
                {story.isAnonymous ? 'Anonymous' : story.authorName}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {timeAgo(story.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Linked DateSpot */}
        {story.dateSpotName && (
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/15 w-fit cursor-pointer"
            >
              <span className="text-[10px]">📍</span>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 truncate max-w-[180px]">
                {story.dateSpotName}
              </span>
            </motion.div>
          </Link>
        )}

        {/* Story Text */}
        <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
          {story.text}
        </p>

        {/* Heart Row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100/80 dark:border-gray-700/50">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onHeart(story.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
              isHearted
                ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'bg-white/60 dark:bg-gray-700/40 border-gray-200/60 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-500'
            }`}
          >
            <motion.span
              animate={isHearted ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isHearted ? '💖' : '🤍'}
            </motion.span>
            <span className="tabular-nums">{story.hearts || 0}</span>
          </motion.button>

          <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
            date story
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Write Story Modal ────────────────────────
const WriteStoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (story: {
    text: string;
    imageUrl: string;
    dateSpotId: string | null;
    dateSpotName: string | null;
    isAnonymous: boolean;
  }) => Promise<void>;
  dateSpots: DateSpot[];
}> = ({ isOpen, onClose, onSubmit, dateSpots }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spotSearch, setSpotSearch] = useState('');
  const [showSpotDropdown, setShowSpotDropdown] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const filteredSpots = useMemo(() => {
    if (!spotSearch) return dateSpots.slice(0, 8);
    const term = spotSearch.toLowerCase();
    return dateSpots.filter(
      (s) => s.name.toLowerCase().includes(term) || s.location.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [spotSearch, dateSpots]);

  const selectedSpotData = dateSpots.find((s) => s.id === selectedSpot);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return '';
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `stories/${Date.now()}-${imageFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      uploadTask.on(
        'state_changed',
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (err) => { setUploadProgress(null); reject(err); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadProgress(null);
          resolve(url);
        }
      );
    });
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);

    try {
      let imageUrl = '';
      if (imageFile) imageUrl = await uploadImage();

      await onSubmit({
        text: text.trim(),
        imageUrl,
        dateSpotId: selectedSpot || null,
        dateSpotName: selectedSpotData?.name || null,
        isAnonymous,
      });

      // Reset
      setText('');
      setImageFile(null);
      setPreviewImage(null);
      setSelectedSpot('');
      setIsAnonymous(false);
      setSpotSearch('');
      onClose();
    } catch (err) {
      console.error('Error posting story:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = text.length;
  const maxChars = 500;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Share Your Story</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tell us about your date experience</p>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-sm"
                >
                  ✕
                </motion.button>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, maxChars))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 dark:bg-gray-800/60 text-gray-800 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 resize-none bg-white/80 transition-all"
                  placeholder="How was your date? What made it special? ✨"
                />
                <span className={`absolute bottom-3 right-3 text-[10px] font-medium tabular-nums ${
                  charCount > maxChars * 0.9 ? 'text-rose-500' : 'text-gray-300 dark:text-gray-600'
                }`}>
                  {charCount}/{maxChars}
                </span>
              </div>

              {/* Link DateSpot */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  📍 Which spot did you visit?
                </label>

                {selectedSpotData ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/15"
                  >
                    <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <span className="text-xs">📍</span> {selectedSpotData.name}
                    </span>
                    <button
                      onClick={() => { setSelectedSpot(''); setSpotSearch(''); }}
                      className="text-rose-400 hover:text-rose-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </motion.div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={spotSearch}
                      onChange={(e) => { setSpotSearch(e.target.value); setShowSpotDropdown(true); }}
                      onFocus={() => setShowSpotDropdown(true)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm bg-white/80 dark:bg-gray-800/60 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                      placeholder="Search for a date spot..."
                    />

                    <AnimatePresence>
                      {showSpotDropdown && filteredSpots.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-10 top-full mt-1.5 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto"
                        >
                          {filteredSpots.map((spot) => (
                            <button
                              key={spot.id}
                              onClick={() => {
                                setSelectedSpot(spot.id);
                                setSpotSearch('');
                                setShowSpotDropdown(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-2 text-sm"
                            >
                              <span className="text-xs">📍</span>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{spot.name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{spot.location}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  📸 Add a photo (optional)
                </label>

                {previewImage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden"
                  >
                    <img src={previewImage} alt="Preview" className="w-full h-40 object-cover rounded-2xl" />
                    <button
                      onClick={() => { setImageFile(null); setPreviewImage(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </motion.div>
                ) : (
                  <label className="flex items-center justify-center w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-rose-300 dark:hover:border-rose-500/40 hover:bg-rose-50/30 dark:hover:bg-rose-500/5 transition-all">
                    <div className="text-center">
                      <span className="text-2xl block mb-1">📷</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Tap to add photo</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                  </label>
                )}

                {/* Upload progress */}
                <AnimatePresence>
                  {uploadProgress !== null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-2"
                    >
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-rose-500 to-fuchsia-500 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Anonymous Toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5.5 rounded-full transition-colors duration-300 ${
                    isAnonymous ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} style={{ height: 22 }} />
                  <motion.div
                    className="absolute left-0.5 top-0.5 bg-white w-[18px] h-[18px] rounded-full shadow-sm"
                    animate={{ x: isAnonymous ? 18 : 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  isAnonymous ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  🎭 Post anonymously
                </span>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 text-white py-3 rounded-2xl font-bold text-sm shadow-xl shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Posting...
                    </span>
                  ) : (
                    '💖 Share Story'
                  )}
                </motion.button>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-white/60 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-600/50 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Main Feed Page ───────────────────────────
export default function FeedPage() {
  const [user] = useAuthState(auth);
  const [stories, setStories] = useState<DateStory[]>([]);
  const [dateSpots, setDateSpots] = useState<DateSpot[]>([]);
  const [userHearts, setUserHearts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // Fetch stories
  useEffect(() => {
    const storiesRef = collection(db, 'date-stories');
    const q = query(storiesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        } as DateStory;
      });
      setStories(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch date spots (for linking)
  useEffect(() => {
    const spotsRef = collection(db, 'datespots');
    const q = query(spotsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const spots = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as DateSpot[];
      setDateSpots(spots);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user hearts
  useEffect(() => {
    if (!user) { setUserHearts(new Set()); return; }

    const heartsRef = collection(db, 'story-hearts');
    const q = query(heartsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hearts = new Set<string>();
      snapshot.forEach((doc) => hearts.add(doc.data().storyId));
      setUserHearts(hearts);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle heart
  const handleHeart = useCallback(async (storyId: string) => {
    if (!user) {
      try { await signInWithPopup(auth, googleProvider); } catch { }
      return;
    }

    const heartsRef = collection(db, 'story-hearts');
    const storyRef = doc(db, 'date-stories', storyId);
    const story = stories.find((s) => s.id === storyId);
    if (!story) return;

    if (userHearts.has(storyId)) {
      // Remove heart
      const q = query(heartsRef, where('userId', '==', user.uid), where('storyId', '==', storyId));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (d) => await deleteDoc(d.ref));
      await updateDoc(storyRef, { hearts: Math.max(0, (story.hearts || 0) - 1) });
    } else {
      // Add heart
      await addDoc(heartsRef, { userId: user.uid, storyId, createdAt: new Date() });
      await updateDoc(storyRef, { hearts: (story.hearts || 0) + 1 });
    }
  }, [user, stories, userHearts]);

  // Handle post story
  const handlePostStory = useCallback(async (storyData: {
    text: string;
    imageUrl: string;
    dateSpotId: string | null;
    dateSpotName: string | null;
    isAnonymous: boolean;
  }) => {
    if (!user) return;

    await addDoc(collection(db, 'date-stories'), {
      text: storyData.text,
      imageUrl: storyData.imageUrl,
      dateSpotId: storyData.dateSpotId,
      dateSpotName: storyData.dateSpotName,
      authorId: user.uid,
      authorName: storyData.isAnonymous ? 'Anonymous' : (user.displayName || 'Anonymous'),
      authorPhoto: storyData.isAnonymous ? '' : (user.photoURL || ''),
      isAnonymous: storyData.isAnonymous,
      hearts: 0,
      createdAt: Timestamp.now(),
    });
  }, [user]);

  // Sort
  const sortedStories = useMemo(() => {
    const sorted = [...stories];
    if (sortBy === 'popular') sorted.sort((a, b) => (b.hearts || 0) - (a.hearts || 0));
    return sorted;
  }, [stories, sortBy]);

  return (
    <>
      <Head>
        <title>Date Stories — DateSpots | Community Experiences</title>
        <meta name="description" content="Read real date stories from couples in Gothenburg. Share your own experience!" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50/50 to-violet-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative">
        {/* BG effects */}
        <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-rose-300/20 to-fuchsia-400/10 dark:from-rose-500/5 dark:to-fuchsia-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-violet-300/20 to-pink-400/10 dark:from-violet-500/5 dark:to-pink-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-10 relative z-10 max-w-6xl">

          {/* ─── Header ─────────────────────────── */}
          <header className="mb-12">
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
              <div className="flex items-center gap-3">
                <Link href="/blog">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer">
                    Blog
                  </span>
                </Link>
                <ThemeToggle />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span className="text-xs font-bold text-rose-500/70 dark:text-rose-400/60 uppercase tracking-[0.2em] mb-3 block">
                Community
              </span>
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-none mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 dark:from-rose-400 dark:via-fuchsia-400 dark:to-violet-500">
                  Date Stories
                </span>
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-light">
                Real experiences from real couples. Share yours!
              </p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mt-6 mx-auto w-20 h-[2px] bg-gradient-to-r from-transparent via-rose-400 to-transparent rounded-full"
              />
            </motion.div>
          </header>

          {/* ─── Sort Bar ──────────────────────── */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-1.5 shadow-sm gap-1">
              {[
                { value: 'recent', icon: '✨', label: 'Recent' },
                { value: 'popular', icon: '💖', label: 'Popular' },
              ].map((opt) => {
                const isActive = sortBy === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as any)}
                    whileTap={{ scale: 0.92 }}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="feedSortIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-rose-500 to-fuchsia-500 rounded-xl shadow-md shadow-rose-500/20"
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      />
                    )}
                    <span className="relative z-10">{opt.icon} {opt.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-400 dark:text-gray-500 font-medium"
            >
              {stories.length} {stories.length === 1 ? 'story' : 'stories'}
            </motion.div>
          </div>

          {/* ─── Stories Grid ──────────────────── */}
          {loading ? (
            <div className="text-center py-24">
              <motion.div
                className="w-14 h-14 mx-auto mb-5 rounded-full border-[3px] border-rose-200 dark:border-rose-800 border-t-rose-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-gray-400 text-sm">Loading stories...</p>
            </div>
          ) : sortedStories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-white/40 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl border-2 border-dashed border-rose-200 dark:border-gray-700"
            >
              <div className="text-6xl mb-5">💌</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No stories yet</h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Be the first to share your date experience!</p>
              <motion.button
                onClick={() => user ? setShowWriteModal(true) : signInWithPopup(auth, googleProvider)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-500/25"
              >
                ✍️ Write First Story
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.4) }}
                >
                  <StoryCard
                    story={story}
                    isHearted={userHearts.has(story.id)}
                    onHeart={handleHeart}
                    user={user}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* ─── Footer ────────────────────────── */}
          <footer className="mt-24 text-center pb-8">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-400 dark:text-gray-500">
              <span>Made with</span>
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>💖</motion.span>
              <span>by DateSpots</span>
            </div>
          </footer>
        </div>

        {/* ─── FAB: Write Story ────────────────── */}
        <motion.button
          onClick={() => {
            if (user) setShowWriteModal(true);
            else signInWithPopup(auth, googleProvider).catch(() => {});
          }}
          className="fixed bottom-7 right-7 z-40 flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 text-white text-sm font-bold shadow-2xl shadow-rose-500/30 focus:outline-none focus:ring-4 focus:ring-rose-500/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', damping: 12 }}
        >
          <span>✍️</span>
          <span>Share Story</span>
        </motion.button>

        {/* ─── Write Modal ─────────────────────── */}
        <WriteStoryModal
          isOpen={showWriteModal}
          onClose={() => setShowWriteModal(false)}
          onSubmit={handlePostStory}
          dateSpots={dateSpots}
        />
      </div>
    </>
  );
}