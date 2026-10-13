// ========================================
// IFH Team Management System
// ========================================

if (!window.state) window.state = {};
if (!window.state.teamMembers) window.state.teamMembers = [];
let editingTeamMemberId = null;

// ---- Tab Switching ----
window.switchTeamTab = (tab) => {
    ['core', 'angling', 'outdoor'].forEach(t => {
        const btn = document.getElementById(`team-tab-${t}`);
        const section = document.getElementById(`team-section-${t}`);
        if (btn) btn.classList.toggle('active', t === tab);
        if (section) section.style.display = t === tab ? '' : 'none';
    });
};

// ---- Load team members from Firebase ----
window.loadTeamMembers = async () => {
    try {
        const ref = firebase.database().ref('teamMembers');
        const snapshot = await ref.once('value');
        const data = snapshot.val() || {};
        window.state.teamMembers = Object.keys(data).map(id => ({ id, ...data[id] }));
        renderTeamGrids();
        loadAdminTeamMembers();
    } catch (err) {
        console.error('Error loading team members:', err);
    }
};

// ---- Render all team grids ----
window.renderTeamGrids = () => {
    renderTeamGrid('core', '🧑‍💼', 'No core team members added yet.');
    renderTeamGrid('angling', '🎣', 'No angling sponsors added yet.');
    renderTeamGrid('outdoor', '🏕️', 'No outdoor sponsors added yet.');
};

