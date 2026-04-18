/**
 * Application Entry Point
 * 
 * This file initializes the React application with:
 * - React root mount to DOM
 * - StrictMode for development warnings and checks
 * - Google OAuth provider for authentication
 * - Global styles and main App component
 * 
 * Environment Variables Required:
 * - VITE_GOOGLE_CLIENT_ID: Google OAuth client ID for sign-in
 * - VITE_GITHUB_CLIENT_ID: GitHub OAuth client ID (used in AuthMF)
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

/**
 * Mount React application to DOM element with ID "root"
 * Wrapped in StrictMode for development checks and GoogleOAuthProvider for OAuth authentication
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* GoogleOAuthProvider: Enables Google Sign-In functionality throughout the app */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {/* Main application component */}
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
