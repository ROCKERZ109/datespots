import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

const AuthButton: React.FC = () => {
  const [user, loading] = useAuthState(auth);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
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
        <span className="text-sm text-gray-600">Loading...</span>
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
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700 font-medium hidden md:block">{user.displayName}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleGoogleSignIn}
          className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.81 0-5.26-1.87-6.1-4.42H2.89v2.89C4.55 20.57 8.04 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.89 14.29c-.19-.57-.29-1.18-.29-1.81s.1-1.24.29-1.81V8.42H2.89c-.66 1.3-.99 2.76-.99 4.29s.33 2.99.99 4.29h3z"
              fill="#FBBC05"
            />
            <path
              d="M12 4.75c1.92 0 3.63.68 4.97 1.99l3.12-3.12C17.43 2.37 14.88 1 12 1s-5.43 1.37-7.28 3.66l3.58 2.8C6.74 5.43 9.07 4.75 12 4.75z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>
      )}
    </div>
  );
};

export default AuthButton;