// pages/index.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, getDocs, setDoc, where, deleteDoc, Timestamp } from 'firebase/firestore';
import DateCard from '../components/DateCard';
import AddDateForm from '../components/AddDateForm';
import { DateSpot, Vote } from '../types';
import { initialDateSpots } from '../lib/initialData';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
// --- AuthButton Component ---


  // --- Custom Alert Modal States ---

// --- Custom Alert Modal Component ---

const AuthButton: React.FC<{ inApp: boolean }> = ({ inApp }) => {
  const [user, loading] = useAuthState(auth);
  
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [alertCard, setAlertCard] = useState<{
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
} | null>(null);




 
  const handleGoogleSignIn = async () => {
    if (inApp) {
      setShowLoginDialog(true);
       setAlertCard({
    title: 'Sign-in Unavailable',
    message: 'Google sign-in is disabled inside in-app browsers. Please open in Safari or Chrome.',
    onConfirm: () => setAlertCard(null),
  });
  return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code.includes('FirebaseError: Firebase: Error (auth/popup-closed-by-user)') || error.code.includes('popup-blocked')) {
        // User closed popup or another popup is open, silently ignore
        console.log('Google sign-in was cancelled by user or popup conflict.');
        return;
      }
    //   console.error('Error signing in with Google:', error);
    //    setTimeout(() => {
    //   alert('Failed to sign in. Please try again.');
    // }, 0);
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
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-pink-500"></div>
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
                className="w-8 h-8 rounded-full border-2 border-pink-400 dark:border-pink-500"
              />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:inline">
              {user.displayName}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleGoogleSignIn}
          className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 dark:focus:ring-offset-gray-900 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

      )}
 {/* ✨ Login required popup */}
      <AnimatePresence>
        {showLoginDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-xs w-full text-center border border-pink-200 dark:border-gray-700"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Almost there!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Please open this page in Safari, Chrome, or another standard browser to sign in.
              </p>
              <button
                onClick={() => setShowLoginDialog(false)}
                className="px-4 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-medium shadow-md transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// --- ThemeToggle Component ---
const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect runs only on the client side, after the component has mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // If the component hasn't mounted yet, render a static, non-dynamic button.
  // This prevents the hydration mismatch.
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 dark:focus:ring-offset-gray-900 transition-colors"
        aria-label="Switch theme"
      >
        ...
      </button>
    );
  }

  return (
    <motion.button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 dark:focus:ring-offset-gray-900 transition-colors"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </motion.button>
  );
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const toRad = (v: number) => v * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor;

  const patterns = [
    /FBAN|FBAV/i,     // Facebook app
    /Instagram/i,
    /Line/i,
    /Twitter/i,
    /LinkedInApp/i,
    /Messenger/i
  ];

  return patterns.some((p) => p.test(ua));
}


