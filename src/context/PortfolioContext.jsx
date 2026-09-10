import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createDefaultContent } from '../data/portfolio.js';
import { loadContent, saveContent } from '../services/contentStorage.js';

const PortfolioContext = createContext(null);
const clone = value => JSON.parse(JSON.stringify(value));
const mergeSections = (saved = {}, defaults = {}) => Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, { ...value, ...(saved[key] || {}) }]));
const normalizeGallery = gallery => (gallery || []).map(image => typeof image === 'string' ? { src: image, caption: '', hidden: false } : { caption: '', hidden: false, ...image });
const normalizeCollection = (items = []) => items.map(item => ({ galleryUrl: '', details: '', coverPosition: '50% 50%', ...item, gallery: normalizeGallery(item.gallery) }));
const normalizeLearning = (items = []) => items.map(item => ({ hidden: false, knowledge: [], topics: [], technologies: [], resources: [], notes: '', ...item, knowledge: (item.knowledge || []).map(entry => ({ hidden: false, resourceLabel: '', resourceUrl: '', projectLabel: '', projectUrl: '', ...entry })) }));
function normalize(saved, defaults) {
  if (!saved) return defaults;
  if (!saved.navigation) return { ...defaults, profile: { ...defaults.profile, ...saved }, theme: { ...defaults.theme, accent: saved.accent || defaults.theme.accent } };
  const isLegacyHero = !saved.schemaVersion || saved.schemaVersion < 3;
  const needsCompetitionTemplate = !saved.schemaVersion || saved.schemaVersion < 4;
  const needsProfessionalPortrait = !saved.schemaVersion || saved.schemaVersion < 7;
  const hero = isLegacyHero ? defaults.hero : { ...defaults.hero, ...saved.hero, ...(needsProfessionalPortrait ? { portrait: defaults.hero.portrait, portraitPosition: defaults.hero.portraitPosition } : {}) };
  return { ...defaults, ...saved, schemaVersion: defaults.schemaVersion, theme: { ...defaults.theme, ...saved.theme }, hero, profile: { ...defaults.profile, ...saved.profile }, about: { ...defaults.about, ...saved.about }, sections: mergeSections(saved.sections, defaults.sections), contact: { ...defaults.contact, ...saved.contact }, navigation: saved.navigation || defaults.navigation, projects: normalizeCollection(saved.projects || defaults.projects), competitions: normalizeCollection(needsCompetitionTemplate ? defaults.competitions : saved.competitions || []), learningJourney: normalizeLearning(saved.learningJourney || []), strengths: saved.strengths || defaults.strengths };
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
