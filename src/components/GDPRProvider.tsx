'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import CookieConsentBanner, { ConsentPreferences } from './CookieConsentBanner';
import { ConsentManager } from '@/lib/consent-manager';

interface GDPRProviderProps {
  children: ReactNode;
}

export default function GDPRProvider({ children }: GDPRProviderProps) {
  const [_consentPreferences, setConsentPreferences] = useState<ConsentPreferences | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadGoogleAnalytics = useCallback(() => {
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
    if (!GA_ID || (window as Window & { gtag?: unknown }).gtag) return;

    // Load Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_flags: 'SameSite=None;Secure'
      });
    `;
    document.head.appendChild(script2);
  }, []);

  const loadMarketingScripts = useCallback(() => {
    // Facebook Pixel
    const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    if (FB_PIXEL_ID && !(window as Window & { fbq?: unknown }).fbq) {
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

      // Add noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1" />`;
      document.body.appendChild(noscript);
    }

    // LinkedIn Insight Tag
    const LINKEDIN_ID = process.env.NEXT_PUBLIC_LINKEDIN_ID;
    if (LINKEDIN_ID && !(window as Window & { _linkedin_partner_id?: unknown })._linkedin_partner_id) {
      const script = document.createElement('script');
      script.innerHTML = `
        _linkedin_partner_id = "${LINKEDIN_ID}";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        (function(l) {
          if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
          window.lintrk.q=[]}
          var s = document.getElementsByTagName("script")[0];
          var b = document.createElement("script");
          b.type = "text/javascript";b.async = true;
          b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
          s.parentNode.insertBefore(b, s);})(window.lintrk);
      `;
      document.head.appendChild(script);

      // Add noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=${LINKEDIN_ID}&fmt=gif" />`;
      document.body.appendChild(noscript);
    }
  }, []);

  const loadScripts = useCallback((preferences: ConsentPreferences) => {
    // Load Google Analytics if analytics consent is given
    if (preferences.analytics && typeof window !== 'undefined') {
      loadGoogleAnalytics();
    }

    // Load marketing scripts if marketing consent is given
    if (preferences.marketing && typeof window !== 'undefined') {
      loadMarketingScripts();
    }
  }, [loadGoogleAnalytics, loadMarketingScripts]);

  useEffect(() => {
    // Load existing consent preferences
    const existingConsent = ConsentManager.getConsent();
    if (existingConsent) {
      setConsentPreferences(existingConsent.preferences);
      // Apply existing consent
      loadScripts(existingConsent.preferences);
    }
    setIsLoaded(true);
  }, [loadScripts]);

  const handleConsentChange = useCallback((preferences: ConsentPreferences) => {
    setConsentPreferences(preferences);
    ConsentManager.saveConsent(preferences);
    loadScripts(preferences);
  }, [loadScripts]);

  // Don't render until we've checked for existing consent
  if (!isLoaded) {
    return <div>{children}</div>;
  }

  return (
    <>
      {children}
      <CookieConsentBanner onConsentChange={handleConsentChange} />
    </>
  );
}