// components/AddDateForm.tsx
import React, { useState, useCallback, useRef } from 'react';
import { DateSpot } from '../types';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import OpenAI from 'openai';
import dynamic from 'next/dynamic';
import { GeoPoint } from 'firebase/firestore';
import { DogIcon, LucideDog } from 'lucide-react';

const MapWithNoSSR = dynamic(() => import('./LeafLet'), { ssr: false });

interface AddDateFormProps {
  onAdd: (spot: Omit<DateSpot, 'id' | 'createdAt' | 'coordinates'>) => void;
  onCancel?: () => void;
  allSpots: DateSpot[];
  userLocation: { lat: number; lng: number } | null;
}

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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
  initialRating: 4,
  coordinates: null as { lat: number; lng: number } | null,
  petFriendly: false,
};

const AddDateForm: React.FC<AddDateFormProps> = ({ onAdd, onCancel, allSpots, userLocation }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useUrl, setUseUrl] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

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

  const handleRatingClick = useCallback((rating: number) => {
    setFormData(prev => ({ ...prev, initialRating: rating }));
  }, []);

  const handleRatingHover = useCallback((rating: number | null) => {
    setHoverRating(rating);
  }, []);

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
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a sentiment analysis bot. Respond with a single number -1 to 1." },
          { role: "user", content: text },
        ],
        max_tokens: 5,
      });

      const score = parseFloat(response.choices[0].message.content || '');
      return isNaN(score) || score < -1 || score > 1 ? null : score;
    } catch {
      return null;
    }
  };
  const formRef = useRef<HTMLDivElement>(null);
  const showError = (message: string) => {
    setError(message);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  const handleSubmit = useCallback(async (e: React.FormEvent) => {


    e.preventDefault();
    if (!formData.name || !formData.location || !formData.description) {
      setError('Please fill in all required fields'); return;
    }
    if (!formData.coordinates) {
      showError('Please select a location for the date spot.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true); setError('');

    try {
      // Duplicate check
      if (allSpots.some(spot =>
        spot.name.toLowerCase() === formData.name.toLowerCase() &&
        spot.location.toLowerCase() === formData.location.toLowerCase()
      )) throw new Error('A date spot with this name and location already exists.');

      // Sentiment check
      const sentimentScore = await getSentimentScore(formData.description);
      if (sentimentScore === null || sentimentScore <= 0) {
        showError('The description seems unenthusiastic. Please write a more positive review!');
        return;
      }
      let imageUrl = formData.imageUrl;
      if (!useUrl && imageFile) imageUrl = await uploadImageAndGetUrl();

      const tagArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      const newSpot = {
        ...formData,
        priceLevel: parseInt(formData.priceLevel.toString()) as 1 | 2 | 3 | 4,
        tags: tagArray.length ? tagArray : ['date spot'],
        rating: formData.initialRating,
        totalVotes: 1,
        upvotes: 0,
        downvotes: 0,
        imageUrl: imageUrl || '',
        petFriendly: formData.petFriendly,
        coordinates: formData.coordinates ? new GeoPoint(formData.coordinates.lat, formData.coordinates.lng) : null,

      };

      await onAdd(newSpot);
      setFormData(INITIAL_FORM_STATE);
      setImageFile(null); setUseUrl(true); setPreviewImage(null); setUploadProgress(null);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add date spot.');
    } finally { setIsSubmitting(false); }
  }, [formData, imageFile, useUrl, onAdd, allSpots]);
  const handleUseCurrentLocation = () => {

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const landmark = await getLandmarkFromCoords(coords.lat, coords.lng);
      setFormData(p => ({ ...p, coordinates: coords, location: landmark || p.location }));
      setShowMap(true); // ensure map is visible
    });

    // navigator.geolocation.getCurrentPosition(
    //   (position) => {
    //     setFormData(prev => ({
    //       ...prev,
    //       coordinates: {
    //         lat: position.coords.latitude,
    //         lng: position.coords.longitude,
    //       }
    //     }));
    //     setShowMap(true); // show map so user can fine-tune if needed
    //     setError(''); // clear any previous errors
    //   },
    //   () => setError("Unable to retrieve your location. Please select manually.")
    // );
  };

  const renderRatingHearts = () => {
    const displayRating = hoverRating !== null ? hoverRating : formData.initialRating;
    return (
      <motion.div layout className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map(value => (
          <motion.button
            key={value} type="button" onClick={() => handleRatingClick(value)}
            onMouseEnter={() => handleRatingHover(value)}
            onMouseLeave={() => handleRatingHover(null)}
            className="relative group focus:outline-none"
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="text-3xl cursor-pointer transition-all duration-200 relative z-10"
              animate={{
                color: value <= displayRating ? '#ec4899' : '#d1d5db',
                filter: value <= displayRating ? 'brightness(1.1)' : 'brightness(0.3)'
              }}
            >💖</motion.span>
          </motion.button>
        ))}
      </motion.div>
    );
  };

  const containerVariants: Variants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  const inputClass = "w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm hover:shadow-md placeholder-gray-400 dark:placeholder-gray-500 backdrop-blur-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 tracking-wide";

  return (
    <motion.div ref={formRef} variants={containerVariants} initial="hidden" animate="visible" className="relative overflow-hidden">
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-8">
        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 p-5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl">{error}</motion.div>}
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 p-5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-2xl">Date spot added successfully!</motion.div>}
        </AnimatePresence>


        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div variants={itemVariants}>
              <label htmlFor="name" className={labelClass}>
                <span className="inline-flex items-center">
                  <span className="mr-2">🏷️</span>
                  Name *
                </span>
              </label>
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
              <label htmlFor="location" className={labelClass}>
                <span className="inline-flex items-center">
                  <span className="mr-2">📍</span>
                  Location *
                </span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. Haga, Göteborg"
                required
              />
            </motion.div>

          </div>

          <motion.div variants={itemVariants}>
            <button type="button" onClick={() => setShowMap(prev => !prev)} className="mt-3 px-4 py-2 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600">
              {showMap ? "Hide Map" : formData.coordinates ? "Change Location on Map" : "Add Location on Map"}
            </button>

          </motion.div>

          {showMap && (

            <><motion.div variants={itemVariants} className="mt-4 rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 h-64">
              <MapWithNoSSR
                selectedCoordinates={formData.coordinates}
                defaultCenter={userLocation || undefined} // ✅ Center map if user location exists

                onSelect={async (latLng) => {
                  const landmark = await getLandmarkFromCoords(latLng.lat, latLng.lng);
                  setFormData(p => ({
                    ...p,
                    coordinates: latLng,
                    location: landmark || p.location, // fill location field if found
                  }));
                }}
              />

            </motion.div><motion.div variants={itemVariants} className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="px-4 py-2 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition-all duration-300"
                >
                  📍 Use My Current Location
                </button>
              </motion.div></>



          )}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div variants={itemVariants}>
              <label htmlFor="category" className={labelClass}>
                <span className="inline-flex items-center">
                  <span className="mr-2">📂</span>
                  Category *
                </span>
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none cursor-pointer`}
                  required
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="dark:bg-gray-800">
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="priceLevel" className={labelClass}>
                <span className="inline-flex items-center">
                  <span className="mr-2">💰</span>
                  Price Level *
                </span>
              </label>
              <div className="relative">
                <select
                  id="priceLevel"
                  name="priceLevel"
                  value={formData.priceLevel}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none cursor-pointer`}
                  required
                >
                  <option value={1} className="dark:bg-gray-800">$ (Budget)</option>
                  <option value={2} className="dark:bg-gray-800">$$ (Moderate)</option>
                  <option value={3} className="dark:bg-gray-800">$$$ (Upscale)</option>
                  <option value={4} className="dark:bg-gray-800">$$$$ (Luxury)</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={itemVariants}>
            <label htmlFor="description" className={labelClass}>
              <span className="inline-flex items-center">
                <span className="mr-2">📝</span>
                Description *
              </span>
            </label>
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

          <motion.div variants={itemVariants}>
            <label className={labelClass}>
              <span className="inline-flex items-center">
                <span className="mr-2">🖼️</span>
                Image Option
              </span>
            </label>
            <div className="space-y-6">
              <div className="flex items-center space-x-8">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="imageOption"
                      checked={useUrl}
                      onChange={() => handleImageOptionChange('url')}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${useUrl
                      ? 'border-pink-500 bg-pink-500 shadow-lg shadow-pink-500/30'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-pink-400'
                      }`}>
                      <motion.div
                        className="w-2 h-2 bg-white rounded-full absolute top-1 left-1"
                        animate={{ scale: useUrl ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-gray-700 dark:text-gray-300 font-medium">Use Image URL</span>
                </label>

                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="imageOption"
                      checked={!useUrl}
                      onChange={() => handleImageOptionChange('upload')}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${!useUrl
                      ? 'border-pink-500 bg-pink-500 shadow-lg shadow-pink-500/30'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-pink-400'
                      }`}>
                      <motion.div
                        className="w-2 h-2 bg-white rounded-full absolute top-1 left-1"
                        animate={{ scale: !useUrl ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-gray-700 dark:text-gray-300 font-medium">Upload File</span>
                </label>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {useUrl ? (
                <motion.div
                  key="url-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 overflow-hidden"
                >
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://example.com/image.jpg "
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="file-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="space-y-6">
                    <label
                      htmlFor="imageFile"
                      className={`group relative flex flex-col items-center justify-center w-full py-8 px-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${isSubmitting && uploadProgress !== null
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
                        : 'border-pink-300 dark:border-pink-600 hover:border-pink-500 dark:hover:border-pink-400 bg-pink-50/50 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20'
                        }`}
                    >
                      <div className="text-center">
                        <motion.div
                          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isSubmitting && uploadProgress !== null
                            ? 'bg-gray-200 dark:bg-gray-700'
                            : 'bg-gradient-to-br from-pink-500 to-purple-600 group-hover:from-pink-600 group-hover:to-purple-700'
                            }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-2xl">
                            {isSubmitting && uploadProgress !== null ? '⏳' : '🖼️'}
                          </span>
                        </motion.div>
                        <p className={`text-lg font-semibold mb-2 ${isSubmitting && uploadProgress !== null
                          ? 'text-gray-500 dark:text-gray-400'
                          : 'text-gray-700 dark:text-gray-300'
                          }`}>
                          {imageFile ? 'Change Image' : 'Choose an Image'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
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

                    <AnimatePresence>
                      {previewImage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center space-x-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="relative">
                            <img
                              src={previewImage}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-xl shadow-lg"
                            />
                            <div className="absolute inset-0 rounded-xl ring-2 ring-pink-500/20" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-lg">
                              {imageFile?.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              {((imageFile?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {uploadProgress !== null && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 p-6 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl border border-pink-200 dark:border-pink-800"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading image...</span>
                            <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{Math.round(uploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-sm"
                              initial={{ width: '0%' }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            Please wait while your image is being uploaded...
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>


          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 cursor-pointer select-none"
          >
            <motion.input
              type="checkbox"
              checked={formData.petFriendly}
              onChange={(e) =>
                setFormData({ ...formData, petFriendly: e.target.checked })
              }
              className="w-5 h-5 text-pink-500 border-gray-300 rounded focus:ring-pink-400"
              whileTap={{ scale: 1.2 }}
            />

            <motion.span
              initial={{ opacity: 0.6, x: -4 }}
              animate={{
                opacity: formData.petFriendly ? 1 : 0.7,
                x: formData.petFriendly ? 0 : -4,
                color: formData.petFriendly ? "#ec4899" : "#ec4899", // pink when checked
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-sm dark:text-zinc-200"
            >
              🐾 Pet Friendly
            </motion.span>

            <AnimatePresence>
              {formData.petFriendly && (
                <motion.div
                  key="paw"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: 10 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="ml-1 text-pink-500"
                >
                  <LucideDog size={22.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.label>
          <motion.div variants={itemVariants}>
            <label className={labelClass}>
              <span className="inline-flex items-center">
                <span className="mr-2">⭐</span>
                Your Rating
              </span>
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {renderRatingHearts()}
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {formData.initialRating}
                  </span>
                 
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
              Click on hearts to set your rating for this spot
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="tags" className={labelClass}>
              <span className="inline-flex items-center">
                <span className="mr-2">🏷️</span>
                Tags
              </span>
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. romantic, sunset, picnic"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Separate multiple tags with commas
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-8"
          >
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              {isSubmitting ? (
                <span className="relative flex items-center justify-center">
                  <motion.div
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Adding Your Spot...
                </span>
              ) : (
                <span className="relative flex items-center justify-center">
                  <span className="mr-3 text-xl">✨</span>
                  Add Date Spot
                </span>
              )}
            </motion.button>

            {onCancel && (
              <motion.button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-4 px-8 rounded-2xl font-semibold text-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">✕</span>
                  Cancel
                </span>
              </motion.button>
            )}
          </motion.div>
        </form>
      </div>
      {/* Global submitting overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg font-semibold">
              Adding your spot...
            </p>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default AddDateForm;