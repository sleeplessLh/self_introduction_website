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

export default function App() {
  if (window.location.pathname === '/reset-password') return <><GlobalBackground /><ResetPassword /></>;
  return <><GlobalBackground /><Navbar /><main><Hero /><About /><EducationSkills /><Projects /><Competitions /><LearningJourney /><Strengths /><Contact /></main><HostAccess /></>;
}
