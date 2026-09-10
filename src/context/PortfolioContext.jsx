import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createDefaultContent } from '../data/portfolio.js';
import { loadContent, saveContent } from '../services/contentStorage.js';

const PortfolioContext = createContext(null);
const clone = value => JSON.parse(JSON.stringify(value));
function normalize(saved, defaults) {
  if (!saved) return defaults;
  if (!saved.navigation) return { ...defaults, profile: { ...defaults.profile, ...saved }, theme: { ...defaults.theme, accent: saved.accent || defaults.theme.accent } };
  const isLegacyHero = !saved.schemaVersion || saved.schemaVersion < 3;
  const needsCompetitionTemplate = !saved.schemaVersion || saved.schemaVersion < 4;
  return { ...defaults, ...saved, schemaVersion: defaults.schemaVersion, theme: { ...defaults.theme, ...saved.theme }, hero: isLegacyHero ? defaults.hero : { ...defaults.hero, ...saved.hero }, profile: { ...defaults.profile, ...saved.profile }, about: { ...defaults.about, ...saved.about }, sections: { ...defaults.sections, ...saved.sections }, contact: { ...defaults.contact, ...saved.contact }, navigation: saved.navigation || defaults.navigation, projects: saved.projects || defaults.projects, competitions: needsCompetitionTemplate ? defaults.competitions : saved.competitions || [], learningJourney: saved.learningJourney || [], strengths: saved.strengths || defaults.strengths };
}
export function PortfolioProvider({ children }) {
  const [defaults] = useState(() => createDefaultContent());
  const [content, setContent] = useState(defaults);
  const [savedContent, setSavedContent] = useState(defaults);
  const [hostMode, setHostMode] = useState(false);
  const [editorRequest, setEditorRequest] = useState(null);
  const [status, setStatus] = useState('');
  useEffect(() => { loadContent().then(row => { const next = normalize(row?.content, defaults); setContent(next); setSavedContent(next); }); }, [defaults]);
  useEffect(() => { document.documentElement.style.setProperty('--host-accent', content.theme.accent || '#c9ee6b'); }, [content.theme.accent]);
  const update = updater => setContent(current => typeof updater === 'function' ? updater(current) : updater);
  const save = async () => { setStatus('Saving…'); try { await saveContent(content); setSavedContent(clone(content)); setStatus('Saved'); } catch (error) { setStatus(error.message || 'Could not save changes.'); } };
  const cancel = () => { setContent(clone(savedContent)); setStatus('Changes discarded'); };
  const reset = () => { const next = createDefaultContent(); setContent(next); setStatus('Default content loaded — save to publish it.'); };
  const value = useMemo(() => ({ content, update, hostMode, setHostMode, editorRequest, requestEditor: setEditorRequest, save, cancel, reset, status, isDirty: JSON.stringify(content) !== JSON.stringify(savedContent) }), [content, hostMode, editorRequest, status, savedContent]);
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
export const usePortfolio = () => useContext(PortfolioContext);
