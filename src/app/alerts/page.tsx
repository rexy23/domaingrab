'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Bell, BellOff, Plus, Trash2, Edit2, Check, X, Calendar, TrendingDown, RefreshCw, Mail } from 'lucide-react';
import { useCSRF } from '@/hooks/useCSRF';

interface DomainAlert {
  id: string;
  domain: string;
  type: 'availability' | 'price_drop' | 'expiry' | 'score_change';
  enabled: boolean;
  criteria?: {
    priceThreshold?: number;
    scoreThreshold?: number;
    daysBeforeExpiry?: number;
  };
  frequency: 'instant' | 'daily' | 'weekly';
  lastTriggered?: string;
  createdAt: string;
  notificationMethod: 'email' | 'dashboard' | 'both';
}

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { csrfToken } = useCSRF();
  
  const [alerts, setAlerts] = useState<DomainAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [editingAlert, setEditingAlert] = useState<string | null>(null);
  
  // New alert form state
  const [newAlert, setNewAlert] = useState({
    domain: '',
    type: 'availability' as const,
    frequency: 'instant' as const,
    notificationMethod: 'email' as const,
    priceThreshold: '',
    scoreThreshold: '',
    daysBeforeExpiry: '30',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadAlerts();
  }, [session, status, router]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      // Mock data for now
      const mockAlerts: DomainAlert[] = [
        {
          id: '1',
          domain: 'technovate.io',
          type: 'availability',
          enabled: true,
          frequency: 'instant',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          notificationMethod: 'email',
        },
        {
          id: '2',
          domain: 'cloudspace.com',
          type: 'price_drop',
          enabled: true,
          criteria: { priceThreshold: 100 },
          frequency: 'daily',
          lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          notificationMethod: 'both',
        },
        {
          id: '3',
          domain: 'dataforge.ai',
          type: 'expiry',
          enabled: true,
          criteria: { daysBeforeExpiry: 30 },
          frequency: 'weekly',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          notificationMethod: 'email',
        },
        {
          id: '4',
          domain: 'innovatehub.net',
          type: 'score_change',
          enabled: false,
          criteria: { scoreThreshold: 80 },
          frequency: 'daily',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          notificationMethod: 'dashboard',
        },
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async () => {
    try {
      const alert: DomainAlert = {
        id: Date.now().toString(),
        domain: newAlert.domain,
        type: newAlert.type,
        enabled: true,
        frequency: newAlert.frequency,
        notificationMethod: newAlert.notificationMethod,
        createdAt: new Date().toISOString(),
        criteria: {},
      };

      // Add type-specific criteria
      if (newAlert.type === 'price_drop' && newAlert.priceThreshold) {
        alert.criteria!.priceThreshold = parseFloat(newAlert.priceThreshold);
      } else if (newAlert.type === 'score_change' && newAlert.scoreThreshold) {
        alert.criteria!.scoreThreshold = parseFloat(newAlert.scoreThreshold);
      } else if (newAlert.type === 'expiry' && newAlert.daysBeforeExpiry) {
        alert.criteria!.daysBeforeExpiry = parseInt(newAlert.daysBeforeExpiry);
      }

      setAlerts([...alerts, alert]);
      setShowNewAlert(false);
      setNewAlert({
        domain: '',
        type: 'availability',
        frequency: 'instant',
        notificationMethod: 'email',
        priceThreshold: '',
        scoreThreshold: '',
        daysBeforeExpiry: '30',
      });
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const toggleAlert = async (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
    ));
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type: DomainAlert['type']) => {
    switch (type) {
      case 'availability':
        return <Bell className="h-5 w-5" />;
      case 'price_drop':
        return <TrendingDown className="h-5 w-5" />;
      case 'expiry':
        return <Calendar className="h-5 w-5" />;
      case 'score_change':
        return <RefreshCw className="h-5 w-5" />;
    }
  };

  const getAlertDescription = (alert: DomainAlert) => {
    switch (alert.type) {
      case 'availability':
        return 'Notify when this domain becomes available';
      case 'price_drop':
        return `Notify when price drops below $${alert.criteria?.priceThreshold || 0}`;
      case 'expiry':
        return `Notify ${alert.criteria?.daysBeforeExpiry || 30} days before expiry`;
      case 'score_change':
        return `Notify when score changes by ${alert.criteria?.scoreThreshold || 0} points`;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your alerts...</p>
        </div>
      </div>
    );
  }

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">Domain Alerts</h1>
            <p className="text-gray-600">Get notified about domain availability and changes</p>
          </div>
          <button
            onClick={() => setShowNewAlert(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Alert
          </button>
        </div>

        {/* New Alert Form */}
        {showNewAlert && (
          <div className="card-luxury mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Alert</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={newAlert.domain}
                  onChange={(e) => setNewAlert({ ...newAlert, domain: e.target.value })}
                  placeholder="example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                <select
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="availability">Domain Becomes Available</option>
                  <option value="price_drop">Price Drop</option>
                  <option value="expiry">Domain Expiry</option>
                  <option value="score_change">Score Change</option>
                </select>
              </div>
              
              {newAlert.type === 'price_drop' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Threshold ($)</label>
                  <input
                    type="number"
                    value={newAlert.priceThreshold}
                    onChange={(e) => setNewAlert({ ...newAlert, priceThreshold: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {newAlert.type === 'score_change' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score Change Threshold</label>
                  <input
                    type="number"
                    value={newAlert.scoreThreshold}
                    onChange={(e) => setNewAlert({ ...newAlert, scoreThreshold: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {newAlert.type === 'expiry' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Before Expiry</label>
                  <input
                    type="number"
                    value={newAlert.daysBeforeExpiry}
                    onChange={(e) => setNewAlert({ ...newAlert, daysBeforeExpiry: e.target.value })}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={newAlert.frequency}
                  onChange={(e) => setNewAlert({ ...newAlert, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Summary</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Method</label>
                <select
                  value={newAlert.notificationMethod}
                  onChange={(e) => setNewAlert({ ...newAlert, notificationMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email Only</option>
                  <option value="dashboard">Dashboard Only</option>
                  <option value="both">Email & Dashboard</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={createAlert}
                disabled={!newAlert.domain}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                Create Alert
              </button>
              <button
                onClick={() => setShowNewAlert(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Alerts List */}
        {alerts.length > 0 ? (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="card-luxury hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      alert.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.domain}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          alert.enabled 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {alert.enabled ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {getAlertDescription(alert)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {alert.frequency === 'instant' ? 'Instant notifications' : 
                           alert.frequency === 'daily' ? 'Daily digest' : 'Weekly summary'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {alert.notificationMethod === 'email' ? 'Email' :
                           alert.notificationMethod === 'dashboard' ? 'Dashboard' : 'Email & Dashboard'}
                        </span>
                        {alert.lastTriggered && (
                          <span>
                            Last triggered: {new Date(alert.lastTriggered).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        alert.enabled 
                          ? 'text-blue-600 hover:bg-blue-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={alert.enabled ? 'Disable alert' : 'Enable alert'}
                    >
                      {alert.enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-luxury text-center py-12">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No alerts yet</h3>
            <p className="text-gray-600 mb-4">
              Set up alerts to get notified when domains become available or prices change.
            </p>
            <button
              onClick={() => setShowNewAlert(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Your First Alert
            </button>
          </div>
        )}
      </main>
    </div>
  );
}