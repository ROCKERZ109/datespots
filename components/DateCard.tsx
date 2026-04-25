// components/DateCard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateSpot } from '../types';
import { HeartOff } from 'lucide-react';
import { LiaHeartSolid } from 'react-icons/lia';

interface DateCardProps {
  spot: DateSpot;
  onVote: (documentId: string, voteType: 'up' | 'down' | 'remove') => void;
  user: any;
  userVote: 'up' | 'down' | null;
}

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  outdoor: { emoji: '🌳', color: 'bg-emerald-500' },
  indoor: { emoji: '🏠', color: 'bg-amber-500' },
  food: { emoji: '🍽️', color: 'bg-orange-500' },
  culture: { emoji: '🎭', color: 'bg-violet-500' },
  adventure: { emoji: '🎯', color: 'bg-sky-500' },
  romantic: { emoji: '💕', color: 'bg-rose-500' },
  water: { emoji: '🌊', color: 'bg-cyan-500' },
  view: { emoji: '🌆', color: 'bg-indigo-500' },
  entertainment: { emoji: '🎪', color: 'bg-fuchsia-500' },
};

const DateCard: React.FC<DateCardProps> = ({ spot, onVote, user, userVote }) => {
  const [localUserVote, setLocalUserVote] = useState<'up' | 'down' | null>(userVote);
  const [isHovered, setIsHovered] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    setLocalUserVote(userVote);
  }, [userVote]);

  const cat = CATEGORY_META[spot.category] || { emoji: '📍', color: 'bg-gray-500' };
  const netScore = (spot.upvotes || 0) - (spot.downvotes || 0);

  const handleVote = (voteType: 'up' | 'down') => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    if (localUserVote === voteType) {
      onVote(spot.id, 'remove');
      setLocalUserVote(null);
    } else {
      onVote(spot.id, voteType);
      setLocalUserVote(voteType);
    }
  };

  return (
    <>
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered((prev) => !prev)}
        className="group relative bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[20px] overflow-hidden border border-white/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/40 dark:shadow-black/20 hover:shadow-xl hover:shadow-rose-500/[0.08] dark:hover:shadow-rose-500/[0.05] transition-all duration-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3 }}
      >
        {/* ─── Image Section ────────────────────── */}
        <div className="relative h-52 overflow-hidden">
          {spot.imageUrl && !imgError ? (
            <motion.img
              src={spot.imageUrl}
              alt={spot.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: isHovered ? 1.06 : 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-200 via-fuchsia-200 to-violet-300 dark:from-rose-800/40 dark:via-fuchsia-800/30 dark:to-violet-800/40 flex items-center justify-center">
              <span className="text-5xl opacity-40">💖</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Category badge */}
          <motion.div
            className={`absolute top-3.5 left-3.5 ${cat.color} text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, type: 'spring', damping: 18 }}
          >
            <span>{cat.emoji}</span>
            <span className="capitalize tracking-wide">{spot.category}</span>
          </motion.div>

          {/* Price badge */}
          <motion.div
            className="absolute top-3.5 right-3.5 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-white/20 shadow-lg"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 18 }}
          >
            {'$'.repeat(spot.priceLevel)}
          </motion.div>

          {/* Pet friendly badge */}
          <AnimatePresence>
            {spot.petFriendly && (
              <motion.div
                className="absolute bottom-3.5 right-3.5 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ delay: 0.25, type: 'spring', damping: 15 }}
              >
                <span>🐾</span>
                <span className="hidden sm:inline">Pet OK</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title overlay on image bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-8 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-lg font-bold text-white leading-snug tracking-tight line-clamp-1 drop-shadow-md">
              {spot.name}
            </h3>
            {spot.coordinates ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${spot.coordinates.latitude},${spot.coordinates.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white text-xs font-medium flex items-center gap-1 mt-0.5 transition-colors w-fit"
              >
                <span className="text-[10px]">📍</span>
                <span className="truncate max-w-[200px]">{spot.location}</span>
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                <span className="text-[10px]">📍</span>
                <span className="truncate max-w-[200px]">{spot.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* ─── Content Section ──────────────────── */}
        <div className="p-5 space-y-4">

          {/* Description — expands on hover */}
          <motion.div
            className="overflow-hidden"
            initial={false}
            animate={{ height: isHovered ? 'auto' : 48 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
              {spot.description}
            </p>
          </motion.div>

          {/* Tags */}
          {spot.tags && spot.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {spot.tags.slice(0, 4).map((tag, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/15 tracking-wide"
                >
                  #{tag}
                </motion.span>
              ))}
              {spot.tags.length > 4 && (
                <span className="px-2 py-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                  +{spot.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* ─── Vote Section ────────────────────── */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100/80 dark:border-gray-700/50">
            {/* Upvote */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleVote('up')}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 border
                ${localUserVote === 'up'
                  ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-white/60 dark:bg-gray-700/40 border-gray-200/60 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-500 dark:hover:text-rose-400'
                }
              `}
            >
              <LiaHeartSolid className={`w-4 h-4 ${localUserVote === 'up' ? 'text-white' : 'text-rose-400'}`} />
              <span className="tabular-nums">{spot.upvotes || 0}</span>
            </motion.button>

            {/* Score pill */}
            <motion.div
              className={`
                px-3.5 py-2.5 rounded-xl text-xs font-bold tabular-nums border shadow-sm
                ${netScore > 0
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20'
                  : netScore < 0
                  ? 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border-red-200/60 dark:border-red-500/20'
                  : 'bg-gray-50 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500 border-gray-200/60 dark:border-gray-700/50'
                }
              `}
              key={netScore}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {netScore > 0 ? '+' : ''}{netScore}
            </motion.div>

            {/* Downvote */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleVote('down')}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 border
                ${localUserVote === 'down'
                  ? 'bg-gray-700 dark:bg-gray-600 border-gray-700 dark:border-gray-500 text-white shadow-md shadow-gray-700/25'
                  : 'bg-white/60 dark:bg-gray-700/40 border-gray-200/60 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                }
              `}
            >
              <HeartOff className={`w-4 h-4 ${localUserVote === 'down' ? 'text-white' : 'text-gray-400'}`} />
              <span className="tabular-nums">{spot.downvotes || 0}</span>
            </motion.button>
          </div>

        </div>
      </motion.div>

      {/* ─── Login Dialog ────────────────────── */}
      <AnimatePresence>
        {showLoginDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-rose-100 dark:border-gray-700"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="text-4xl mb-4">💖</div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Sign in to vote
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Sign in with Google to upvote or downvote date spots.
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
    </>
  );
};

export default DateCard;