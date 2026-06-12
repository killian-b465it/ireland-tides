const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');
content = content.replace(/\r\n/g, '\n');

const target = `  publicCatches.forEach(c => {
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

const replacement = `  publicCatches.forEach(c => {
    const text = (c.details || c.notes || '').toLowerCase();
    const foundInThisPost = new Set();

    // Items that are rarely the target catch (pure baits/lures)
    const unambiguousBaits = [
      'lugworm', 'ragworm', 'sandeel', 'soft plastic', 'spinner', 'dexter wedge', 
      'jig', 'popper', 'sweetcorn', 'maggot', 'boilie', 'pellet', 'pike deadbait', 
      'black lug', 'maddies', 'fiish minnow'
    ];

    Object.keys(baitDictionary).forEach(canonicalName => {
      const regex = baitDictionary[canonicalName];
      // Reset regex index because we are using the 'g' flag
      regex.lastIndex = 0; 
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        const precedingText = text.substring(Math.max(0, match.index - 35), match.index);
        const followingText = text.substring(match.index + match[0].length, match.index + match[0].length + 35);
        
        const catchVerbs = /\\b(caught|landed|got|hooked|bagged|had|lost)\\b/i;
        // The [^\\.\\?!]*$ ensures the preposition is in the same sentence
        const baitIndicatorsBefore = /\\b(on|with|using|used|bait|lure|took|hit|chuck|cast|throwing|tried)\\b[^\\.\\?!]*$/i;
        const baitIndicatorsAfter = /^(?:\\s+strip)?\\s+(?:did the trick|worked|was the bait|was my bait|as bait|for bait|produced)/i;
        
        const isCatchVerbDirectlyBefore = catchVerbs.test(precedingText) && !baitIndicatorsBefore.test(precedingText);
        const hasBaitContext = baitIndicatorsBefore.test(precedingText) || baitIndicatorsAfter.test(followingText);

        if (unambiguousBaits.includes(canonicalName)) {
           // For dedicated baits (like Spinners, Lugworm), accept unless explicitly stated as the catch
           if (!isCatchVerbDirectlyBefore) {
             foundInThisPost.add(canonicalName);
           }
        } else {
           // For ambiguous things (Mackerel, Crab, Squid), demand strict grammar bait context
           if (hasBaitContext && !isCatchVerbDirectlyBefore) {
             foundInThisPost.add(canonicalName);
           }
        }
      }
    });

    if (foundInThisPost.has('peeler crab') && foundInThisPost.has('crab')) {
        foundInThisPost.delete('crab');
    }

    foundInThisPost.forEach(bait => {
       baitCounts[bait] = (baitCounts[bait] || 0) + 1;
    });
  });`;

content = content.replace(target, replacement);
fs.writeFileSync('app.js', content);
