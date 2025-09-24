// components/DateCard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateSpot } from '../types';

interface DateCardProps {
  spot: DateSpot;
  onRate: (id: string, rating: number) => void;
  onVote: (documentId: string, voteType: 'up' | 'down' | 'remove') => void;
  user: any;
  userVote: 'up' | 'down' | null;
}

const DateCard: React.FC<DateCardProps> = ({ spot, onRate, onVote, user, userVote }) => {
  const [isRating, setIsRating] = useState(false);
  const [localUserVote, setLocalUserVote] = useState<'up' | 'down' | null>(userVote);

  React.useEffect(() => {
    setLocalUserVote(userVote);
  }, [userVote]);

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      outdoor: '🌳',
      indoor: '🏠',
      food: '🍽️',
      culture: '🎭',
      adventure: '🎯',
      romantic: '💕',
      water: '🌊',
      view: '🌆',
      entertainment: '🎪'
    };
    return emojis[category] || '📍';
  };

  const getPriceDisplay = (priceLevel: number) => {
    return '$'.repeat(priceLevel);
  };

  const renderHearts = (rating: number) => {
    const fullHearts = Math.floor(rating);
    const hasHalfHeart = rating % 1 >= 0.5;
    const hearts = [];

    for (let i = 0; i < fullHearts; i++) {
      hearts.push(
        <motion.span
          key={`full-${i}`}
          className="text-pink-500 text-lg"
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          💖
        </motion.span>
      );
    }

    if (hasHalfHeart) {
      hearts.push(
        <motion.span
          key="half"
          className="text-pink-400 text-lg"
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          💖
        </motion.span>
      );
    }

    const totalHearts = hasHalfHeart ? fullHearts + 1 : fullHearts;
    for (let i = totalHearts; i < 5; i++) {
      hearts.push(
        <motion.span
          key={`empty-${i}`}
          className="text-gray-300 dark:text-gray-500 text-lg"
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          ♡
        </motion.span>
      );
    }

    return hearts;
  };

  const handleHeartClick = (heartIndex: number) => {
    onRate(spot.id, heartIndex + 1);
    setIsRating(false);
  };

  const handleVote = (voteType: 'up' | 'down') => {
    if (!user) {
      alert('Please sign in with Google to vote on date spots!');
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

  // Animation variants for the card
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }
  };

  // Animation variants for the rating popup
  const ratingVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: { opacity: 1, height: "auto", marginTop: "1rem", transition: { duration: 0.2 } },
    exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6 border border-pink-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ duration: 0.2 }}
    >
      {/* Image Section */}
      {spot.imageUrl ? (
        <div className="relative h-48 overflow-hidden">
          <motion.img
            src={spot.imageUrl}
            alt={spot.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
            // Add image load animation
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="absolute top-3 right-3 bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          >
            {getCategoryEmoji(spot.category)}
          </motion.div>
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-700 dark:to-purple-800 flex items-center justify-center">
          <div className="text-4xl text-white">📍</div>
          <motion.div
            className="absolute top-3 right-3 bg-white/70 dark:bg-gray-800/70 text-pink-500 dark:text-pink-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm border border-pink-200 dark:border-gray-600"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          >
            {getCategoryEmoji(spot.category)}
          </motion.div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-5">
        {/* Title and Location */}
        <motion.div
          className="flex justify-between items-start mb-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate">{spot.name}</h3>
        </motion.div>

        <motion.p
          className="text-gray-600 dark:text-gray-300 mb-3 flex items-center text-sm"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="mr-1.5 text-base">📍</span>
          <span className="truncate">{spot.location}</span>
        </motion.p>

        <motion.p
          className="text-gray-700 dark:text-gray-200 mb-3 text-sm leading-relaxed line-clamp-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {spot.description}
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-2 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {spot.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium truncate max-w-[80px] border border-purple-200 dark:border-purple-800/50"
            >
              #{tag}
            </span>
          ))}
        </motion.div>

        <motion.div
          className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {renderHearts(spot.rating)}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
               {spot.rating.toFixed(1)} ({spot.upvotes + spot.downvotes})
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
              {getPriceDisplay(spot.priceLevel)}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsRating(!isRating)}
              className="text-lg text-pink-500 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors leading-none"
              aria-label="Rate this spot"
            >
              ✨
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('up')}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full transition-colors text-sm font-medium ${
                localUserVote === 'up'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-green-900/20 dark:hover:text-green-300'
              }`}
              aria-label="Upvote this spot"
              disabled={!user}
            >
              <span>👍</span>
              <span>{spot.upvotes}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('down')}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full transition-colors text-sm font-medium ${
                localUserVote === 'down'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-300'
              }`}
              aria-label="Downvote this spot"
              disabled={!user}
            >
              <span>👎</span>
              <span>{spot.downvotes}</span>
            </motion.button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
            Net: {spot.upvotes - spot.downvotes}
          </div>
        </motion.div>

        {/* Animated Rating Section */}
        <AnimatePresence>
          {isRating && (
            <motion.div
              variants={ratingVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-100 dark:border-pink-800/50"
            >
              <p className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-3 text-center">Rate this spot:</p>
              <div className="flex space-x-4 justify-center">
                {[1, 2, 3, 4, 5].map((value) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleHeartClick(value - 1)}
                    className="text-2xl transition-transform leading-none"
                    aria-label={`Rate ${value} hearts`}
                  >
                    💖
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DateCard;