function renderTeamGrid(category, emoji, emptyMsg) {
    const grid = document.getElementById(`team-grid-${category}`);
    if (!grid) return;
    const members = window.state.teamMembers.filter(m => m.category === category);
    if (members.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${emoji}</div><p>${emptyMsg}</p></div>`;
        return;
    }
    grid.innerHTML = members.map(m => `
        <div class="team-member-card" onclick="openTeamMemberModal('${m.id}')">
            <div class="team-member-photo-wrap">
                ${m.photo
                    ? `<img src="${m.photo}" alt="${m.name}" class="team-member-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                       <div class="team-member-photo-fallback" style="display:none;">👤</div>`
                    : `<div class="team-member-photo-fallback">👤</div>`
                }
            </div>
            <div class="team-member-card-body">
                <h3 class="team-member-name">${m.name}</h3>
                <p class="team-member-role">${m.role || ''}</p>
            </div>
        </div>
    `).join('');
}

// Official SVG vector logos for social networks
const SOCIAL_ICONS = {
    instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)"/>
        <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 15.2C10.23 15.2 8.8 13.77 8.8 12C8.8 10.23 10.23 8.8 12 8.8C13.77 8.8 15.2 10.23 15.2 12C15.2 13.77 13.77 15.2 12 15.2ZM17.2 7.8C17.2 8.35 16.75 8.8 16.2 8.8C15.65 8.8 15.2 8.35 15.2 7.8C15.2 7.25 15.65 6.8 16.2 6.8C16.75 6.8 17.2 7.25 17.2 7.8Z" fill="white"/>
        <defs>
          <linearGradient id="ig-grad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFD600"/>
            <stop offset="0.5" stop-color="#FF0069"/>
            <stop offset="1" stop-color="#7638FA"/>
          </linearGradient>
        </defs>
    </svg>`,
    facebook: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>`,
    youtube: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>`,
    tiktok: `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.25 1.2 2.23 2.44 2.5 1.05.24 2.21-.03 2.99-.78.7-.63 1.11-1.57 1.12-2.52.01-4.74-.01-9.48.01-14.22z"/>
    </svg>`,
    twitter: `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>`
};

// ---- Open public team member modal ----
window.openTeamMemberModal = (id) => {
    const m = window.state.teamMembers.find(x => x.id === id);
    if (!m) return;

    const modal = document.getElementById('team-member-modal');
    const photoEl = document.getElementById('team-member-modal-photo');
    const fallbackEl = document.getElementById('team-member-modal-fallback');

    // Reset
    photoEl.style.display = 'block';
    fallbackEl.style.display = 'none';

    if (m.photo) {
        photoEl.src = m.photo;
        photoEl.onerror = () => { photoEl.style.display = 'none'; fallbackEl.style.display = 'flex'; };
    } else {
        photoEl.style.display = 'none';
        fallbackEl.style.display = 'flex';
    }

    document.getElementById('team-member-modal-title').textContent =
        m.category === 'core' ? '🧑‍💼 Core Team' :
        m.category === 'angling' ? '🎣 Angling Sponsor' : '🏕️ Outdoor Sponsor';

    document.getElementById('team-member-modal-name').textContent = m.name;
    document.getElementById('team-member-modal-role').textContent = m.role || '';

    const passionWrap = document.getElementById('team-member-modal-passion-wrap');
    if (m.passion) {
        document.getElementById('team-member-modal-passion').textContent = m.passion;
        passionWrap.style.display = 'flex';
    } else {
        passionWrap.style.display = 'none';
    }

    const bioEl = document.getElementById('team-member-modal-bio');
    if (m.bio) {
        bioEl.textContent = m.bio;
        bioEl.style.display = 'block';
    } else {
        bioEl.style.display = 'none';
    }

    const socials = document.getElementById('team-member-modal-socials');
    const links = [
        { key: 'instagram', label: 'Instagram' },
        { key: 'facebook', label: 'Facebook' },
        { key: 'youtube', label: 'YouTube' },
        { key: 'tiktok', label: 'TikTok' },
        { key: 'twitter', label: 'X (Twitter)' },
    ].filter(s => m[s.key]);

    if (links.length) {
        socials.innerHTML = links.map(s => `
            <a href="${m[s.key]}" target="_blank" rel="noopener noreferrer" class="team-social-link team-social-${s.key}">
                <span class="team-social-icon-box">${SOCIAL_ICONS[s.key] || '🔗'}</span>
                <span class="team-social-label">${s.label}</span>
                <span class="team-social-arrow">↗</span>
            </a>
        `).join('');
        socials.style.display = 'flex';
    } else {
        socials.innerHTML = '';
        socials.style.display = 'none';
    }

    modal.style.display = 'flex';
};

window.closeTeamMemberModal = () => {
    document.getElementById('team-member-modal').style.display = 'none';
};

// ---- Admin: Load table ----
window.loadAdminTeamMembers = () => {
    const tbody = document.getElementById('team-members-table-body');
    if (!tbody) return;
    if (window.state.teamMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No team members yet.</p></td></tr>';
        return;
    }
    const categoryLabel = { core: '🧑‍💼 Core Team', angling: '🎣 Angling', outdoor: '🏕️ Outdoor' };
    tbody.innerHTML = window.state.teamMembers.map(m => `
        <tr>
            <td><img src="${m.photo || ''}" alt="${m.name}" class="sponsor-table-logo" style="border-radius:50%;" onerror="this.style.display='none'"></td>
            <td>${m.name}</td>
            <td>${m.role || '—'}</td>
            <td>${categoryLabel[m.category] || m.category}</td>
            <td>${m.passion || '—'}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="editTeamMember('${m.id}')">✏️ Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTeamMember('${m.id}')">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
};

// ---- Photo upload helpers ----
window.previewTeamPhoto = (input) => {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
        alert('Photo must be under 5MB. Please choose a smaller image.');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('tm-photo-preview').src = e.target.result;
        document.getElementById('tm-photo-preview-wrap').style.display = 'flex';
        document.getElementById('tm-photo-placeholder').style.display = 'none';
        // Store the data URL temporarily for saving
        document.getElementById('tm-photo-data').value = e.target.result;
    };
    reader.readAsDataURL(file);
};

window.clearTeamPhoto = () => {
    document.getElementById('tm-photo-file').value = '';
    document.getElementById('tm-photo-data').value = '';
    document.getElementById('tm-photo-preview').src = '';
    document.getElementById('tm-photo-preview-wrap').style.display = 'none';
    document.getElementById('tm-photo-placeholder').style.display = 'flex';
};

function resetTeamPhotoUI() {
    clearTeamPhoto();
}

function loadExistingPhotoPreview(photoData) {
    if (!photoData) return;
    document.getElementById('tm-photo-preview').src = photoData;
    document.getElementById('tm-photo-preview-wrap').style.display = 'flex';
    document.getElementById('tm-photo-placeholder').style.display = 'none';
    // Pre-fill the hidden data so saving without re-uploading keeps existing photo
    document.getElementById('tm-photo-data').value = photoData;
}

// ---- Admin: Open add modal ----
window.openTeamMemberAdminModal = () => {
    editingTeamMemberId = null;
    document.getElementById('team-member-admin-title').textContent = '➕ Add Team Member';
    document.getElementById('save-team-member-btn').textContent = 'Add Member';
    ['tm-name','tm-role','tm-passion','tm-bio','tm-instagram','tm-facebook','tm-youtube','tm-tiktok','tm-twitter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('tm-category').value = 'core';
    resetTeamPhotoUI();
    document.getElementById('team-member-admin-modal').style.display = 'flex';
};

// ---- Admin: Open edit modal ----
window.editTeamMember = (id) => {
    const m = window.state.teamMembers.find(x => x.id === id);
    if (!m) return;
    editingTeamMemberId = id;
    document.getElementById('team-member-admin-title').textContent = '✏️ Edit Team Member';
    document.getElementById('save-team-member-btn').textContent = 'Save Changes';
    document.getElementById('tm-name').value = m.name || '';
    document.getElementById('tm-role').value = m.role || '';
    document.getElementById('tm-category').value = m.category || 'core';
    document.getElementById('tm-passion').value = m.passion || '';
    document.getElementById('tm-bio').value = m.bio || '';
    document.getElementById('tm-instagram').value = m.instagram || '';
    document.getElementById('tm-facebook').value = m.facebook || '';
    document.getElementById('tm-youtube').value = m.youtube || '';
    document.getElementById('tm-tiktok').value = m.tiktok || '';
    document.getElementById('tm-twitter').value = m.twitter || '';
    // Show existing photo in the upload area preview
    resetTeamPhotoUI();
    if (m.photo) loadExistingPhotoPreview(m.photo);
    document.getElementById('team-member-admin-modal').style.display = 'flex';
};

window.closeTeamMemberAdminModal = () => {
    document.getElementById('team-member-admin-modal').style.display = 'none';
    editingTeamMemberId = null;
};

// ---- Admin: Save ----
window.saveTeamMember = async () => {
    const name = document.getElementById('tm-name').value.trim();
    const role = document.getElementById('tm-role').value.trim();
    const category = document.getElementById('tm-category').value;
    const passion = document.getElementById('tm-passion').value.trim();
    const bio = document.getElementById('tm-bio').value.trim();
    const instagram = document.getElementById('tm-instagram').value.trim();
    const facebook = document.getElementById('tm-facebook').value.trim();
    const youtube = document.getElementById('tm-youtube').value.trim();
    const tiktok = document.getElementById('tm-tiktok').value.trim();
    const twitter = document.getElementById('tm-twitter').value.trim();

    // Photo: use newly uploaded file, or keep existing (from hidden field)
    let photo = document.getElementById('tm-photo-data').value.trim();

    // If a new file was selected, compress it first
    const fileInput = document.getElementById('tm-photo-file');
    if (fileInput.files && fileInput.files[0]) {
        const saveBtn = document.getElementById('save-team-member-btn');
        try {
            saveBtn.textContent = 'Compressing...';
            saveBtn.disabled = true;
            if (typeof compressImage === 'function') {
                photo = await compressImage(fileInput.files[0], 800);
            } else {
                // FileReader fallback
                photo = await new Promise((resolve, reject) => {
                    const r = new FileReader();
                    r.onload = e => resolve(e.target.result);
                    r.onerror = () => reject(new Error('Failed to read image'));
                    r.readAsDataURL(fileInput.files[0]);
                });
            }
        } catch (err) {
            saveBtn.textContent = 'Save Changes';
            saveBtn.disabled = false;
            alert('Image compression failed: ' + err.message);
            return;
        }
    }

    if (!name) { alert('Please enter a name'); return; }
    if (!role) { alert('Please enter a role or title'); return; }

    const saveBtn = document.getElementById('save-team-member-btn');
    const original = saveBtn.textContent;
    try {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        const id = editingTeamMemberId || firebase.database().ref('teamMembers').push().key;
        const existing = editingTeamMemberId ? window.state.teamMembers.find(x => x.id === editingTeamMemberId) : null;
        const data = {
            name, role, category, photo, passion, bio,
            instagram, facebook, youtube, tiktok, twitter,
            addedAt: existing ? existing.addedAt : Date.now(),
            addedBy: window.currentUser ? window.currentUser.uid : 'unknown'
        };
        if (editingTeamMemberId) {
            await firebase.database().ref(`teamMembers/${editingTeamMemberId}`).update(data);
            alert('Team member updated!');
        } else {
            await firebase.database().ref(`teamMembers/${id}`).set(data);
            alert('Team member added!');
        }
        closeTeamMemberAdminModal();
        await loadTeamMembers();
    } catch (err) {
        console.error('Error saving team member:', err);
        alert('Error saving: ' + err.message);
    } finally {
        saveBtn.textContent = original;
        saveBtn.disabled = false;
    }
};

// ---- Admin: Delete ----
window.deleteTeamMember = async (id) => {
    const m = window.state.teamMembers.find(x => x.id === id);
    if (!m) return;
    if (!confirm(`Delete ${m.name} from the team?`)) return;
    try {
        await firebase.database().ref(`teamMembers/${id}`).remove();
        alert('Team member deleted.');
        await loadTeamMembers();
    } catch (err) {
        console.error('Error deleting team member:', err);
        alert('Error deleting: ' + err.message);
    }
};

// ---- Auto-load on Firebase ready ----
setTimeout(() => {
    if (typeof firebase !== 'undefined' && firebase.database) {
        loadTeamMembers();
    }
}, 2200);
