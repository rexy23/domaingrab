'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, User, Mail, Key, CreditCard, Bell, Shield, Save, Check, AlertCircle, Loader } from 'lucide-react';
import { useCSRF } from '@/hooks/useCSRF';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/stripe-client';

interface UserSettings {
  name: string;
  email: string;
  notifications: {
    emailAlerts: boolean;
    marketingEmails: boolean;
    weeklyDigest: boolean;
  };
  preferences: {
    defaultTLD: string;
    searchHistory: boolean;
    autoRefresh: boolean;
  };
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { csrfToken } = useCSRF();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    notifications: {
      emailAlerts: true,
      marketingEmails: false,
      weeklyDigest: true,
    },
    preferences: {
      defaultTLD: '.com',
      searchHistory: true,
      autoRefresh: true,
    },
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'notifications' | 'preferences' | 'security'>('profile');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    // Load user settings
    setSettings({
      ...settings,
      name: session.user?.name || '',
      email: session.user?.email || '',
    });
  }, [session, status, router]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveSuccess(true);
        // Update session if name changed
        if (settings.name !== session?.user?.name) {
          await update({ name: settings.name });
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageSubscription = () => {
    // This would typically open Stripe customer portal
    window.open('https://billing.stripe.com/p/login/test_28o8Ayffn0Ydepq144', '_blank');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const planDetails = PLANS[currentPlan as keyof typeof PLANS] || PLANS.free;

  return (
    <div className="min-h-screen bg-gradient-luxury">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-light text-gray-900">DomainGrab</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/search" className="text-gray-600 hover:text-blue-600 transition-colors">
                Search
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/domains" className="text-gray-600 hover:text-blue-600 transition-colors">
                My Domains
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile, subscription, and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User className="h-5 w-5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'billing' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Billing & Plan
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'notifications' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Bell className="h-5 w-5" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'preferences' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Shield className="h-5 w-5" />
                Preferences
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'security' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Key className="h-5 w-5" />
                Security
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card-luxury">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={settings.email}
                          disabled
                          className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing & Subscription</h2>
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {planDetails.name} Plan
                        </h3>
                        <p className="text-gray-600">
                          {currentPlan === 'free' 
                            ? 'Basic features with limited searches'
                            : `€${planDetails.price}/month`}
                        </p>
                      </div>
                      {subscription?.status && (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {subscription.status}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      {planDetails.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      {currentPlan === 'free' ? (
                        <Link
                          href="/pricing"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Upgrade Plan
                        </Link>
                      ) : (
                        <>
                          <button
                            onClick={handleManageSubscription}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Manage Subscription
                          </button>
                          <Link
                            href="/pricing"
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                          >
                            Change Plan
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {subscription?.nextBillingDate && (
                    <div className="text-sm text-gray-600">
                      <AlertCircle className="inline h-4 w-4 mr-1" />
                      Next billing date: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Email Notifications</h2>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-gray-900">Domain Alerts</div>
                        <div className="text-sm text-gray-600">Get notified about domain availability and changes</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailAlerts: e.target.checked }
                        })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-gray-900">Weekly Digest</div>
                        <div className="text-sm text-gray-600">Summary of your domain portfolio and market trends</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.weeklyDigest}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, weeklyDigest: e.target.checked }
                        })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-gray-900">Marketing Emails</div>
                        <div className="text-sm text-gray-600">Product updates and special offers</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.marketingEmails}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, marketingEmails: e.target.checked }
                        })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Search Preferences</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default TLD</label>
                      <select
                        value={settings.preferences.defaultTLD}
                        onChange={(e) => setSettings({
                          ...settings,
                          preferences: { ...settings.preferences, defaultTLD: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <optgroup label="European Union - General">
                          <option value=".eu">🇪🇺 .eu - European Union</option>
                          <option value=".de">🇩🇪 .de - Germany</option>
                          <option value=".fr">🇫🇷 .fr - France</option>
                          <option value=".it">🇮🇹 .it - Italy</option>
                          <option value=".es">🇪🇸 .es - Spain</option>
                          <option value=".nl">🇳🇱 .nl - Netherlands</option>
                          <option value=".be">🇧🇪 .be - Belgium</option>
                          <option value=".at">🇦🇹 .at - Austria</option>
                          <option value=".pl">🇵🇱 .pl - Poland</option>
                          <option value=".pt">🇵🇹 .pt - Portugal</option>
                          <option value=".gr">🇬🇷 .gr - Greece</option>
                          <option value=".se">🇸🇪 .se - Sweden</option>
                          <option value=".dk">🇩🇰 .dk - Denmark</option>
                          <option value=".fi">🇫🇮 .fi - Finland</option>
                          <option value=".cz">🇨🇿 .cz - Czech Republic</option>
                          <option value=".hu">🇭🇺 .hu - Hungary</option>
                          <option value=".ro">🇷🇴 .ro - Romania</option>
                          <option value=".bg">🇧🇬 .bg - Bulgaria</option>
                          <option value=".hr">🇭🇷 .hr - Croatia</option>
                          <option value=".sk">🇸🇰 .sk - Slovakia</option>
                          <option value=".si">🇸🇮 .si - Slovenia</option>
                          <option value=".lt">🇱🇹 .lt - Lithuania</option>
                          <option value=".lv">🇱🇻 .lv - Latvia</option>
                          <option value=".ee">🇪🇪 .ee - Estonia</option>
                          <option value=".lu">🇱🇺 .lu - Luxembourg</option>
                          <option value=".mt">🇲🇹 .mt - Malta</option>
                          <option value=".cy">🇨🇾 .cy - Cyprus</option>
                          <option value=".ie">🇮🇪 .ie - Ireland</option>
                        </optgroup>
                        <optgroup label="EU Government Domains">
                          <option value=".europa.eu">🇪🇺 .europa.eu - EU Institutions</option>
                          <option value=".bund.de">🇩🇪 .bund.de - German Federal Gov</option>
                          <option value=".gouv.fr">🇫🇷 .gouv.fr - French Government</option>
                          <option value=".gov.it">🇮🇹 .gov.it - Italian Government</option>
                          <option value=".gob.es">🇪🇸 .gob.es - Spanish Government</option>
                          <option value=".overheid.nl">🇳🇱 .overheid.nl - Dutch Government</option>
                          <option value=".belgium.be">🇧🇪 .belgium.be - Belgian Federal</option>
                          <option value=".gv.at">🇦🇹 .gv.at - Austrian Government</option>
                          <option value=".gov.pl">🇵🇱 .gov.pl - Polish Government</option>
                          <option value=".gov.pt">🇵🇹 .gov.pt - Portuguese Government</option>
                          <option value=".gov.gr">🇬🇷 .gov.gr - Greek Government</option>
                          <option value=".regeringen.se">🇸🇪 .regeringen.se - Swedish Gov</option>
                          <option value=".dk">🇩🇰 .dk - Danish Government</option>
                          <option value=".valtioneuvosto.fi">🇫🇮 .valtioneuvosto.fi - Finnish Gov</option>
                          <option value=".vlada.cz">🇨🇿 .vlada.cz - Czech Government</option>
                          <option value=".kormany.hu">🇭🇺 .kormany.hu - Hungarian Gov</option>
                          <option value=".gov.ro">🇷🇴 .gov.ro - Romanian Government</option>
                          <option value=".government.bg">🇧🇬 .government.bg - Bulgarian Gov</option>
                          <option value=".gov.hr">🇭🇷 .gov.hr - Croatian Government</option>
                          <option value=".gov.sk">🇸🇰 .gov.sk - Slovak Government</option>
                          <option value=".gov.si">🇸🇮 .gov.si - Slovenian Government</option>
                          <option value=".lrv.lt">🇱🇹 .lrv.lt - Lithuanian Government</option>
                          <option value=".gov.lv">🇱🇻 .gov.lv - Latvian Government</option>
                          <option value=".valitsus.ee">🇪🇪 .valitsus.ee - Estonian Gov</option>
                          <option value=".public.lu">🇱🇺 .public.lu - Luxembourg Gov</option>
                          <option value=".gov.mt">🇲🇹 .gov.mt - Maltese Government</option>
                          <option value=".gov.cy">🇨🇾 .gov.cy - Cyprus Government</option>
                          <option value=".gov.ie">🇮🇪 .gov.ie - Irish Government</option>
                        </optgroup>
                        <optgroup label="United Kingdom">
                          <option value=".uk">🇬🇧 .uk - United Kingdom</option>
                          <option value=".co.uk">🇬🇧 .co.uk - UK Commercial</option>
                          <option value=".org.uk">🇬🇧 .org.uk - UK Organization</option>
                          <option value=".gov.uk">🇬🇧 .gov.uk - UK Government</option>
                          <option value=".ac.uk">🇬🇧 .ac.uk - UK Academic</option>
                          <option value=".nhs.uk">🇬🇧 .nhs.uk - UK Health Service</option>
                          <option value=".police.uk">🇬🇧 .police.uk - UK Police</option>
                          <option value=".mod.uk">🇬🇧 .mod.uk - UK Defence</option>
                        </optgroup>
                        <optgroup label="Other Popular">
                          <option value=".com">.com - Commercial</option>
                          <option value=".net">.net - Network</option>
                          <option value=".org">.org - Organization</option>
                          <option value=".io">.io - Tech/Startup</option>
                          <option value=".ai">.ai - AI/Tech</option>
                          <option value=".app">.app - Applications</option>
                        </optgroup>
                      </select>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-gray-900">Save Search History</div>
                        <div className="text-sm text-gray-600">Keep track of your previous searches</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.preferences.searchHistory}
                        onChange={(e) => setSettings({
                          ...settings,
                          preferences: { ...settings.preferences, searchHistory: e.target.checked }
                        })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-gray-900">Auto-refresh Domains</div>
                        <div className="text-sm text-gray-600">Automatically check domain status every hour</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.preferences.autoRefresh}
                        onChange={(e) => setSettings({
                          ...settings,
                          preferences: { ...settings.preferences, autoRefresh: e.target.checked }
                        })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Password</h3>
                      <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors">
                        Change Password
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Add an extra layer of security to your account
                      </p>
                      <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">API Keys</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Manage API keys for programmatic access
                      </p>
                      <Link
                        href="/settings/api-keys"
                        className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                      >
                        Manage API Keys
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {activeTab !== 'billing' && activeTab !== 'security' && (
                <div className="mt-6 flex items-center justify-between border-t pt-6">
                  <div>
                    {saveSuccess && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-5 w-5" />
                        Settings saved successfully
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}