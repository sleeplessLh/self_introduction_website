import EditableText from '../editor/EditableText.jsx';
import { ImageField } from '../editor/EditorField.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import SectionVisibilityToggle, { useSectionVisibility } from '../editor/SectionVisibilityToggle.jsx';

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const move = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export default function EducationSkills() {
  const { content, update, hostMode, requestEditor } = usePortfolio();
  const educationVisibility = useSectionVisibility('education');
  const skillsVisibility = useSectionVisibility('skills');
  const setAbout = (key, value) => update(current => ({ ...current, about: { ...current.about, [key]: value } }));
  const setStages = educationStages => update(current => ({ ...current, educationStages }));
  const setStage = (id, key, value) => update(current => ({ ...current, educationStages: current.educationStages.map(stage => stage.id === id ? { ...stage, [key]: value } : stage) }));
  const setGroups = skillGroups => update(current => ({ ...current, skillGroups }));
  const setGroup = (id, key, value) => update(current => ({ ...current, skillGroups: current.skillGroups.map(group => group.id === id ? { ...group, [key]: value } : group) }));
  const addEducation = () => setStages([{ id: uid(), school: 'New school', subtitle: 'Course or stream', startDate: 'Start', endDate: 'Present', grade: '', description: '', logo: '', logoPosition: '50% 50%' }, ...content.educationStages]);
  const addSkillGroup = () => setGroups([...content.skillGroups, { id: uid(), name: 'New Skill Group', description: '', skills: [] }]);

  return <div className="education-skills-stack">
    {educationVisibility.shouldRender && <section className={`education-section profile-content-section ${educationVisibility.hidden ? 'is-module-hidden-host' : ''}`} id="education"><SectionVisibilityToggle sectionKey="education" />
      <header className="profile-section-header"><div><p className="kicker"><EditableText value={content.about.educationTitle} onChange={value => setAbout('educationTitle', value)} /></p><h2>Education</h2></div><small><EditableText value={content.about.educationDirection} onChange={value => setAbout('educationDirection', value)} /></small>{hostMode && <button className="editor-add section-inline-add" onClick={addEducation}>+ Add Education</button>}</header>
      <div className="education-timeline" aria-label="Education timeline, newest to earliest">
        {content.educationStages.map((stage, index) => <article className="education-stage" key={stage.id} data-education-id={stage.id}>
          <div className="timeline-rail" aria-hidden="true"><span>{index === 0 ? '↑' : '●'}</span><i /></div>
          <div className="education-card">
            <div className="education-logo-cell">{stage.logo ? <img src={stage.logo} alt={`${stage.school} logo`} style={{ objectPosition: stage.logoPosition || '50% 50%' }} /> : <div className="education-logo-empty">LOGO</div>}{hostMode && <ImageField label="School Logo" value={stage.logo || ''} onChange={value => setStage(stage.id, 'logo', value)} />}</div>
            <div className="education-card-copy">
              <div className="education-date"><EditableText value={stage.startDate} onChange={value => setStage(stage.id, 'startDate', value)} /> — <EditableText value={stage.endDate} onChange={value => setStage(stage.id, 'endDate', value)} /></div>
              <h3><EditableText value={stage.school} onChange={value => setStage(stage.id, 'school', value)} /></h3>
              <p className="education-subtitle"><EditableText value={stage.subtitle || ''} onChange={value => setStage(stage.id, 'subtitle', value)} /></p>
              {(stage.grade || hostMode) && <b className="education-grade"><EditableText value={stage.grade || ''} onChange={value => setStage(stage.id, 'grade', value)} /></b>}
              <p className="education-description"><EditableText value={stage.description || ''} multiline onChange={value => setStage(stage.id, 'description', value)} /></p>
              {hostMode && <><label className="inline-position-field">Logo position<input value={stage.logoPosition || '50% 50%'} onChange={event => setStage(stage.id, 'logoPosition', event.target.value)} /></label><div className="inline-record-actions"><button onClick={() => setStages(move(content.educationStages, index, -1))} disabled={index === 0}>Move up</button><button onClick={() => setStages(move(content.educationStages, index, 1))} disabled={index === content.educationStages.length - 1}>Move down</button><button className="danger" onClick={() => { if (window.confirm(`Delete ${stage.school}?`)) setStages(content.educationStages.filter(item => item.id !== stage.id)); }}>Delete education</button></div></>}
            </div>
          </div>
        </article>)}
      </div>
    </section>}

    {skillsVisibility.shouldRender && <section className={`skills-section profile-content-section ${skillsVisibility.hidden ? 'is-module-hidden-host' : ''}`} id="skills"><SectionVisibilityToggle sectionKey="skills" />
      <header className="profile-section-header"><div><p className="kicker"><EditableText value={content.about.skillsTitle} onChange={value => setAbout('skillsTitle', value)} /></p><h2>Skills</h2></div>{hostMode && <button className="editor-add section-inline-add" onClick={addSkillGroup}>+ Add Skill Group</button>}</header>
      <ol className="skill-groups">{content.skillGroups.map((group, groupIndex) => <li className="skill-group" key={group.id} data-skill-group-id={group.id}>
        <article><p className="skill-group-index">{String(groupIndex + 1).padStart(2, '0')}</p><h3><EditableText value={group.name} onChange={value => setGroup(group.id, 'name', value)} /></h3><p className="skill-group-description"><EditableText value={group.description || ''} multiline onChange={value => setGroup(group.id, 'description', value)} /></p>
          <ol className="skill-items">{group.skills.map((skill, skillIndex) => <li key={skill.id}><span className="skill-letter">{String.fromCharCode(97 + (skillIndex % 26))}.</span><EditableText value={skill.name} onChange={value => setGroup(group.id, 'skills', group.skills.map(item => item.id === skill.id ? { ...item, name: value } : item))} />{hostMode && <div className="skill-inline-actions"><button onClick={() => setGroup(group.id, 'skills', move(group.skills, skillIndex, -1))} disabled={skillIndex === 0} aria-label={`Move ${skill.name} up`}>↑</button><button onClick={() => setGroup(group.id, 'skills', move(group.skills, skillIndex, 1))} disabled={skillIndex === group.skills.length - 1} aria-label={`Move ${skill.name} down`}>↓</button>{content.skillGroups.length > 1 && <select aria-label={`Move ${skill.name} to another group`} value="" onChange={event => { const targetId = event.target.value; if (!targetId) return; setGroups(content.skillGroups.map(item => item.id === group.id ? { ...item, skills: item.skills.filter(entry => entry.id !== skill.id) } : item.id === targetId ? { ...item, skills: [...item.skills, skill] } : item)); }}><option value="">Move to…</option>{content.skillGroups.filter(item => item.id !== group.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}<button className="danger" onClick={() => setGroup(group.id, 'skills', group.skills.filter(item => item.id !== skill.id))} aria-label={`Delete ${skill.name}`}>×</button></div>}</li>)}</ol>
          {hostMode && <div className="inline-record-actions"><button onClick={() => setGroup(group.id, 'skills', [...group.skills, { id: uid(), name: 'New skill' }])}>+ Add Skill</button><button onClick={() => setGroups(move(content.skillGroups, groupIndex, -1))} disabled={groupIndex === 0}>Move up</button><button onClick={() => setGroups(move(content.skillGroups, groupIndex, 1))} disabled={groupIndex === content.skillGroups.length - 1}>Move down</button><button onClick={() => requestEditor({ kind: 'skills', id: group.id })}>Manage / delete group ↗</button></div>}
        </article>
      </li>)}</ol>
    </section>}
  </div>;
}
