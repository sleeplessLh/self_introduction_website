export const wrapIndex = (index, count) => count ? ((index % count) + count) % count : 0;

export const signedDistance = (index, active, count) => {
  if (count <= 1) return 0;
  const forward = wrapIndex(index - active, count);
  return forward > count / 2 ? forward - count : forward;
};

export const ringRadius = (count, cardWidth = 2.75, gap = .34) => {
  if (count <= 1) return 0;
  if (count === 2) return 2.25;
  return Math.max(3.6, (cardWidth + gap) / (2 * Math.sin(Math.PI / count)));
};

export const galleryCount = item => (item.gallery || []).filter(image => typeof image === 'string' || !image.hidden).length;
