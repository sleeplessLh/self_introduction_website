import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { PortfolioProvider } from './context/PortfolioContext.jsx';
import './styles/global.css';
import './styles/overrides.css';
import './styles/mood.css';
import './styles/cms.css';
import './styles/collection-polish.css';
import './styles/typography-polish.css';
import './styles/gallery-experience.css';
import './styles/module-refinement.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><PortfolioProvider><App /></PortfolioProvider></React.StrictMode>);
