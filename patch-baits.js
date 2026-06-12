const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetToReplace = `      tagsListContainer.appendChild(tagBadge);\n    });\n  }`;
const replacement = `      tagsListContainer.appendChild(tagBadge);
    });
  }

  // Calculate top baits
  const baitCounts = {};
  const commonBaits = [
    'mackerel', 'crab', 'peeler', 'squid', 'lugworm', 'ragworm', 'sandeel', 'sand eel',
    'sprat', 'soft plastic', 'spinner', 'dexter', 'fiish', 'jig', 'popper', 'fly', 
    'mussel', 'cockle', 'razor', 'prawn', 'shrimp', 'sweetcorn', 'maggot', 'caster', 
    'worm', 'boilie', 'pellet', 'bread', 'deadbait', 'roach', 'smelt', 'herring',
    'black lug', 'maddies'
  ];
  
  publicCatches.forEach(c => {
    const text = (c.details || c.notes || '').toLowerCase();
    commonBaits.forEach(bait => {
      const regex = new RegExp(\`\\\\b\${bait}\\\\b\`, 'g');
      const matches = text.match(regex);
      if (matches) {
        const key = bait === 'sand eel' ? 'sandeel' : bait;
        baitCounts[key] = (baitCounts[key] || 0) + matches.length;
      }
    });
  });

  const popularBaits = Object.keys(baitCounts)
    .sort((a, b) => baitCounts[b] - baitCounts[a])
    .slice(0, 3);

  // Render Top Baits UI
  const topBaitsContainer = document.getElementById('top-baits-list');
  if (topBaitsContainer) {
    if (popularBaits.length > 0) {
      topBaitsContainer.innerHTML = '';
      popularBaits.forEach(b => {
        const isActive = (state.feedSearchQuery || '').toLowerCase() === b.toLowerCase();
        const baitBadge = document.createElement('span');
        baitBadge.className = \`tag-badge \${isActive ? 'active' : ''}\`;
        baitBadge.style.cssText = isActive 
           ? 'background: var(--accent-warning); color: #000; text-transform: capitalize;' 
           : 'background: rgba(255, 165, 0, 0.1); border-color: rgba(255, 165, 0, 0.3); color: var(--accent-warning); text-transform: capitalize;';
        baitBadge.innerText = b;
        baitBadge.onclick = () => {
          if (isActive) setFeedSearch('');
          else setFeedSearch(b);
        };
        topBaitsContainer.appendChild(baitBadge);
      });
    } else {
      topBaitsContainer.innerHTML = \`<span style="font-size: 0.8rem; color: var(--text-muted);">Not enough data yet...</span>\`;
    }
  }`;

content = content.replace(targetToReplace, replacement);
fs.writeFileSync('app.js', content);
