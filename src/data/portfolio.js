import portrait from '../assets/images/portrait-placeholder.svg';
import projectOne from '../assets/images/project-one.svg';
import projectTwo from '../assets/images/project-two.svg';
import projectThree from '../assets/images/project-three.svg';

// Replace placeholder text, links and assets here after adding resume details.
export const profile = {
  name: 'YOUR NAME',
  initials: 'YN',
  role: 'Software Engineer / Student',
  location: 'Based in [Your City]',
  email: 'your.email@example.com',
  intro: 'I build considered software at the intersection of reliable systems and useful human experiences.',
  bio: 'This is a placeholder introduction. Replace it with a concise point of view: the problems you enjoy solving, the kind of engineer you are becoming, and what you care about when building software.',
  education: 'B.Sc. Software Engineering · [University] · [Expected year]',
  portrait,
  // Add a local MP4 at src/assets/videos/hero.mp4, then set videoSrc to it.
  videoSrc: null,
  resumeUrl: '#',
};

export const stats = [
  ['01', 'Focus areas', 'Software systems, product engineering'],
  ['02', 'Currently learning', 'Architecture, data, distributed systems'],
  ['03', 'Open to', 'Internships, collaborations, meaningful problems'],
];

export const experience = [
  { period: 'NOW', title: 'Building foundations', detail: 'Placeholder for your current study, role, or independent work.' },
  { period: 'NEXT', title: 'Seeking applied experience', detail: 'Placeholder for the kind of opportunity you would like to pursue.' },
];

export const highlights = [
  { label: 'Competitions', value: 'Add hackathons, contests, or challenges here.' },
  { label: 'Recognition', value: 'Add an award, scholarship, or meaningful milestone here.' },
  { label: 'Technical interests', value: 'Systems · Backend · AI/ML · Developer tools' },
];

export const projects = [
  { title: 'PROJECT / ONE', category: 'Product Engineering', year: '2026', description: 'A placeholder for a project that solves one clear problem with a thoughtful technical approach.', technologies: ['React', 'Node.js', 'PostgreSQL'], image: projectOne, github: '#', demo: '#' },
  { title: 'PROJECT / TWO', category: 'Systems & Data', year: '2026', description: 'A placeholder for an engineering project where the implementation reveals how you think.', technologies: ['Python', 'APIs', 'Docker'], image: projectTwo, github: '#', demo: '#' },
  { title: 'PROJECT / THREE', category: 'Experiment', year: '2026', description: 'A placeholder for a technical experiment, tool, or prototype worth exploring in public.', technologies: ['JavaScript', 'Data', 'Design'], image: projectThree, github: '#', demo: '#' },
];

export const strengths = [
  ['01', 'Software Engineering', 'From problem framing to maintainable implementation.'],
  ['02', 'Problem Solving', 'Breaking ambiguous problems into testable steps.'],
  ['03', 'Systems Thinking', 'Considering the interactions behind a useful interface.'],
  ['04', 'Technical Learning', 'Building depth through deliberate practice and iteration.'],
  ['05', 'Collaboration', 'Communicating clearly, sharing context, and moving work forward.'],
  ['06', 'Engineering Craft', 'Caring about clarity, edge cases, and the details that last.'],
];

export const socialLinks = {
  github: { label: 'GitHub', url: 'https://github.com/' },
  linkedin: { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
};
