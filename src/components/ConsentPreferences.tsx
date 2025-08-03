'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, BarChart3, Target, Users, Save, RefreshCw } from 'lucide-react';
import { ConsentManager } from '@/lib/consent-manager';
import { ConsentPreferences } from './CookieConsentBanner';

interface ConsentPreferencesComponentProps {
  onSave?: (preferences: ConsentPreferences) => void;
}

export default function ConsentPreferencesComponent({ onSave }: ConsentPreferencesComponentProps) {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current preferences
    const currentConsent = ConsentManager.getConsent();
    if (currentConsent) {
      setPreferences(currentConsent.preferences);
    }
  }, []);

  const handlePreferenceChange = (category: keyof ConsentPreferences, value: boolean) => {
    if (category === 'necessary') return; // Can't disable necessary cookies
    
    setPreferences(prev => {
      const newPreferences = { ...prev, [category]: value };
      setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(ConsentManager.getConsent()?.preferences || {}));
      return newPreferences;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      ConsentManager.saveConsent(preferences);
      ConsentManager.logConsentChange(preferences, 'customize');
      onSave?.(preferences);
      setHasChanges(false);
      
      // Show success message or handle success
      setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const currentConsent = ConsentManager.getConsent();
    if (currentConsent) {
      setPreferences(currentConsent.preferences);
      setHasChanges(false);
    }
  };

  const categories = [
    {
      key: 'necessary' as keyof ConsentPreferences,
      title: 'Necessary Cookies',
      description: 'Essential for website functionality, security, and compliance. These cookies cannot be disabled as they are required for the basic operation of our service.',
      icon: Shield,
      required: true,
      examples: ['Session management', 'Security tokens', 'Load balancing', 'Error logging'],
      color: 'green'
    },
    {
      key: 'analytics' as keyof ConsentPreferences,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      icon: BarChart3,
      required: false,
      examples: ['Google Analytics', 'Page views', 'User behavior', 'Performance metrics'],
      color: 'blue'
    },
    {
      key: 'marketing' as keyof ConsentPreferences,
      title: 'Marketing Cookies',
      description: 'Used to deliver personalized advertisements and track the effectiveness of our marketing campaigns.',
      icon: Target,
      required: false,
      examples: ['Facebook Pixel', 'LinkedIn Insights', 'Retargeting', 'Campaign tracking'],
      color: 'purple'
    },
    {
      key: 'preferences' as keyof ConsentPreferences,
      title: 'Preference Cookies',
      description: 'Remember your settings and preferences to provide you with a personalized experience.',
      icon: Users,
      required: false,
      examples: ['Theme selection', 'Language preference', 'Currency settings', 'Dashboard layout'],
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border') => {
    const colorMap = {
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' }
    };
    return colorMap[color as keyof typeof colorMap]?.[type] || '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Cookie Preferences</h1>
          </div>
          <p className="text-gray-600">
            Manage your cookie preferences and control how we use your data. 
            Changes will take effect immediately and be saved to your browser.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {categories.map((category) => (
              <div 
                key={category.key}
                className={`p-6 rounded-lg border-2 ${getColorClasses(category.color, 'bg')} ${getColorClasses(category.color, 'border')}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <category.icon className={`h-6 w-6 ${getColorClasses(category.color, 'text')}`} />
                      <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                      {category.required && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {category.description}
                    </p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Examples:</h4>
                      <div className="flex flex-wrap gap-2">
                        {category.examples.map((example, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[category.key]}
                        onChange={(e) => handlePreferenceChange(category.key, e.target.checked)}
                        disabled={category.required}
                        className="sr-only peer"
                      />
                      <div className={`
                        relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                        peer-focus:ring-blue-300 rounded-full peer 
                        peer-checked:after:translate-x-full peer-checked:after:border-white 
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                        after:bg-white after:border-gray-300 after:border after:rounded-full 
                        after:h-5 after:w-5 after:transition-all
                        ${category.required 
                          ? 'peer-checked:bg-green-600 opacity-75 cursor-not-allowed' 
                          : 'peer-checked:bg-blue-600 cursor-pointer'
                        }
                      `}></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              {hasChanges ? (
                <span className="text-orange-600 font-medium">You have unsaved changes</span>
              ) : (
                <span>All changes are saved automatically</span>
              )}
            </div>
            
            <div className="flex gap-3">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>
              )}
              
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors
                  ${hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                  ${isSaving ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Important Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Changes take effect immediately and are stored in your browser</li>
              <li>• Clearing your browser data will reset these preferences</li>
              <li>• You can update these settings at any time</li>
              <li>• For questions about data processing, see our <a href="/privacy-policy" className="underline hover:no-underline">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}