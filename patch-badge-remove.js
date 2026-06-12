const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

content = content.replace(/\r\n/g, '\n');

const target1 = `    const plan = u.plan || 'free';\n    const pwd = u.password || '******';`;
const replacement1 = `    const plan = u.plan || 'free';\n    const pwd = u.password || '******';\n    const hasFishBadge = u.badges && u.badges.includes('Fish of the Month');`;
content = content.replace(target1, replacement1);

const target2 = `            <div class="util-dropdown-content">\n              <button style="color: #FFD700; font-weight: bold;" onclick="awardBadgeFromList('\${u.id}', '\${(u.name || '').replace(/'/g, "\\\\'")}')">🏆 Award Fish of Month</button>\n              <button onclick="openEmailCenter('\${u.email}')">📧 Email Member</button>`;
const replacement2 = `            <div class="util-dropdown-content">
              \${hasFishBadge ? 
                \`<button style="color: #ff4d4d; font-weight: bold;" onclick="removeBadgeFromList('\${u.id}', '\${(u.name || '').replace(/'/g, "\\\\'")}')">❌ Remove Fish of Month</button>\` :
                \`<button style="color: #FFD700; font-weight: bold;" onclick="awardBadgeFromList('\${u.id}', '\${(u.name || '').replace(/'/g, "\\\\'")}')">🏆 Award Fish of Month</button>\`
              }
              <button onclick="openEmailCenter('\${u.email}')">📧 Email Member</button>`;
content = content.replace(target2, replacement2);

const target3 = `window.awardBadgeFromList = async (userId, userName) => {`;
const replacement3 = `
window.removeBadgeFromList = async (userId, userName) => {
  if (!state.user || !state.user.isAdmin) return;
  const badgeType = 'Fish of the Month';
  
  if (!confirm('Are you sure you want to remove "Fish of the Month" from ' + userName + '?')) return;

  try {
    const userRef = firebaseDB.ref('users/' + userId);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) return alert('User not found!');
    
    const userData = snapshot.val();
    let badges = userData.badges || [];
    
    if (badges.includes(badgeType)) {
      badges = badges.filter(b => b !== badgeType);
      await userRef.update({ badges });
      alert('Successfully removed "' + badgeType + '" from ' + userName);
      
      const userIdx = state.allUsers.findIndex(u => u.id === userId);
      if (userIdx !== -1) {
        state.allUsers[userIdx].badges = badges;
        renderCatchFeed();
        loadUsersTable(); // re-render the table to toggle the button back
      }
    } else {
      alert('User does not have this badge.');
    }
  } catch (err) {
    alert('Error removing badge: ' + err.message);
  }
};

window.awardBadgeFromList = async (userId, userName) => {`;
content = content.replace(target3, replacement3);

const target4 = `        state.allUsers[userIdx].badges = badges;\n        renderCatchFeed();\n      }`;
const replacement4 = `        state.allUsers[userIdx].badges = badges;\n        renderCatchFeed();\n        loadUsersTable();\n      }`;
content = content.replace(target4, replacement4);

fs.writeFileSync('app.js', content);
