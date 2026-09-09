import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { profile as defaultProfile } from '../data/portfolio.js';
import { supabase } from '../lib/supabase.js';

const PortfolioContext = createContext({ profile: defaultProfile, refreshProfile: async () => {} });

export function PortfolioProvider({ children }) {
  const [savedProfile, setSavedProfile] = useState({});
  const refreshProfile = async () => {
    const { data } = await supabase.from('portfolio_content').select('content').limit(1).maybeSingle();
    setSavedProfile(data?.content || {});
  };
  useEffect(() => { refreshProfile(); }, []);
  const profile = useMemo(() => ({ ...defaultProfile, ...savedProfile }), [savedProfile]);
  useEffect(() => { document.documentElement.style.setProperty('--host-accent', profile.accent || '#c9ee6b'); }, [profile.accent]);
  return <PortfolioContext.Provider value={{ profile, refreshProfile }}>{children}</PortfolioContext.Provider>;
}

export const usePortfolio = () => useContext(PortfolioContext);
