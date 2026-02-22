// components/AddDateForm.tsx
import React, { useState, useCallback, useRef } from 'react';
import { DateSpot } from '../types';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import dynamic from 'next/dynamic';
import { GeoPoint } from 'firebase/firestore';
import { LucideDog } from 'lucide-react';

const MapWithNoSSR = dynamic(() => import('./MapComponent'), { ssr: false });

interface AddDateFormProps {
  onAdd: (spot: Omit<DateSpot, 'id' | 'createdAt' | 'coordinates'>) => void;
  onCancel?: () => void;
  allSpots: DateSpot[];
  userLocation: { lat: number; lng: number } | null;
}

const CATEGORY_OPTIONS = [
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

const INITIAL_FORM_STATE = {
  name: '',
  location: '',
  category: 'romantic' as DateSpot['category'],
  priceLevel: 2 as 1 | 2 | 3 | 4,
  description: '',
  tags: '',
  imageUrl: '',
  coordinates: null as { lat: number; lng: number } | null,
  petFriendly: false,
};

const AddDateForm: React.FC<AddDateFormProps> = ({ onAdd, onCancel, allSpots, userLocation }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useUrl, setUseUrl] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // ─── Handlers ───────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageOptionChange = (option: 'url' | 'upload') => {
    setUseUrl(option === 'url');
    if (option === 'url') {
      setImageFile(null);
      setPreviewImage(null);
      setUploadProgress(null);
    }
  };

  const showError = (message: string) => {
    setError(message);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ─── Helpers ────────────────────────────────
  const uploadImageAndGetUrl = async (): Promise<string> => {
    if (!imageFile) return '';
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `date-spots/${Date.now()}-${imageFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      uploadTask.on(
        'state_changed',
        snapshot => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        err => { setUploadProgress(null); reject(err); },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadProgress(null);
            resolve(url);
          } catch (err) { setUploadProgress(null); reject(err); }
        }
      );
    });
  };

  const getLandmarkFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.display_name || '';
    } catch (err) {
      console.error('Reverse geocoding failed', err);
      return '';
    }
  };

  const getSentimentScore = async (text: string): Promise<number | null> => {
    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      return data.score;
    } catch {
      return null;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const landmark = await getLandmarkFromCoords(coords.lat, coords.lng);
      setFormData(p => ({ ...p, coordinates: coords, location: landmark || p.location }));
    });
  };

  // ─── Submit ─────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location || !formData.description) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!formData.coordinates) {
      showError('Please select a location on the map.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Duplicate check
      if (allSpots.some(spot =>
        spot.name.toLowerCase() === formData.name.toLowerCase() &&
        spot.location.toLowerCase() === formData.location.toLowerCase()
      )) {
        throw new Error('A date spot with this name and location already exists.');
      }

      // Sentiment check
      const sentimentScore = await getSentimentScore(formData.description);
      if (sentimentScore === null || sentimentScore <= 0) {
        showError('The description seems unenthusiastic. Please write a more positive review!');
        setIsSubmitting(false);
        return;
      }

      let imageUrl = formData.imageUrl;
      if (!useUrl && imageFile) imageUrl = await uploadImageAndGetUrl();

      const tagArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      const newSpot = {
        ...formData,
        priceLevel: parseInt(formData.priceLevel.toString()) as 1 | 2 | 3 | 4,
        tags: tagArray.length ? tagArray : ['date spot'],
        rating: 0,
        totalVotes: 0,
        upvotes: 0,
        downvotes: 0,
        imageUrl: imageUrl || '',
        petFriendly: formData.petFriendly,
        coordinates: new GeoPoint(formData.coordinates.lat, formData.coordinates.lng),
      };

      await onAdd(newSpot);
      setFormData(INITIAL_FORM_STATE);
      setImageFile(null);
      setUseUrl(true);
      setPreviewImage(null);
      setUploadProgress(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add date spot.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, imageFile, useUrl, onAdd, allSpots]);

  // ─── Animation Variants ─────────────────────
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.08 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // ─── Styles ─────────────────────────────────
  const inputClass =
    'w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 dark:focus:border-rose-400 bg-white/80 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm placeholder-gray-400 dark:placeholder-gray-500';

  const labelClass =
    'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider';

  return (
    <motion.div ref={formRef} variants={containerVariants} initial="hidden" animate="visible" className="relative">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 rounded-2xl border border-red-200/60 dark:border-red-500/20 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 text-sm font-medium"
          >
            Date spot added successfully! 🎉
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ─── Name & Location ──────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div variants={itemVariants}>
            <label htmlFor="name" className={labelClass}>🏷️ Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. The café in Slottskogen"
              required
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="location" className={labelClass}>📍 Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`${inputClass} bg-gray-50 dark:bg-gray-800/40`}
              placeholder="Select on map below"
              readOnly
              required
            />
          </motion.div>
        </div>

        {/* ─── Map ──────────────────────────────── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200/60 dark:border-gray-700/50 h-56">
            <MapWithNoSSR
              selectedCoordinates={formData.coordinates}
              defaultCenter={userLocation || undefined}
              onSelect={async (latLng) => {
                const landmark = await getLandmarkFromCoords(latLng.lat, latLng.lng);
                setFormData(p => ({
                  ...p,
                  coordinates: latLng,
                  location: landmark || p.location,
                }));
              }}
            />
          </div>
          <div className="flex justify-end">
            <motion.button
              type="button"
              onClick={handleUseCurrentLocation}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 text-xs font-bold bg-white/60 dark:bg-gray-700/40 backdrop-blur-md border border-gray-200/60 dark:border-gray-600/50 rounded-xl text-gray-600 dark:text-gray-300 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-500 dark:hover:text-rose-400 transition-all shadow-sm"
            >
              📍 Use Current Location
            </motion.button>
          </div>
        </motion.div>

        {/* ─── Category & Price ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div variants={itemVariants}>
            <label htmlFor="category" className={labelClass}>📂 Category *</label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`${inputClass} appearance-none cursor-pointer pr-10`}
                required
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="dark:bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="priceLevel" className={labelClass}>💰 Price Level *</label>
            <div className="flex gap-2">
              {([1, 2, 3, 4] as const).map((level) => (
                <motion.button
                  key={level}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, priceLevel: level }))}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className={`
                    flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
                    ${formData.priceLevel === level
                      ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25'
                      : 'bg-white/60 dark:bg-gray-700/40 border-gray-200/60 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-rose-300 dark:hover:border-rose-500/40'
                    }
                  `}
                >
                  {'$'.repeat(level)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ─── Description ──────────────────────── */}
        <motion.div variants={itemVariants}>
          <label htmlFor="description" className={labelClass}>📝 Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="Tell us what makes this spot special for dates..."
            required
          />
        </motion.div>

        {/* ─── Image Option ─────────────────────── */}
        <motion.div variants={itemVariants} className="space-y-4">
          <label className={labelClass}>🖼️ Image</label>

          {/* Toggle pills */}
          <div className="flex gap-2">
            {(['url', 'upload'] as const).map((opt) => {
              const isActive = (opt === 'url') === useUrl;
              return (
                <motion.button
                  key={opt}
                  type="button"
                  onClick={() => handleImageOptionChange(opt)}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border capitalize
                    ${isActive
                      ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25'
                      : 'bg-white/60 dark:bg-gray-700/40 border-gray-200/60 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-rose-300 dark:hover:border-rose-500/40'
                    }
                  `}
                >
                  {opt === 'url' ? '🔗 Image URL' : '📁 Upload File'}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {useUrl ? (
              <motion.div
                key="url-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://example.com/image.jpg"
                />
              </motion.div>
            ) : (
              <motion.div
                key="file-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-4"
              >
                {/* Drop zone */}
                <label
                  htmlFor="imageFile"
                  className={`group relative flex flex-col items-center justify-center w-full py-8 px-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                    isSubmitting && uploadProgress !== null
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
                      : 'border-rose-300/60 dark:border-rose-600/30 hover:border-rose-400 dark:hover:border-rose-500/50 bg-rose-50/30 dark:bg-rose-900/5 hover:bg-rose-50/60 dark:hover:bg-rose-900/10'
                  }`}
                >
                  <span className="text-3xl mb-2">
                    {isSubmitting && uploadProgress !== null ? '⏳' : '🖼️'}
                  </span>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {imageFile ? 'Change Image' : 'Choose an Image'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <input
                    type="file"
                    id="imageFile"
                    name="imageFile"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                    disabled={isSubmitting && uploadProgress !== null}
                  />
                </label>

                {/* Preview */}
                <AnimatePresence>
                  {previewImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl border border-gray-200/60 dark:border-gray-700/50"
                    >
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-xl shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">
                          {imageFile?.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {((imageFile?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload progress */}
                <AnimatePresence>
                  {uploadProgress !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-rose-50/50 dark:bg-rose-500/5 rounded-2xl border border-rose-200/60 dark:border-rose-500/15 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Uploading...</span>
                        <span className="text-xs font-bold text-rose-500 tabular-nums">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-rose-500 to-fuchsia-500 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Pet Friendly ─────────────────────── */}
        <motion.div variants={itemVariants}>
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.petFriendly}
                onChange={(e) => setFormData({ ...formData, petFriendly: e.target.checked })}
                className="sr-only"
              />
              <motion.div
                className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                  formData.petFriendly ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
              <motion.div
                className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full shadow-sm"
                animate={{ x: formData.petFriendly ? 20 : 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            </div>
            <span className={`text-sm font-medium transition-colors ${
              formData.petFriendly
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              🐾 Pet Friendly
            </span>
            <AnimatePresence>
              {formData.petFriendly && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: 10 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="text-emerald-500"
                >
                  <LucideDog size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </label>
        </motion.div>

        {/* ─── Tags ─────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <label htmlFor="tags" className={labelClass}>🏷️ Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className={inputClass}
            placeholder="e.g. romantic, sunset, picnic"
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
            Separate multiple tags with commas
          </p>
        </motion.div>

        {/* ─── Submit Buttons ──────────────────── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 pt-4"
        >
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 relative overflow-hidden bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 hover:from-rose-600 hover:via-fuchsia-600 hover:to-violet-700 text-white py-3.5 px-8 rounded-2xl font-bold text-sm shadow-xl shadow-rose-500/20 hover:shadow-2xl hover:shadow-rose-500/30 focus:outline-none focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Adding...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>✨</span>
                Add Date Spot
              </span>
            )}
          </motion.button>

          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-white/60 dark:bg-gray-700/40 backdrop-blur-md text-gray-600 dark:text-gray-300 py-3.5 px-8 rounded-2xl font-bold text-sm border border-gray-200/60 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-600/40 hover:border-gray-300 dark:hover:border-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-500/10 transition-all duration-300 shadow-sm"
            >
              Cancel
            </motion.button>
          )}
        </motion.div>
      </form>

      {/* ─── Full-screen Submitting Overlay ────── */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 dark:border-gray-700/50"
            >
              <motion.div
                className="w-14 h-14 border-[3px] border-rose-200 dark:border-rose-800 border-t-rose-500 dark:border-t-rose-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Adding your spot...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddDateForm;