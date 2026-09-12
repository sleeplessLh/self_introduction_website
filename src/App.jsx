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
import GlobalBackground from './components/GlobalBackground.jsx';

export default function App() {
  return <><GlobalBackground /><Navbar /><main><Hero /><About /><EducationSkills /><Projects /><Competitions /><LearningJourney /><Strengths /><Contact /></main><HostAccess /></>;
}
