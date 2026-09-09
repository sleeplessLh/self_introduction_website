import ProjectCard from './ProjectCard.jsx';
import Reveal from './Reveal.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
export default function Projects() { const { data } = usePortfolio(); return <section className="projects-section" id="projects"><div className="projects-inner"><div className="section-label">02 / SELECTED WORK</div><Reveal className="projects-heading"><h2>Proof through<br /><em>practice.</em></h2><p>Selected projects will live here. Each one is structured to show the problem, the craft, and the technology behind the result.</p></Reveal><div className="project-list">{data.projects.map((project, index) => <Reveal key={`${project.title}-${index}`}><ProjectCard project={project} index={index} /></Reveal>)}</div></div></section>; }
