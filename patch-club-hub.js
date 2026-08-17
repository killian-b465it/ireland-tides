
// ============================================
// Club Hub Logic
// ============================================

let currentClubId = null;
let clubHubListeners = [];

window.openClubHubModal = (clubId) => {
  currentClubId = clubId;
  const club = allClubs.find(c => c.id === clubId);
  if (!club) return;
  
  document.getElementById('club-hub-title').innerText = club.name + ' Hub';
  document.getElementById('club-hub-modal').classList.add('active');
  
  // Show Feed by default
  switchClubTab('feed');
  
  // Set up realtime listeners for this club
  setupClubListeners(clubId);
};

window.closeClubHubModal = () => {
  document.getElementById('club-hub-modal').classList.remove('active');
  // Detach listeners
  clubHubListeners.forEach(ref => ref.off());
  clubHubListeners = [];
  currentClubId = null;
};

window.switchClubTab = (tabId) => {
  document.querySelectorAll('.club-tab').forEach(t => {
    t.classList.remove('active');
    t.style.borderBottom = 'none';
    t.style.color = 'var(--text-muted)';
  });
  const activeBtn = document.getElementById('club-tab-' + tabId);
  activeBtn.classList.add('active');
  activeBtn.style.borderBottom = '2px solid var(--accent-primary)';
  activeBtn.style.color = 'var(--text-main)';

  document.querySelectorAll('.club-view').forEach(v => v.style.display = 'none');
  document.getElementById('club-view-' + tabId).style.display = 'block';

  const club = allClubs.find(c => c.id === currentClubId);
  const isOwner = club && state.user && club.ownerEmail === state.user.email;
  
  if (tabId === 'events') {
    document.getElementById('club-events-admin').style.display = isOwner ? 'block' : 'none';
  }
};

function setupClubListeners(clubId) {
  // Chat / Feed
  const chatRef = firebaseDB.ref('clubs/' + clubId + '/chat');
  chatRef.limitToLast(50).on('value', snap => {
    const chatList = document.getElementById('club-chat-list');
    const data = snap.val();
    if (!data) {
      chatList.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No messages yet. Say hi!</p>';
      return;
    }
    const msgs = Object.values(data).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    chatList.innerHTML = msgs.map(m => `
      <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
        <strong style="color: var(--accent-primary); font-size: 0.85rem;">${sanitizeHTML(m.authorName)}</strong>
        <span style="color: var(--text-muted); font-size: 0.7rem; float: right;">${new Date(m.timestamp).toLocaleString()}</span>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">${sanitizeHTML(m.text)}</p>
      </div>
    `).join('');
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
    const catches = Object.values(data).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    list.innerHTML = catches.map(c => `
      <div style="background: rgba(0,0,0,0.2); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
        ${c.photo ? `<img src="${c.photo}" style="width:100%; height:120px; object-fit:cover;" onclick="openImageModal('${c.photo}')">` : ''}
        <div style="padding: 8px;">
          <strong style="display:block; font-size:0.9rem; color:var(--text-main);">${sanitizeHTML(c.species)}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">${sanitizeHTML(c.weight)}</span>
          <div style="margin-top:5px; font-size:0.75rem; color:var(--accent-primary);">by ${sanitizeHTML(c.authorName)}</div>
        </div>
      </div>
    `).join('');
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
    const evts = Object.values(data).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    list.innerHTML = evts.map(e => `
      <div style="background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,0,0,0.2)); border-left: 4px solid var(--accent-primary); padding: 15px; border-radius: 8px;">
        <h4 style="margin: 0 0 5px 0; color: #fff;">${sanitizeHTML(e.title)}</h4>
        <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">${sanitizeHTML(e.description)}</p>
        <span style="display:block; margin-top: 10px; font-size: 0.75rem; color: var(--text-muted);">Posted ${new Date(e.timestamp).toLocaleDateString()}</span>
      </div>
    `).join('');
  });
  clubHubListeners.push(eventsRef);
}

window.postClubChat = async () => {
  if (!currentClubId || !state.user) return;
  const input = document.getElementById('club-chat-input');
  const text = input.value.trim();
  if (!text) return;

  const chatRef = firebaseDB.ref('clubs/' + currentClubId + '/chat').push();
  await chatRef.set({
    text,
    authorName: state.user.displayName || 'Angler',
    authorEmail: state.user.email,
    timestamp: new Date().toISOString()
  });
  input.value = '';
};

let currentCatchPhotoData = null;

window.openClubCatchModal = () => {
  document.getElementById('club-catch-species').value = '';
  document.getElementById('club-catch-weight').value = '';
  document.getElementById('club-catch-photo').value = '';
  currentCatchPhotoData = null;
  document.getElementById('club-catch-modal').classList.add('active');
};

document.getElementById('club-catch-photo').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    currentCatchPhotoData = event.target.result;
  };
  reader.readAsDataURL(file);
});

window.submitClubCatch = async () => {
  if (!currentClubId || !state.user) return;
  const species = document.getElementById('club-catch-species').value.trim();
  const weight = document.getElementById('club-catch-weight').value.trim();
  
  if (!species) return alert("Please enter the species!");

  const catchRef = firebaseDB.ref('clubs/' + currentClubId + '/catches').push();
  await catchRef.set({
    species,
    weight,
    photo: currentCatchPhotoData,
    authorName: state.user.displayName || 'Angler',
    authorEmail: state.user.email,
    timestamp: new Date().toISOString()
  });
  
  document.getElementById('club-catch-modal').classList.remove('active');
};

window.openCreateClubEventModal = () => {
  document.getElementById('club-event-title').value = '';
  document.getElementById('club-event-desc').value = '';
  document.getElementById('club-event-modal').classList.add('active');
};

window.submitClubEvent = async () => {
  if (!currentClubId || !state.user) return;
  const title = document.getElementById('club-event-title').value.trim();
  const desc = document.getElementById('club-event-desc').value.trim();
  
  if (!title) return alert("Please enter an event title!");

  const eventRef = firebaseDB.ref('clubs/' + currentClubId + '/events').push();
  await eventRef.set({
    title,
    description: desc,
    authorName: state.user.displayName || 'Angler',
    authorEmail: state.user.email,
    timestamp: new Date().toISOString()
  });
  
  document.getElementById('club-event-modal').classList.remove('active');
};
