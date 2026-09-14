import { usePortfolio } from '../context/PortfolioContext.jsx';

export function useSectionVisibility(sectionKey) {
  const { content, update, hostMode } = usePortfolio();
  const hidden = Boolean(content.sectionVisibility?.[sectionKey]);
  const toggle = () => update(current => ({
    ...current,
    sectionVisibility: { ...current.sectionVisibility, [sectionKey]: !hidden }
  }));
  return { hidden, hostMode, toggle, shouldRender: hostMode || !hidden };
}

export default function SectionVisibilityToggle({ sectionKey }) {
  const { hidden, hostMode, toggle } = useSectionVisibility(sectionKey);
  if (!hostMode) return null;
  return <button type="button" className="section-visibility-toggle" onClick={toggle} aria-pressed={hidden}>{hidden ? 'Show module' : 'Hide module'}</button>;
}
