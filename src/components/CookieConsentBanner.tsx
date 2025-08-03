'use client';

import { useState, useEffect } from 'react';
import { Cookie, Settings, Shield, X } from 'lucide-react';

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentBannerProps {
  onConsentChange: (preferences: ConsentPreferences) => void;
}

export default function CookieConsentBanner({ onConsentChange }: CookieConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem('cookie-consent');
    if (!savedConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPreferences = JSON.parse(savedConsent);
      setPreferences(savedPreferences);
      onConsentChange(savedPreferences);
    }
  }, [onConsentChange]);

  const saveConsent = (newPreferences: ConsentPreferences) => {
    const consentData = {
      ...newPreferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    setShowBanner(false);
    onConsentChange(newPreferences);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handlePreferenceChange = (category: keyof ConsentPreferences, value: boolean) => {
    if (category === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({ ...prev, [category]: value }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
      
      {/* Banner */}
      <div className="relative bg-white border-t border-gray-200 shadow-2xl w-full max-w-6xl mx-4 mb-4 rounded-lg pointer-events-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Cookie className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
                <p className="text-sm text-gray-600">We value your privacy</p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              We use a GDPR-compliant cookie management system that ensures non-essential cookies are <strong>only set after your explicit consent</strong>. 
              No tracking cookies or analytics scripts will be loaded until you provide your consent. You can withdraw or change your 
              cookie preferences at any time through our Cookie Settings.
            </p>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">🔒 Your Consent Rights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Explicit consent:</strong> No pre-selected options - you choose what to accept</li>
                <li>• <strong>Granular control:</strong> Accept or reject specific cookie categories</li>
                <li>• <strong>Easy withdrawal:</strong> Change your mind anytime via Cookie Settings</li>
                <li>• <strong>No tracking before consent:</strong> We respect your choice from the start</li>
              </ul>
            </div>
            
            {showDetails && (
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  {/* Necessary Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        <h4 className="font-medium text-gray-900">Necessary Cookies</h4>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Required</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Essential for website functionality, security, and compliance. Cannot be disabled.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">Analytics Cookies</h4>
                      <p className="text-sm text-gray-600">
                        Help us understand how visitors interact with our website to improve user experience.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">Marketing Cookies</h4>
                      <p className="text-sm text-gray-600">
                        Used to deliver personalized advertisements and track campaign effectiveness.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Preference Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">Preference Cookies</h4>
                      <p className="text-sm text-gray-600">
                        Remember your settings and preferences for a better user experience.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.preferences}
                        onChange={(e) => handlePreferenceChange('preferences', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Settings className="h-4 w-4" />
                {showDetails ? 'Hide Details' : 'Customize'}
              </button>
              <a
                href="/privacy-policy"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="/cookie-preferences"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Cookie Settings
              </a>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRejectAll}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                Reject All
              </button>
              {showDetails ? (
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Save Preferences
                </button>
              ) : (
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Accept All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}