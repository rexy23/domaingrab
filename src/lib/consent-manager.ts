import { ConsentPreferences } from '@/components/CookieConsentBanner';

export interface ConsentRecord {
  preferences: ConsentPreferences;
  timestamp: string;
  version: string;
  userAgent?: string;
  ipAddress?: string; // Only store if legally required and properly anonymized
}

export class ConsentManager {
  private static readonly STORAGE_KEY = 'cookie-consent';
  private static readonly CONSENT_VERSION = '1.0';

  /**
   * Get current consent preferences
   */
  static getConsent(): ConsentRecord | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading consent data:', error);
      return null;
    }
  }

  /**
   * Save consent preferences
   */
  static saveConsent(preferences: ConsentPreferences): void {
    if (typeof window === 'undefined') return;

    const consentRecord: ConsentRecord = {
      preferences,
      timestamp: new Date().toISOString(),
      version: this.CONSENT_VERSION,
      userAgent: navigator.userAgent,
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(consentRecord));
      
      // Dispatch custom event for other parts of the app to listen to
      window.dispatchEvent(new CustomEvent('consentChanged', { 
        detail: consentRecord 
      }));
      
      // Apply consent immediately
      this.applyConsent(preferences);
    } catch (error) {
      console.error('Error saving consent data:', error);
    }
  }

  /**
   * Check if user has given consent
   */
  static hasConsent(): boolean {
    return this.getConsent() !== null;
  }

  /**
   * Check if specific cookie category is allowed
   */
  static isAllowed(category: keyof ConsentPreferences): boolean {
    const consent = this.getConsent();
    return consent?.preferences[category] || false;
  }

  /**
   * Withdraw consent (for user data deletion requests)
   */
  static withdrawConsent(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.STORAGE_KEY);
    
    // Clear all non-necessary cookies
    this.clearCookies();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('consentWithdrawn'));
  }

  /**
   * Apply consent settings to third-party services
   */
  private static applyConsent(preferences: ConsentPreferences): void {
    // Google Analytics
    if (preferences.analytics && typeof window !== 'undefined') {
      // Enable GA if not already loaded
      this.enableGoogleAnalytics();
    } else {
      this.disableGoogleAnalytics();
    }

    // Marketing pixels (Facebook, LinkedIn, etc.)
    if (preferences.marketing) {
      this.enableMarketingPixels();
    } else {
      this.disableMarketingPixels();
    }

    // Preference cookies (theme, language, etc.)
    if (!preferences.preferences) {
      this.clearPreferenceCookies();
    }
  }

  /**
   * Enable Google Analytics
   */
  private static enableGoogleAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Only enable if GA ID is configured
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
    if (!GA_ID) return;

    // Load gtag if not already loaded
    if (!(window as Window & { gtag?: unknown }).gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}', {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        });
      `;
      document.head.appendChild(script2);
    }
  }

  /**
   * Disable Google Analytics
   */
  private static disableGoogleAnalytics(): void {
    if (typeof window !== 'undefined' && (window as Window & { gtag?: unknown }).gtag) {
      // Disable GA
      (window as unknown as Record<string, unknown>)['ga-disable-' + process.env.NEXT_PUBLIC_GA_ID] = true;
    }
  }

  /**
   * Enable marketing pixels
   */
  private static enableMarketingPixels(): void {
    // Facebook Pixel, LinkedIn Insight Tag, etc.
    // Only load if IDs are configured
    const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    if (FB_PIXEL_ID && typeof window !== 'undefined') {
      // Load Facebook Pixel
      if (!(window as Window & { fbq?: unknown }).fbq) {
        const script = document.createElement('script');
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }
    }
  }

  /**
   * Disable marketing pixels
   */
  private static disableMarketingPixels(): void {
    // Clear marketing cookies
    this.clearMarketingCookies();
  }

  /**
   * Clear all cookies except necessary ones
   */
  private static clearCookies(): void {
    if (typeof document === 'undefined') return;

    const cookies = document.cookie.split(';');
    const necessaryCookies = ['necessary-session', 'csrf-token', 'auth-token'];

    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Don't clear necessary cookies
      if (!necessaryCookies.includes(name)) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  }

  /**
   * Clear marketing-specific cookies
   */
  private static clearMarketingCookies(): void {
    if (typeof document === 'undefined') return;

    const marketingCookies = ['_fbp', '_fbc', '_ga', '_gid', '_gat', 'fr', '__utma', '__utmb', '__utmc', '__utmz'];
    
    marketingCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  }

  /**
   * Clear preference cookies
   */
  private static clearPreferenceCookies(): void {
    if (typeof document === 'undefined') return;

    const preferenceCookies = ['theme', 'language', 'currency', 'timezone'];
    
    preferenceCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  }

  /**
   * Get consent log for compliance reporting
   */
  static getConsentLog(): ConsentRecord[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const log = localStorage.getItem('consent-log');
      return log ? JSON.parse(log) : [];
    } catch (error) {
      console.error('Error reading consent log:', error);
      return [];
    }
  }

  /**
   * Log consent change for compliance
   */
  static logConsentChange(preferences: ConsentPreferences, action: 'accept' | 'reject' | 'customize'): void {
    if (typeof window === 'undefined') return;

    const logEntry: ConsentRecord & { action: string } = {
      preferences,
      timestamp: new Date().toISOString(),
      version: this.CONSENT_VERSION,
      userAgent: navigator.userAgent,
      action
    };

    try {
      const currentLog = this.getConsentLog();
      const updatedLog = [...currentLog, logEntry].slice(-50); // Keep last 50 entries
      
      localStorage.setItem('consent-log', JSON.stringify(updatedLog));
    } catch (error) {
      console.error('Error logging consent change:', error);
    }
  }
}