// components/AddDateForm.tsx
import React, { useState, useCallback } from 'react';
import { DateSpot } from '../types';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import OpenAI from 'openai';

interface AddDateFormProps {
  onAdd: (spot: Omit<DateSpot, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
  allSpots: DateSpot[]; // New prop for duplicate check
}

// Initialize OpenAI client with your API key
// NOTE: For a production app, you should NOT expose your API key on the frontend.
// This is for demonstration purposes. A backend server is the secure way to do this.
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // Ensure this env variable is set
  dangerouslyAllowBrowser: true, // This allows client-side use, but is not recommended for production.
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
  { value: 'entertainment', label: '🎪 Entertainment' }
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
};

const AddDateForm: React.FC<AddDateFormProps> = ({ onAdd, onCancel, allSpots }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useUrl, setUseUrl] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
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
      
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setUploadProgress(null);
          console.error('Error uploading image:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadProgress(null);
            resolve(downloadURL);
          } catch (error) {
            setUploadProgress(null);
            reject(error);
          }
        }
      );
    });
  };

  const getSentimentScore = async (text: string): Promise<number | null> => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a sentiment analysis bot. Analyze the sentiment of the following text and respond with a single number from -1 (very negative) to 1 (very positive). Do not include any other text." },
          { role: "user", content: text },
        ],
        max_tokens: 5,
      });

      const scoreText = response.choices[0].message.content;
      const score = parseFloat(scoreText || '');
      
      if (isNaN(score) || score < -1 || score > 1) {
        console.error('Invalid sentiment score received:', scoreText);
        return null;
      }

      return score;
    } catch (err) {
      console.error('Error fetching sentiment score from OpenAI:', err);
      return null;
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // === 1. Local Duplicate Check ===
      const isDuplicate = allSpots.some(spot => 
        spot.name.toLowerCase() === formData.name.toLowerCase() && 
        spot.location.toLowerCase() === formData.location.toLowerCase()
      );

      if (isDuplicate) {
        throw new Error('A date spot with this name and location already exists. Please check your spelling or add a new one.');
      }

      // === 2. Sentiment Analysis with OpenAI ===
      const sentimentScore = await getSentimentScore(formData.description);
      const SENTIMENT_THRESHOLD = 0; // Customize this threshold as needed
      
      if (sentimentScore === null || sentimentScore <= SENTIMENT_THRESHOLD) {
        throw new Error('The description of this date spot seems unenthusiastic. Please write a more positive review!');
      }

      let imageUrl = formData.imageUrl;
      if (!useUrl && imageFile) {
        imageUrl = await uploadImageAndGetUrl();
      }
      
      const tagArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const newSpot = {
        ...formData,
        priceLevel: parseInt(formData.priceLevel.toString()) as 1 | 2 | 3 | 4,
        tags: tagArray.length > 0 ? tagArray : ['date spot'],
        rating: formData.initialRating,
        totalVotes: 1,
        upvotes: 0,
        downvotes: 0,
        imageUrl: imageUrl || '',
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
      if (err instanceof Error) {
        setError(err.message || 'Failed to add date spot. Please try again.');
      } else {
        setError('Failed to add date spot. Please try again.');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, imageFile, useUrl, onAdd, allSpots]);

  const renderRatingHearts = () => {
    const displayRating = hoverRating !== null ? hoverRating : formData.initialRating;
    
    return (
      <motion.div layout className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <motion.button
            key={value}
            type="button"
            onClick={() => handleRatingClick(value)}
            onMouseEnter={() => handleRatingHover(value)}
            onMouseLeave={() => handleRatingHover(null)}
            className="relative group focus:outline-none"
            aria-label={`Rate ${value} hearts`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <motion.span
              className="text-3xl cursor-pointer transition-all duration-200 relative z-10"
              animate={{
                color: value <= displayRating ? '#ec4899' : '#d1d5db',
                textShadow: value <= displayRating ? '0 0 20px rgba(236, 72, 153, 0.3)' : 'none',
                filter: value <= displayRating ? 'brightness(1.1)' : 'brightness(0.3)'
              }}
              transition={{ duration: 0.15 }}
            >
              💖
            </motion.span>
            <motion.div
              className="absolute inset-0 rounded-full bg-pink-100 dark:bg-pink-900/20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: value <= displayRating ? 1.2 : 0,
                opacity: value <= displayRating ? 0.3 : 0
              }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        ))}
      </motion.div>
    );
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const inputClass = "w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm hover:shadow-md placeholder-gray-400 dark:placeholder-gray-500 backdrop-blur-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 tracking-wide";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-purple-50/20 to-indigo-50/30 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-indigo-900/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ec4899 fill-opacity=0.03%3E%3Cpath d=m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30 dark:opacity-10 pointer-events-none" />
      
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6 p-5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl text-sm border border-red-200 dark:border-red-800/50 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center">
                <span className="text-red-500 mr-3 text-lg">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6 p-5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-2xl text-sm border border-green-200 dark:border-green-800/50 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center">
                <span className="text-green-500 mr-3 text-lg">🎉</span>
                <span className="font-medium">Date spot added successfully!</span>
              </div>
            </motion.div>
          )}
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
                placeholder="e.g. Slottsskogen Park"
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
                    <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                      useUrl 
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
                    <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                      !useUrl 
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
                      className={`group relative flex flex-col items-center justify-center w-full py-8 px-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                        isSubmitting && uploadProgress !== null
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
                          : 'border-pink-300 dark:border-pink-600 hover:border-pink-500 dark:hover:border-pink-400 bg-pink-50/50 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20'
                      }`}
                    >
                      <div className="text-center">
                        <motion.div 
                          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                            isSubmitting && uploadProgress !== null
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
                        <p className={`text-lg font-semibold mb-2 ${
                          isSubmitting && uploadProgress !== null
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
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Heart{formData.initialRating !== 1 ? 's' : ''}
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
    </motion.div>
  );
};

export default AddDateForm;