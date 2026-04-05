import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useStorefrontConfig } from '@bake-app/react/api-client';

interface ThemeContextType {
  theme: string;
  businessName: string;
  tagline: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'warm',
  businessName: 'Tulip Bakery',
  tagline: 'Freshly baked, made with love',
  logoUrl: null,
  heroImageUrl: null,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: config } = useStorefrontConfig();
  const [theme, setTheme] = useState('warm');
  const [businessName, setBusinessName] = useState('Tulip Bakery');
  const [tagline, setTagline] = useState('Freshly baked, made with love');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const storefrontConfig = config as {
      themePreset?: string;
      businessName?: string;
      tagline?: string;
      logoUrl?: string;
      heroImageUrl?: string;
    } | undefined;

    if (storefrontConfig) {
      const preset = storefrontConfig.themePreset || 'warm';
      setTheme(preset);
      document.documentElement.setAttribute('data-theme', preset);
      if (storefrontConfig.businessName) setBusinessName(storefrontConfig.businessName);
      if (storefrontConfig.tagline) setTagline(storefrontConfig.tagline);
      if (storefrontConfig.logoUrl) setLogoUrl(storefrontConfig.logoUrl);
      if (storefrontConfig.heroImageUrl) setHeroImageUrl(storefrontConfig.heroImageUrl);
    } else {
      document.documentElement.setAttribute('data-theme', 'warm');
    }
  }, [config]);

  return (
    <ThemeContext value={{ theme, businessName, tagline, logoUrl, heroImageUrl }}>
      {children}
    </ThemeContext>
  );
}
