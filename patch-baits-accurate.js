const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

content = content.replace(/\r\n/g, '\n');

const target = `  // Calculate top baits
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
  });`;

const replacement = `  // Calculate top baits (Accurate Dictionary Matcher)
  const baitCounts = {};
  
  // Maps multiple regex variations to a single canonical standard name
  const baitDictionary = {
    'mackerel': /\\bmackerel\\b/g,
    'peeler crab': /\\bpeelers?\\b|\\bpeeler crabs?\\b/g,
    'crab': /\\bcrabs?\\b/g,
    'squid': /\\bsquids?\\b/g,
    'lugworm': /\\blugworms?\\b|\\blug\\b/g,
    'ragworm': /\\bragworms?\\b|\\brag\\b/g,
    'sandeel': /\\bsand\\s?eels?\\b/g,
    'sprat': /\\bsprats?\\b/g,
    'soft plastic': /\\bsoft plastics?\\b|\\bweedless minnows?\\b/g,
    'spinner': /\\bspinners?\\b/g,
    'dexter wedge': /\\bdexters?\\b|\\bdexter wedges?\\b/g,
    'jig': /\\bjigs?\\b/g,
    'popper': /\\bpoppers?\\b/g,
    'mussel': /\\bmussels?\\b/g,
    'razor clam': /\\brazors?\\b|\\brazor clams?\\b/g,
    'prawn': /\\bprawns?\\b/g,
    'shrimp': /\\bshrimps?\\b/g,
    'sweetcorn': /\\bsweetcorn\\b|\\bcorn\\b/g,
    'maggot': /\\bmaggots?\\b/g,
    'boilie': /\\bboilies?\\b/g,
    'pellet': /\\bpellets?\\b/g,
    'pike deadbait': /\\bdeadbaits?\\b|\\bsmelt\\b|\\broach\\b|\\bherring\\b/g,
    'black lug': /\\bblack lug\\b/g,
    'maddies': /\\bmaddies?\\b/g,
    'fiish minnow': /\\bfiish\\b/g
  };
  
  publicCatches.forEach(c => {
    const text = (c.details || c.notes || '').toLowerCase();
    
    // We keep track of found keys per post to avoid counting multiple mentions 
    // of the same bait in a single post as multiple separate catch reports.
    const foundInThisPost = new Set();

    Object.keys(baitDictionary).forEach(canonicalName => {
      const regex = baitDictionary[canonicalName];
      if (regex.test(text)) {
        foundInThisPost.add(canonicalName);
      }
    });

    // Special fallback: If "peeler crab" is matched, don't also count it as "crab"
    if (foundInThisPost.has('peeler crab') && foundInThisPost.has('crab')) {
        foundInThisPost.delete('crab');
    }

    foundInThisPost.forEach(bait => {
       baitCounts[bait] = (baitCounts[bait] || 0) + 1;
    });
  });`;

content = content.replace(target, replacement);

fs.writeFileSync('app.js', content);
