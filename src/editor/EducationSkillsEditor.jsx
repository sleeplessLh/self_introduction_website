import { useState } from 'react';
import { ImageField, TextField } from './EditorField.jsx';

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const move = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export function EducationEditor({ items, onChange }) {
  const [pendingStage, setPendingStage] = useState(null);
  const updateStage = (id, key, value) => onChange(items.map(item => item.id === id ? { ...item, [key]: value } : item));
  const add = () => onChange([...items, { id: uid(), school: 'New school', subtitle: 'Course or stream', grade: '', startDate: 'Start', endDate: 'Present', description: '', logo: '', logoPosition: '50% 50%' }]);
  return <div><button className="editor-add" onClick={add}>+ Add Education</button>{items.map((stage, index) => <article className="editor-item" key={stage.id} data-education-id={stage.id}>
    <div className="editor-item-top"><strong>Education {index + 1}</strong><span><button onClick={() => onChange(move(items, index, -1))} disabled={index === 0}>↑</button><button onClick={() => onChange(move(items, index, 1))} disabled={index === items.length - 1}>↓</button>{pendingStage === stage.id ? <><button className="danger" onClick={() => { onChange(items.filter(item => item.id !== stage.id)); setPendingStage(null); }}>Confirm delete</button><button onClick={() => setPendingStage(null)}>Keep</button></> : <button className="danger" onClick={() => setPendingStage(stage.id)}>Delete</button>}</span></div>
    <TextField label="School Name / Title" value={stage.school} onChange={value => updateStage(stage.id, 'school', value)} />
    <TextField label="Course, Degree or Stream / Subtitle" value={stage.subtitle || ''} onChange={value => updateStage(stage.id, 'subtitle', value)} />
    <TextField label="Start Date" value={stage.startDate} onChange={value => updateStage(stage.id, 'startDate', value)} />
    <TextField label="End Date / Present" value={stage.endDate} onChange={value => updateStage(stage.id, 'endDate', value)} />
    <TextField label="Grade" value={stage.grade || ''} onChange={value => updateStage(stage.id, 'grade', value)} />
    <TextField label="Description" value={stage.description || ''} multiline onChange={value => updateStage(stage.id, 'description', value)} />
    <ImageField label="School Logo / Image" value={stage.logo || ''} onChange={value => updateStage(stage.id, 'logo', value)} />
    <TextField label="Logo position" value={stage.logoPosition || '50% 50%'} placeholder="50% 50%" onChange={value => updateStage(stage.id, 'logoPosition', value)} />
  </article>)}</div>;
}

export function SkillsEditor({ groups, onChange }) {
  const [pendingGroup, setPendingGroup] = useState(null);
  const updateGroup = (id, key, value) => onChange(groups.map(group => group.id === id ? { ...group, [key]: value } : group));
  const deleteGroup = (group, moveSkills) => {
    const target = groups.find(item => item.id !== group.id);
    if (moveSkills && target) onChange(groups.filter(item => item.id !== group.id).map(item => item.id === target.id ? { ...item, skills: [...item.skills, ...group.skills] } : item));
    else onChange(groups.filter(item => item.id !== group.id));
    setPendingGroup(null);
  };
  return <div><button className="editor-add" onClick={() => onChange([...groups, { id: uid(), name: 'New Skill Group', description: '', skills: [] }])}>+ Add Skill Group</button>{groups.map((group, index) => <article className="editor-item" key={group.id} data-skill-group-id={group.id}>
    <div className="editor-item-top"><strong>Group {index + 1}</strong><span><button onClick={() => onChange(move(groups, index, -1))} disabled={index === 0}>↑</button><button onClick={() => onChange(move(groups, index, 1))} disabled={index === groups.length - 1}>↓</button>{pendingGroup === group.id ? <>{group.skills.length > 0 && groups.length > 1 && <button onClick={() => deleteGroup(group, true)}>Move skills & delete</button>}<button className="danger" onClick={() => deleteGroup(group, false)}>Delete{group.skills.length ? ' & skills' : ''}</button><button onClick={() => setPendingGroup(null)}>Keep</button></> : <button className="danger" onClick={() => setPendingGroup(group.id)}>Delete group</button>}</span></div>
    <TextField label="Skill Group Name" value={group.name} onChange={value => updateGroup(group.id, 'name', value)} />
    <TextField label="Group Description" value={group.description || ''} multiline onChange={value => updateGroup(group.id, 'description', value)} />
    <button className="editor-add secondary-add" onClick={() => updateGroup(group.id, 'skills', [...group.skills, { id: uid(), name: 'New skill' }])}>+ Add Skill</button>
    {group.skills.map((skill, skillIndex) => <div className="nested-editor-row skill-editor-row" key={skill.id}><input value={skill.name} aria-label={`Skill ${skillIndex + 1}`} onChange={event => updateGroup(group.id, 'skills', group.skills.map(item => item.id === skill.id ? { ...item, name: event.target.value } : item))} /><button onClick={() => updateGroup(group.id, 'skills', move(group.skills, skillIndex, -1))} disabled={skillIndex === 0}>←</button><button onClick={() => updateGroup(group.id, 'skills', move(group.skills, skillIndex, 1))} disabled={skillIndex === group.skills.length - 1}>→</button>{groups.length > 1 && <select aria-label={`Move ${skill.name} to another group`} value="" onChange={event => { const targetId = event.target.value; if (!targetId) return; onChange(groups.map(item => item.id === group.id ? { ...item, skills: item.skills.filter(entry => entry.id !== skill.id) } : item.id === targetId ? { ...item, skills: [...item.skills, skill] } : item)); }}><option value="">Move to…</option>{groups.filter(item => item.id !== group.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}<button className="danger" onClick={() => updateGroup(group.id, 'skills', group.skills.filter(item => item.id !== skill.id))}>×</button></div>)}
  </article>)}</div>;
}
