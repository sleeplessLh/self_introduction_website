import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { profile, stats, experience, highlights, projects, strengths, socialLinks } from '../data/portfolio.js';
import { supabase } from '../lib/supabase.js';

const defaults = { profile, stats, experience, highlights, projects, strengths, socialLinks };
const PortfolioContext = createContext({ data: defaults, refresh: async () => {} });
const merge = (content) => {
  const legacyProfile = content?.profile || (content?.name ? content : {});
  return { ...defaults, ...content, profile: { ...profile, ...legacyProfile }, socialLinks: { ...socialLinks, ...(content?.socialLinks || {}) } };
};
export function PortfolioProvider({ children }) {
  const [data, setData] = useState(defaults);
  const refresh = async () => { const { data: row } = await supabase.from('portfolio_content').select('content').limit(1).maybeSingle(); setData(merge(row?.content || {})); };
  useEffect(() => { refresh(); }, []);
  useEffect(() => { document.documentElement.style.setProperty('--host-accent', data.profile.accent || '#c9ee6b'); }, [data.profile.accent]);
  const value = useMemo(() => ({ data, refresh, defaults }), [data]);
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
export const usePortfolio = () => useContext(PortfolioContext);
