const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

const newSetupClubListeners = `function setupClubListeners(clubId) {
  const club = allClubs.find(c => c.id === clubId);
  const isOwner = club && state.user && club.ownerEmail === state.user.email;
  const isAdmin = state.user && state.user.isAdmin;
  const canDelete = isOwner || isAdmin;

  // Chat / Feed
  const chatRef = firebaseDB.ref('clubs/' + clubId + '/chat');
  chatRef.limitToLast(50).on('value', snap => {
    const chatList = document.getElementById('club-chat-list');
    const data = snap.val();
    if (!data) {
      chatList.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No messages yet. Say hi!</p>';
      return;
    }
    const msgs = Object.keys(data).map(k => ({...data[k], id: k})).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    chatList.innerHTML = msgs.map(m => \`
      <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
        <strong style="color: var(--accent-primary); font-size: 0.85rem;">\${sanitizeHTML(m.authorName)}</strong>
        <span style="color: var(--text-muted); font-size: 0.7rem; float: right;">\${new Date(m.timestamp).toLocaleString()}</span>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">\${sanitizeHTML(m.text)}</p>
        <div style="text-align:right; margin-top:5px;">
           <button class="btn btn-xs btn-outline" style="font-size:0.6rem; padding:2px 6px;" onclick="reportClubContent('chat', '\${clubId}', '\${m.id}', '\${sanitizeHTML(m.text).replace(/'/g, '\\\\\\'')}', '\${sanitizeHTML(m.authorName)}')">Report</button>
           \${canDelete ? \`<button class="btn btn-xs btn-danger" style="font-size:0.6rem; padding:2px 6px; margin-left:5px;" onclick="deleteClubContent('chat', '\${clubId}', '\${m.id}')">Delete</button>\` : ''}
        </div>
      </div>
    \`).join('');
  });
  clubHubListeners.push(chatRef);

  // Catches
  const catchesRef = firebaseDB.ref('clubs/' + clubId + '/catches');
  catchesRef.on('value', snap => {
    const list = document.getElementById('club-catches-list');
    const data = snap.val();
    if (!data) {
      list.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;">No club catches yet.</p>';
      return;
    }
    const catches = Object.keys(data).map(k => ({...data[k], id: k})).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    list.innerHTML = catches.map(c => \`
      <div style="background: rgba(0,0,0,0.2); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); position:relative;">
        \${c.photo ? \`<img src="\${c.photo}" style="width:100%; height:120px; object-fit:cover;" onclick="openImageModal('\${c.photo}')">\` : ''}
        <div style="padding: 8px;">
          <strong style="display:block; font-size:0.9rem; color:var(--text-main);">\${sanitizeHTML(c.species)}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">\${sanitizeHTML(c.weight)}</span>
          <div style="margin-top:5px; font-size:0.75rem; color:var(--accent-primary);">by \${sanitizeHTML(c.authorName)}</div>
        </div>
        <div style="padding: 0 8px 8px 8px; display:flex; justify-content:flex-end; gap:5px;">
           <button class="btn btn-xs btn-outline" style="font-size:0.6rem; padding:2px 6px;" onclick="reportClubContent('catch', '\${clubId}', '\${c.id}', '\${sanitizeHTML(c.species).replace(/'/g, '\\\\\\'')}', '\${sanitizeHTML(c.authorName)}')">Report</button>
           \${canDelete ? \`<button class="btn btn-xs btn-danger" style="font-size:0.6rem; padding:2px 6px;" onclick="deleteClubContent('catches', '\${clubId}', '\${c.id}')">Delete</button>\` : ''}
        </div>
      </div>
    \`).join('');
  });
  clubHubListeners.push(catchesRef);

  // Events
  const eventsRef = firebaseDB.ref('clubs/' + clubId + '/events');
  eventsRef.on('value', snap => {
    const list = document.getElementById('club-events-list');
    const data = snap.val();
    if (!data) {
      list.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No upcoming events or hunts.</p>';
      return;
    }
    const evts = Object.keys(data).map(k => ({...data[k], id: k})).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    list.innerHTML = evts.map(e => \`
      <div style="background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,0,0,0.2)); border-left: 4px solid var(--accent-primary); padding: 15px; border-radius: 8px;">
        <h4 style="margin: 0 0 5px 0; color: #fff;">\${sanitizeHTML(e.title)}</h4>
        <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">\${sanitizeHTML(e.description)}</p>
        <span style="display:block; margin-top: 10px; font-size: 0.75rem; color: var(--text-muted);">Posted \${new Date(e.timestamp).toLocaleDateString()}</span>
        <div style="text-align:right; margin-top:5px;">
           \${canDelete ? \`<button class="btn btn-xs btn-danger" style="font-size:0.6rem; padding:2px 6px;" onclick="deleteClubContent('events', '\${clubId}', '\${e.id}')">Delete</button>\` : ''}
        </div>
      </div>
    \`).join('');
  });
  clubHubListeners.push(eventsRef);
}

window.deleteClubContent = async (type, clubId, contentId) => {
  if (!confirm("Are you sure you want to delete this?")) return;
  try {
    await firebaseDB.ref('clubs/' + clubId + '/' + type + '/' + contentId).remove();
  } catch (err) {
    console.error(err);
    alert("Failed to delete.");
  }
};

window.reportClubContent = async (type, clubId, contentId, contentPreview, authorName) => {
  if (!state.user) return alert("You must be logged in to report.");
  const reason = prompt("Reason for reporting:");
  if (!reason) return;
  const report = {
    id: 'report_' + Date.now(),
    type: 'club_' + type,
    clubId: clubId,
    contentId: contentId,
    postText: contentPreview,
    postAuthor: authorName,
    reportedBy: state.user.name,
    reportedById: state.user.id || state.user.uid || state.user.email,
    reportReason: reason,
    reportDate: Date.now(),
    status: 'pending'
  };
  try {
    await firebaseDB.ref('reportedComments/' + report.id).set(report);
    alert("Reported successfully. Admins will review it.");
  } catch(e) {
    alert("Failed to report.");
  }
};
`;

const oldSetupClubListenersPattern = /function setupClubListeners\(clubId\) \{[\s\S]*?clubHubListeners\.push\(eventsRef\);\r?\n\}/;
js = js.replace(oldSetupClubListenersPattern, newSetupClubListeners);

fs.writeFileSync('app.js', js);
fs.writeFileSync('www/app.js', js);