// --- Main Home Component ---
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
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [inApp, setInApp] = useState(false);
 
    const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    onConfirm: null as unknown as (() => void) | undefined,
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

    // --- Close alert modal handler ---
  const closeAlertModal = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };
  const [alertCard, setAlertCard] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.error('Location error', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);
  useEffect(() => {
    // run only on client
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

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAndListen = async () => {
      try {
        const spotsRef = collection(db, 'datespots');
        const snapshot = await getDocs(spotsRef);

        if (snapshot.empty) {
          console.log('Initializing with sample data...');
          const writePromises = initialDateSpots.map(async (spot) => {
            const docRef = doc(db, 'datespots', spot.id);
            return setDoc(docRef, {
              ...spot,
              createdAt: new Date(spot.createdAt)
            });
          });

          await Promise.all(writePromises);
          console.log('Sample data initialized successfully with custom IDs!');
        }
      } catch (error) {
        console.error('Error initializing ', error);
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

      return unsubscribe;
    };

    initializeAndListen();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const mapFirestoreDoc = (doc: any): DateSpot => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
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
      // optional padding so it's not flush to top
      const padding = 20;
      window.scrollTo({ top: top - padding, behavior: 'smooth' });
    }
  };

  // const requestLocation = () => {
  //   console.log('Requesting user location...');
  //   navigator.geolocation.getCurrentPosition(
  //     pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
  //     err => console.error(err),
  //     { enableHighAccuracy: true }
  //   );
  // };

  const filteredSpots = useMemo(() => {
    let result = [...dateSpots];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(spot =>
        spot.name.toLowerCase().includes(term) ||
        spot.location.toLowerCase().includes(term) ||
        spot.description.toLowerCase().includes(term) ||
        (spot.tags && spot.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    if (selectedCategory) {
      result = result.filter(spot => spot.category === selectedCategory);
    }

    if (minRating > 0) {
      result = result.filter(spot => spot.rating >= minRating);
    }



    result.sort((a, b) => {
      if (sortBy === 'distance' && userLocation && a.coordinates && b.coordinates) {
        const da = haversine(userLocation.lat, userLocation.lng, a.coordinates.latitude, a.coordinates.longitude);
        const db = haversine(userLocation.lat, userLocation.lng, b.coordinates.latitude, b.coordinates.longitude);
        return da - db;
      }

      switch (sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        case 'createdAt': return b.createdAt.getTime() - a.createdAt.getTime();
        default: return 0;
      }
    });

    return result;
  }, [dateSpots, searchTerm, selectedCategory, minRating, sortBy]);



  const handleAddSpot = useCallback(async (spotData: Omit<DateSpot, 'id' | 'createdAt'>) => {
    if (!user) {
       alert({
    title: 'Sign in required',
    message: 'Please sign in with Google to add a new date spot.',
    onConfirm: async () => {
      await signInWithPopup(auth, googleProvider);
      setAlertCard(null);
    },
    onCancel: () => setAlertCard(null),
  });

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
  }, [user]);

  const handleRateSpot = useCallback(async (id: string, rating: number) => {
    try {
      const spotRef = doc(db, 'datespots', id);
      const spot = dateSpots.find(s => s.id === id);

      if (spot) {
        const newTotalVotes = spot.totalVotes + 1;
        const newRating = ((spot.rating * spot.totalVotes) + rating) / newTotalVotes;

        await updateDoc(spotRef, {
          rating: newRating,
          totalVotes: newTotalVotes
        });
      }
    } catch (err) {
      console.error('Error rating date spot:', err);
    }
  }, [dateSpots]);

  const handleVoteSpot = useCallback(async (documentId: string, voteType: 'up' | 'down' | 'remove') => {
    if (!user) {
      alert('Please sign in with Google to vote on date spots!');
      return;
    }

    try {
      const spotRef = doc(db, 'datespots', documentId);
      const spot = dateSpots.find(s => s.id === documentId);

      if (!spot) {
        console.error(`Spot with document ID ${documentId} not found in local state`);
        return;
      }

      // Check if user has already voted for this spot
      const userCurrentVote = userVotes[documentId];

      if (voteType === 'remove') {
        // Remove existing vote
        if (userCurrentVote) {
          // Find the vote document to delete
          const votesRef = collection(db, 'votes');
          const q = query(
            votesRef,
            where('userId', '==', user.uid),
            where('dateSpotId', '==', documentId)
          );

          const voteSnapshot = await getDocs(q);
          voteSnapshot.forEach(async (voteDoc) => {
            await deleteDoc(voteDoc.ref);
          });

          // Update the spot counts
          const updateData = userCurrentVote === 'up'
            ? { upvotes: Math.max(0, (spot.upvotes || 0) - 1) }
            : { downvotes: Math.max(0, (spot.downvotes || 0) - 1) };

          await updateDoc(spotRef, updateData);
        }
        return;
      }

      // If user is changing their vote
      if (userCurrentVote) {
        if (userCurrentVote === voteType) {
          // Same vote - remove it (toggle off)
          const votesRef = collection(db, 'votes');
          const q = query(
            votesRef,
            where('userId', '==', user.uid),
            where('dateSpotId', '==', documentId)
          );

          const voteSnapshot = await getDocs(q);
          voteSnapshot.forEach(async (voteDoc) => {
            await deleteDoc(voteDoc.ref);
          });

          // Update the spot counts
          const updateData = userCurrentVote === 'up'
            ? { upvotes: Math.max(0, (spot.upvotes || 0) - 1) }
            : { downvotes: Math.max(0, (spot.downvotes || 0) - 1) };

          await updateDoc(spotRef, updateData);
          return;
        } else {
          // Changing vote from up to down or vice versa
          const votesRef = collection(db, 'votes');
          const q = query(
            votesRef,
            where('userId', '==', user.uid),
            where('dateSpotId', '==', documentId)
          );

          const voteSnapshot = await getDocs(q);
          voteSnapshot.forEach(async (voteDoc) => {
            await updateDoc(voteDoc.ref, { voteType });
          });

          // Update the spot counts
          const updateData = userCurrentVote === 'up'
            ? {
              upvotes: Math.max(0, (spot.upvotes || 0) - 1),
              downvotes: (spot.downvotes || 0) + 1
            }
            : {
              upvotes: (spot.upvotes || 0) + 1,
              downvotes: Math.max(0, (spot.downvotes || 0) - 1)
            };

          await updateDoc(spotRef, updateData);
          return;
        }
      }

      // New vote
      const votesRef = collection(db, 'votes');
      await addDoc(votesRef, {
        userId: user.uid,
        dateSpotId: documentId,
        voteType: voteType,
        createdAt: new Date()
      });

      // Update the spot counts
      const updateData = voteType === 'up'
        ? { upvotes: (spot.upvotes || 0) + 1 }
        : { downvotes: (spot.downvotes || 0) + 1 };

      await updateDoc(spotRef, updateData);

    } catch (error) {
      console.error('Error voting on date spot:', error);
    }
  }, [dateSpots, user, userVotes]);

  const getCategoryOptions = () => [
    { value: '', label: 'All Categories' },
    { value: 'romantic', label: '💕 Romantic' },
    { value: 'food', label: '🍽️ Food & Drinks' },
    { value: 'outdoor', label: '🌳 Outdoor' },
    { value: 'indoor', label: '🏠 Indoor' },
    { value: 'culture', label: '🎭 Arts & Culture' },
    { value: 'adventure', label: '🎯 Adventure' },
    { value: 'water', label: '🌊 Water Activities' },
    { value: 'view', label: '🌆 Viewpoints' },
    { value: 'entertainment', label: '🎪 Entertainment' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <div className="flex justify-between items-center mb-8">
            <div></div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <AuthButton inApp={inApp} />
            </div>
          </div>

          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-600 to-indigo-600 dark:from-pink-400 dark:via-fuchsia-500 dark:to-purple-500 mb-4 tracking-tight">
            💖 DateSpots
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover and share the most romantic date spots in Gothenburg and beyond. Crowdsourced by people like you!
          </p>
        </header>


        {/* Add Spot Button */}
        <div className="flex justify-center mb-12">
          {user ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 dark:from-pink-600 dark:to-purple-700 text-white py-3.5 px-8 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 dark:hover:from-pink-700 dark:hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center"
            >
              <span className="mr-2">➕</span>
              Add New Date Spot
            </button>
          ) : (
            <div className="text-center">
              <button
                onClick={() => {
                  alert('Please sign in with Google to add a new date spot!');
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 dark:from-pink-600 dark:to-purple-700 text-white py-3.5 px-8 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 dark:hover:from-pink-700 dark:hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center"
              >
                <span className="mr-2">➕</span>
                Add New Date Spot
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Sign in with Google to add spots</p>
            </div>
          )}

        </div>

        {/* Filter and Sort Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 mb-12 border border-pink-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div ref={searchRef} className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔍 Search Date Spots
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onFocus={scrollToTop}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white transition-all duration-300 shadow-sm"
                placeholder="Search by name, location, or description..."
              />
            </div>

            <div className="flex-1">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📂 Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white transition-all duration-300 shadow-sm"
              >
                {getCategoryOptions().map((option) => (
                  <option key={option.value} value={option.value} className="dark:bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="minRating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                💖 Min Rating
              </label>
              <select
                id="minRating"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white transition-all duration-300 shadow-sm"
              >
                <option value={0} className="dark:bg-gray-800">Any Rating</option>
                <option value={4.5} className="dark:bg-gray-800">4.5+ Hearts</option>
                <option value={4} className="dark:bg-gray-800">4+ Hearts</option>
                <option value={3.5} className="dark:bg-gray-800">3.5+ Hearts</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'name' | 'createdAt')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm dark:bg-gray-700 dark:text-white transition-all duration-300"
              >
                <option value="rating" className="dark:bg-gray-800">Hearts</option>
                <option value="name" className="dark:bg-gray-800">Name</option>
                <option value="createdAt" className="dark:bg-gray-800">Newest</option>
                <option value="distance" className="dark:bg-gray-800">Nearest</option>

              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="text-center py-16 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-2xl shadow-lg border border-red-200 dark:border-red-900">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading romantic date spots...</p>
          </div>
        ) : filteredSpots.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">💐</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No date spots found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria or add a new spot!</p>
          </div>
        ) : (
          <div>
            <div className="mb-8 text-gray-600 dark:text-gray-400 font-medium">
              Found {filteredSpots.length} romantic date spot{filteredSpots.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredSpots.map((spot) => (
                <DateCard
                  key={spot.id}
                  spot={spot}
                  onRate={handleRateSpot}
                  onVote={handleVoteSpot}
                  user={user}
                  userVote={userVotes[spot.id] || null}
                />
              ))}
            </div>
          </div>
        )}

        <footer className="mt-20 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Made with 💖 for anyone who appreciates thoughtful date ideas</p>
        </footer>
      </div>
      

      {/* Modal for Add Date Form - Only show if user is signed in */}
      {showAddForm && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add a New Date Spot</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl"
                >
                  &times;
                </button>
              </div>
              <AddDateForm
                onAdd={handleAddSpot}
                onCancel={() => setShowAddForm(false)}
                allSpots={dateSpots}
                userLocation={userLocation} />
            </div>
          </div>
        </div>
      )}
       {/* --- Custom Alert Modal --- */}
      
    </div>
  );
}