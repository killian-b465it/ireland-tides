const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

// Ensure we normalize line endings in our replacements to match the file
content = content.replace(/\r\n/g, '\n');

if (!content.includes('window.adminAwardBadge')) {
  const adminBadgeLogic = `
// ============================================
// Admin Badge Logic
// ============================================
window.adminAwardBadge = async () => {
  if (!state.user || !state.user.isAdmin) return;
  const targetId = document.getElementById('admin-badge-userid').value.trim();
  const badgeType = document.getElementById('admin-badge-type').value;

  if (!targetId) return alert('Please enter a User ID.');

  try {
    const userRef = firebaseDB.ref('users/' + targetId);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
      return alert('User not found!');
    }
    
    const userData = snapshot.val();
    const badges = userData.badges || [];
    
    if (!badges.includes(badgeType)) {
      badges.push(badgeType);
      await userRef.update({ badges });
      alert('Successfully awarded "' + badgeType + '" to ' + (userData.name || targetId));
      
      // Update local state.allUsers if loaded
      const userIdx = state.allUsers.findIndex(u => u.id === targetId);
      if (userIdx !== -1) {
        state.allUsers[userIdx].badges = badges;
        renderCatchFeed(); // re-render to show badge immediately
      }
    } else {
      alert('User already has this badge.');
    }
  } catch (err) {
    alert('Error awarding badge: ' + err.message);
  }
};
`;
  content += '\n' + adminBadgeLogic;
}

// Patch renderCatchFeed
const targetToReplace = '    const nameStyle = `style="cursor: pointer; font-weight: bold; color: var(--text-main);"`;\n\n    const item = document.createElement(\'div\');';
const replacement = `    const nameStyle = \`style="cursor: pointer; font-weight: bold; color: var(--text-main);"\`;
    
    let authorBadges = [];
    if (state.allUsers && displayUserId) {
      const u = state.allUsers.find(u => u.id === displayUserId);
      if (u && u.badges) authorBadges = u.badges;
    }

    const item = document.createElement('div');`;

content = content.replace(targetToReplace, replacement);

const targetToReplace2 = '          <span class="feed-user" ${userOnClick} ${nameStyle}>${displayName}</span>\n          ${c.authorIsAdmin ? \'<span class="admin-badge">🛡️ Admin</span>\' : \'\'}';
const replacement2 = `          <span class="feed-user" \${userOnClick} \${nameStyle}>\${displayName}</span>
          \${authorBadges.includes('Fish of the Month') ? '<span class="admin-badge" style="background: linear-gradient(135deg, #FFD700, #FDB931); color: #000; font-weight: bold; box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">🏆 Fish of the Month</span>' : ''}
          \${authorBadges.includes('Pro Angler') ? '<span class="admin-badge" style="background: linear-gradient(135deg, #00d4ff, #005bb5); color: #fff;">🎣 Pro Angler</span>' : ''}
          \${c.authorIsAdmin ? '<span class="admin-badge">🛡️ Admin</span>' : ''}`;

content = content.replace(targetToReplace2, replacement2);

fs.writeFileSync('app.js', content);
