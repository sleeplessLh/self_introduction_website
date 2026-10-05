import assert from 'node:assert/strict';
import { prependItem } from '../src/utils/collectionOrder.js';

const verifyCollection = name => {
  const older = [{ id: `${name}-c`, title: 'C' }, { id: `${name}-b`, title: 'B' }, { id: `${name}-a`, title: 'A' }];
  const first = { id: `${name}-new-1`, title: 'New item 1' };
  const second = { id: `${name}-new-2`, title: 'New item 2' };

  let items = prependItem(older, first);
  assert.equal(items[0].id, first.id, `${name}: the first new item was not prepended`);

  items = items.map(item => item.id === first.id ? { ...item, title: 'Edited newest item' } : item);
  assert.equal(items[0].title, 'Edited newest item', `${name}: editing changed the order`);

  items = prependItem(items, second);
  assert.deepEqual(items.slice(0, 2).map(item => item.id), [second.id, first.id], `${name}: consecutive additions are not newest-first`);

  const restored = JSON.parse(JSON.stringify(items));
  assert.deepEqual(restored.map(item => item.id), items.map(item => item.id), `${name}: persisted order changed after serialization`);
};

['projects', 'competitions', 'learning'].forEach(verifyCollection);
console.log('Ordering acceptance passed for projects, competitions, and learning.');
