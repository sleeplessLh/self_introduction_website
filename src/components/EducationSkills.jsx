import EditableText from '../editor/EditableText.jsx';
import { ImageField } from '../editor/EditorField.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export default function EducationSkills() {
  const { content, update, hostMode } = usePortfolio();
  const setAbout = (key, value) => update(current => ({ ...current, about: { ...current.about, [key]: value } }));
  const setStage = (id, key, value) => update(current => ({ ...current, educationStages: current.educationStages.map(stage => stage.id === id ? { ...stage, [key]: value } : stage) }));
  const setGroup = (id, key, value) => update(current => ({ ...current, skillGroups: current.skillGroups.map(group => group.id === id ? { ...group, [key]: value } : group) }));
  const setSkill = (groupId, skillId, value) => update(current => ({ ...current, skillGroups: current.skillGroups.map(group => group.id === groupId ? { ...group, skills: group.skills.map(skill => skill.id === skillId ? { ...skill, name: value } : skill) } : group) }));
  const addEducation = () => update(current => ({ ...current, educationStages: [...current.educationStages, { id: uid(), school: 'New school', subtitle: 'Course or stream', startDate: 'Start', endDate: 'Present', grade: '', description: '', logo: '', logoPosition: '50% 50%' }] }));
  const addSkillGroup = () => update(current => ({ ...current, skillGroups: [...current.skillGroups, { id: uid(), name: 'New Skill Group', description: '', skills: [] }] }));

  return <div className="education-skills-stack">
    <section className="education-section profile-content-section" id="education">
      <header className="profile-section-header"><div><p className="kicker"><EditableText value={content.about.educationTitle} onChange={value => setAbout('educationTitle', value)} /></p><h2>Education</h2></div><small><EditableText value={content.about.educationDirection} onChange={value => setAbout('educationDirection', value)} /></small>{hostMode && <button className="editor-add section-inline-add" onClick={addEducation}>+ Add Education</button>}</header>
      <div className="education-timeline" aria-label="Education timeline, newest to earliest">
        {content.educationStages.map((stage, index) => <article className="education-stage" key={stage.id}>
          <div className="timeline-rail" aria-hidden="true"><span>{index === 0 ? '↑' : '●'}</span><i /></div>
          <div className="education-card">
            <div className="education-logo-cell">{stage.logo ? <img src={stage.logo} alt={`${stage.school} logo`} style={{ objectPosition: stage.logoPosition || '50% 50%' }} /> : <div className="education-logo-empty">LOGO</div>}{hostMode && <ImageField label="School Logo" value={stage.logo || ''} onChange={value => setStage(stage.id, 'logo', value)} />}</div>
            <div className="education-card-copy"><div className="education-date"><EditableText value={stage.startDate} onChange={value => setStage(stage.id, 'startDate', value)} /> — <EditableText value={stage.endDate} onChange={value => setStage(stage.id, 'endDate', value)} /></div><h3><EditableText value={stage.school} onChange={value => setStage(stage.id, 'school', value)} /></h3><p className="education-subtitle"><EditableText value={stage.subtitle || ''} onChange={value => setStage(stage.id, 'subtitle', value)} /></p>{stage.grade && <b className="education-grade"><EditableText value={stage.grade} onChange={value => setStage(stage.id, 'grade', value)} /></b>}<p className="education-description"><EditableText value={stage.description || ''} multiline onChange={value => setStage(stage.id, 'description', value)} /></p>{hostMode && <label className="inline-position-field">Logo position<input value={stage.logoPosition || '50% 50%'} onChange={event => setStage(stage.id, 'logoPosition', event.target.value)} /></label>}</div>
          </div>
        </article>)}
      </div>
    </section>

    <section className="skills-section profile-content-section" id="skills">
      <header className="profile-section-header"><div><p className="kicker"><EditableText value={content.about.skillsTitle} onChange={value => setAbout('skillsTitle', value)} /></p><h2>Skills</h2></div>{hostMode && <button className="editor-add section-inline-add" onClick={addSkillGroup}>+ Add Skill Group</button>}</header>
      <div className="skill-groups">{content.skillGroups.map(group => <article className="skill-group" key={group.id}><p className="skill-group-index">{String(content.skillGroups.findIndex(item => item.id === group.id) + 1).padStart(2, '0')}</p><h3><EditableText value={group.name} onChange={value => setGroup(group.id, 'name', value)} /></h3><p className="skill-group-description"><EditableText value={group.description || ''} multiline onChange={value => setGroup(group.id, 'description', value)} /></p><div>{group.skills.map(skill => <span key={skill.id}><EditableText value={skill.name} onChange={value => setSkill(group.id, skill.id, value)} /></span>)}</div></article>)}</div>
    </section>
  </div>;
}
