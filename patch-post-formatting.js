const fs = require('fs');

// PATCH APP.JS
let appContent = fs.readFileSync('app.js', 'utf8');
appContent = appContent.replace(/\r\n/g, '\n');

const targetFormat = `function formatPostText(str) {
  if (!str) return '';
  const sanitized = sanitizeHTML(str);
  return sanitized.replace(/#([a-zA-Z0-9_\\u00C0-\\u00FF]+)/g, (match, tag) => {
    return \`<span class="hashtag-link" onclick="event.stopPropagation(); setFeedSearch('\${match}')">\${match}</span>\`;
  });
}`;

const replacementFormat = `function formatPostText(str) {
  if (!str) return '';
  const sanitized = sanitizeHTML(str);
  return sanitized
    .replace(/\\n/g, '<br>')
    .replace(/#([a-zA-Z0-9_\\u00C0-\\u00FF]+)/g, (match, tag) => {
      return \`<span class="hashtag-link" onclick="event.stopPropagation(); setFeedSearch('\${match}')">\${match}</span>\`;
    });
}`;
appContent = appContent.replace(targetFormat, replacementFormat);

const targetToggle = `window.togglePinCatch = (catchId) => {`;
const replacementToggle = `window.togglePostText = (id) => {
  const textEl = document.getElementById('post-text-' + id);
  const btnEl = document.getElementById('show-more-post-' + id);
  if (textEl && btnEl) {
    if (textEl.classList.contains('collapsed-post-text')) {
      textEl.classList.remove('collapsed-post-text');
      btnEl.innerText = 'Show less';
    } else {
      textEl.classList.add('collapsed-post-text');
      btnEl.innerText = 'Show more';
    }
  }
};

window.togglePinCatch = (catchId) => {`;
appContent = appContent.replace(targetToggle, replacementToggle);

const targetRenderSetup = `    const item = document.createElement('div');`;
const replacementRenderSetup = `    const rawText = c.details || c.notes || '';
    const isLongText = rawText.length > 250 || (rawText.match(/\\n/g) || []).length >= 3;
    let detailsHtml = '';
    if (displayDetails) {
       detailsHtml = \`<p class="catch-details \${isLongText ? 'collapsed-post-text' : ''}" id="post-text-\${c.id}">\${displayDetails}</p>\`;
       if (isLongText) {
         detailsHtml += \`<button class="show-more-post-btn" id="show-more-post-\${c.id}" onclick="togglePostText(\${c.id})" style="margin-top: 5px; margin-bottom: 10px; font-size: 0.8rem; padding: 4px 10px; background: transparent; border: 1px solid var(--accent-primary); color: var(--accent-primary); border-radius: 12px; cursor: pointer; display: inline-block;">Show more</button>\`;
       }
    }

    const item = document.createElement('div');`;
appContent = appContent.replace(targetRenderSetup, replacementRenderSetup);

const targetRenderInject = `        <p class="catch-species"><strong>🎣 \${sanitizeHTML(c.species || 'Catch')}</strong></p>\n        \${displayDetails ? \`<p class="catch-details">\${displayDetails}</p>\` : ''}`;
const replacementRenderInject = `        <p class="catch-species"><strong>🎣 \${sanitizeHTML(c.species || 'Catch')}</strong></p>\n        \${detailsHtml}`;
appContent = appContent.replace(targetRenderInject, replacementRenderInject);

fs.writeFileSync('app.js', appContent);

// PATCH STYLE.CSS
let cssContent = fs.readFileSync('style.css', 'utf8');
if (!cssContent.includes('.collapsed-post-text')) {
   cssContent += `\n/* Post Text Collapsing */\n.collapsed-post-text {\n  display: -webkit-box;\n  -webkit-line-clamp: 4;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n`;
   fs.writeFileSync('style.css', cssContent);
}

console.log('Patched formatting rules successfully!');
