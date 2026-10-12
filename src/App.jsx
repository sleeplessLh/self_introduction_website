import { lazy, Suspense, useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import EducationSkills from './components/EducationSkills.jsx';
import Projects from './components/Projects.jsx';
import Competitions from './components/Competitions.jsx';
import LearningJourney from './components/LearningJourney.jsx';
import Strengths from './components/Strengths.jsx';
import Contact from './components/Contact.jsx';
import HostAccess from './components/HostAccess.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import GlobalBackground from './components/GlobalBackground.jsx';

const SpatialExperience = lazy(() => import('./components/SpatialExperience.jsx'));

function DeferredSpatialExperience() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setReady(true);
      return undefined;
    }
    const activate = () => setReady(true);
    const idle = window.requestIdleCallback?.(activate, { timeout: 1200 });
    const timer = idle === undefined ? window.setTimeout(activate, 350) : null;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, []);
  return ready ? <Suspense fallback={<div className="spatial-experience is-fallback" aria-hidden="true"><div className="spatial-fallback"><i /><i /><i /></div></div>}><SpatialExperience /></Suspense> : <div className="spatial-experience is-fallback" aria-hidden="true"><div className="spatial-fallback"><i /><i /><i /></div></div>;
}

export default function App() {
  if (window.location.pathname === '/reset-password') return <><GlobalBackground /><ResetPassword /></>;
  return <><GlobalBackground /><DeferredSpatialExperience /><Navbar /><main><Hero /><About /><EducationSkills /><Projects /><Competitions /><LearningJourney /><Strengths /><Contact /></main><HostAccess /></>;
}
