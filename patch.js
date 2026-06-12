const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

content = content.replace(
  'const postTimestamp = Date.now();',
  'const isPrivate = document.getElementById("catch-is-private") ? document.getElementById("catch-is-private").checked : false;\n    const postTimestamp = Date.now();'
);

content = content.replace(
  'loadout: selectedLoadout,\n      likes: 0,',
  'loadout: selectedLoadout,\n      isPrivate: isPrivate,\n      likes: 0,'
);

content = content.replace(
  'loadout: selectedLoadout,\r\n      likes: 0,',
  'loadout: selectedLoadout,\r\n      isPrivate: isPrivate,\r\n      likes: 0,'
);

content = content.replace(
  '// Skip general posts (no coordinates)\r\n  if (!c.lat || !c.lng) return;',
  '// Skip general posts (no coordinates)\r\n  if (!c.lat || !c.lng || c.isPrivate) return;'
);

content = content.replace(
  '// Skip general posts (no coordinates)\n  if (!c.lat || !c.lng) return;',
  '// Skip general posts (no coordinates)\n  if (!c.lat || !c.lng || c.isPrivate) return;'
);

content = content.replace(
  'function renderCatchFeed() {\r\n  const feed = document.getElementById(\'catch-feed\');\r\n  if (!feed) return; // Guard against null element\r\n  feed.innerHTML = \'\';\r\n\r\n  // Sort all catches: First by pinned status, then by time (id is the timestamp)\r\n  const allSortedCatches = [...(state.catches || [])].sort((a, b) => {',
  'function renderCatchFeed() {\r\n  const feed = document.getElementById(\'catch-feed\');\r\n  if (!feed) return; // Guard against null element\r\n  feed.innerHTML = \'\';\r\n\r\n  const publicCatches = (state.catches || []).filter(c => !c.isPrivate);\r\n\r\n  // Sort all catches: First by pinned status, then by time (id is the timestamp)\r\n  const allSortedCatches = [...publicCatches].sort((a, b) => {'
);
content = content.replace(
  'function renderCatchFeed() {\n  const feed = document.getElementById(\'catch-feed\');\n  if (!feed) return; // Guard against null element\n  feed.innerHTML = \'\';\n\n  // Sort all catches: First by pinned status, then by time (id is the timestamp)\n  const allSortedCatches = [...(state.catches || [])].sort((a, b) => {',
  'function renderCatchFeed() {\n  const feed = document.getElementById(\'catch-feed\');\n  if (!feed) return; // Guard against null element\n  feed.innerHTML = \'\';\n\n  const publicCatches = (state.catches || []).filter(c => !c.isPrivate);\n\n  // Sort all catches: First by pinned status, then by time (id is the timestamp)\n  const allSortedCatches = [...publicCatches].sort((a, b) => {'
);

content = content.replace(
  '// Calculate trending hashtags from all posts dynamically\r\n  const tagCounts = {};\r\n  (state.catches || []).forEach(c => {',
  '// Calculate trending hashtags from all posts dynamically\r\n  const tagCounts = {};\r\n  publicCatches.forEach(c => {'
);
content = content.replace(
  '// Calculate trending hashtags from all posts dynamically\n  const tagCounts = {};\n  (state.catches || []).forEach(c => {',
  '// Calculate trending hashtags from all posts dynamically\n  const tagCounts = {};\n  publicCatches.forEach(c => {'
);

fs.writeFileSync('app.js', content);
