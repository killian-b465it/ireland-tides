const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

// Ensure we normalize line endings in our replacements
content = content.replace(/\r\n/g, '\n');

const utilMenuTarget = `<div class="util-dropdown-content">
              <button onclick="openEmailCenter('\${u.email}')">📧 Email Member</button>`;
              
const utilMenuReplacement = `<div class="util-dropdown-content">
              <button style="color: #FFD700; font-weight: bold;" onclick="awardBadgeFromList('\${u.id}', '\${(u.name || '').replace(/'/g, "\\\\'")}')">🏆 Award Fish of Month</button>
              <button onclick="openEmailCenter('\${u.email}')">📧 Email Member</button>`;

if (content.includes(utilMenuTarget)) {
    content = content.replace(utilMenuTarget, utilMenuReplacement);
}

if (!content.includes('window.awardBadgeFromList')) {
  const adminBadgeLogic = `
window.awardBadgeFromList = async (userId, userName) => {
  if (!state.user || !state.user.isAdmin) return;
  const badgeType = 'Fish of the Month';
  
  if (!confirm('Are you sure you want to award "Fish of the Month" to ' + userName + '?')) return;

  try {
    const userRef = firebaseDB.ref('users/' + userId);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
      return alert('User not found!');
    }
    
    const userData = snapshot.val();
    const badges = userData.badges || [];
    
    if (!badges.includes(badgeType)) {
      badges.push(badgeType);
      await userRef.update({ badges });
      alert('Successfully awarded "' + badgeType + '" to ' + userName);
      
      const userIdx = state.allUsers.findIndex(u => u.id === userId);
      if (userIdx !== -1) {
        state.allUsers[userIdx].badges = badges;
        renderCatchFeed();
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

fs.writeFileSync('app.js', content);
