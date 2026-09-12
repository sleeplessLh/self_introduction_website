import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createDefaultContent } from '../data/portfolio.js';
import { loadContent, saveContent } from '../services/contentStorage.js';

const PortfolioContext = createContext(null);
const clone = value => JSON.parse(JSON.stringify(value));
const mergeSections = (saved = {}, defaults = {}) => Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, { ...value, ...(saved[key] || {}) }]));
const stableId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const normalizeGallery = gallery => (gallery || []).map(image => typeof image === 'string' ? { id: stableId(), src: image, caption: '', hidden: false } : { id: image.id || stableId(), caption: '', hidden: false, ...image });
const normalizeLabels = labels => (labels || []).map(entry => typeof entry === 'string' ? { id: stableId(), label: entry } : { id: entry.id || stableId(), label: entry.label || '' });
const normalizeCollection = (items = []) => items.map(item => ({ galleryUrl: '', details: '', coverPosition: '50% 50%', ...item, gallery: normalizeGallery(item.gallery), technologies: normalizeLabels(item.technologies), tags: normalizeLabels(item.tags) }));
const normalizeLearning = (items = []) => items.map(item => ({ id: item.id || stableId(), title: item.title || 'Learning item', description: item.description || item.summary || '', hidden: Boolean(item.hidden) }));
const normalizeEducation = (items = []) => items.map(item => ({ id: item.id || stableId(), school: '', subtitle: '', description: '', grade: '', startDate: '', endDate: '', logo: '', logoPosition: '50% 50%', ...item }));
const normalizeSkills = (groups = []) => groups.map(group => ({ id: group.id || stableId(), name: '', description: '', ...group, skills: (group.skills || []).map(skill => typeof skill === 'string' ? { id: stableId(), name: skill } : { id: skill.id || stableId(), ...skill }) }));
function normalize(saved, defaults) {
  if (!saved) return defaults;
  if (!saved.navigation) return { ...defaults, profile: { ...defaults.profile, ...saved }, theme: { ...defaults.theme, accent: saved.accent || defaults.theme.accent } };
  const isLegacyHero = !saved.schemaVersion || saved.schemaVersion < 3;
  const needsCompetitionTemplate = !saved.schemaVersion || saved.schemaVersion < 4;
  const needsProfessionalPortrait = !saved.schemaVersion || saved.schemaVersion < 10;
  const needsStructuredEducation = !saved.schemaVersion || saved.schemaVersion < 10;
  const hero = isLegacyHero ? defaults.hero : { ...defaults.hero, ...saved.hero, ...(needsProfessionalPortrait ? { portrait: defaults.hero.portrait, portraitPosition: defaults.hero.portraitPosition } : {}) };
  return { ...defaults, ...saved, schemaVersion: defaults.schemaVersion, theme: { ...defaults.theme, ...saved.theme }, hero, profile: { ...defaults.profile, ...saved.profile }, about: { ...defaults.about, ...saved.about }, sections: mergeSections(saved.sections, defaults.sections), contact: { ...defaults.contact, ...saved.contact }, navigation: saved.navigation || defaults.navigation, projects: normalizeCollection(saved.projects || defaults.projects), competitions: normalizeCollection(needsCompetitionTemplate ? defaults.competitions : saved.competitions || []), learningJourney: normalizeLearning(saved.learningJourney || []), educationStages: normalizeEducation(needsStructuredEducation ? defaults.educationStages : saved.educationStages || defaults.educationStages), skillGroups: normalizeSkills(needsStructuredEducation ? defaults.skillGroups : saved.skillGroups || defaults.skillGroups), strengths: saved.strengths || defaults.strengths };
}
export function PortfolioProvider({ children }) {
  const [defaults] = useState(() => createDefaultContent());
  const [content, setContent] = useState(defaults);
  const [savedContent, setSavedContent] = useState(defaults);
  const [hostMode, setHostMode] = useState(false);
  const [editorRequest, setEditorRequest] = useState(null);
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  useEffect(() => { loadContent().then(row => { const next = normalize(row?.content, defaults); setContent(next); setSavedContent(next); setHistory([]); setFuture([]); }); }, [defaults]);
  useEffect(() => { document.documentElement.style.setProperty('--host-accent', content.theme.accent || '#c9ee6b'); }, [content.theme.accent]);
  const update = updater => setContent(current => { const next = typeof updater === 'function' ? updater(current) : updater; if (JSON.stringify(next) === JSON.stringify(current)) return current; setHistory(items => [...items.slice(-59), clone(current)]); setFuture([]); return next; });
  const undo = () => { if (!history.length) return; const previous = history[history.length - 1]; setHistory(items => items.slice(0, -1)); setFuture(items => [clone(content), ...items].slice(0, 60)); setContent(clone(previous)); setStatus('Last edit undone'); };
  const redo = () => { if (!future.length) return; const next = future[0]; setFuture(items => items.slice(1)); setHistory(items => [...items.slice(-59), clone(content)]); setContent(clone(next)); setStatus('Edit restored'); };
  const save = async () => { setStatus('Saving…'); try { await saveContent(content); setSavedContent(clone(content)); setHistory([]); setFuture([]); setStatus('Saved successfully'); } catch (error) { setStatus(error.message || 'Could not save changes.'); } };
  const cancel = () => { setContent(clone(savedContent)); setHistory([]); setFuture([]); setStatus('Unsaved changes discarded'); };
  const reset = () => { const next = createDefaultContent(); setContent(next); setHistory([]); setFuture([]); setStatus('Default content loaded — save to publish it.'); };
  const value = useMemo(() => ({ content, update, hostMode, setHostMode, editorRequest, requestEditor: setEditorRequest, save, cancel, reset, undo, redo, canUndo: history.length > 0, canRedo: future.length > 0, changeCount: history.length, status, isDirty: JSON.stringify(content) !== JSON.stringify(savedContent) }), [content, hostMode, editorRequest, status, savedContent, history, future]);
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
export const usePortfolio = () => useContext(PortfolioContext);
