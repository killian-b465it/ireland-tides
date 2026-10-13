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
        if (window.currentUser && window.currentUser.isAdmin) {
            loadAdminTeamMembers();
        }
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
                ${m.passion ? `<div class="team-member-passion"><span class="passion-tag">❤️ ${m.passion}</span></div>` : ''}
                <div class="team-member-social-row">
                    ${buildSocialIcons(m)}
                </div>
            </div>
        </div>
    `).join('');
}

function buildSocialIcons(m) {
    const socials = [
        { key: 'instagram', icon: '📸', label: 'Instagram' },
        { key: 'facebook', icon: '📘', label: 'Facebook' },
        { key: 'youtube', icon: '▶️', label: 'YouTube' },
        { key: 'tiktok', icon: '🎵', label: 'TikTok' },
        { key: 'twitter', icon: '🐦', label: 'X/Twitter' },
    ];
    return socials
        .filter(s => m[s.key])
        .map(s => `<a href="${m[s.key]}" target="_blank" rel="noopener noreferrer" class="team-social-icon" title="${s.label}" onclick="event.stopPropagation()">${s.icon}</a>`)
        .join('');
}

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
        { key: 'instagram', icon: '📸', label: 'Instagram' },
        { key: 'facebook', icon: '📘', label: 'Facebook' },
        { key: 'youtube', icon: '▶️', label: 'YouTube' },
        { key: 'tiktok', icon: '🎵', label: 'TikTok' },
        { key: 'twitter', icon: '🐦', label: 'X/Twitter' },
    ].filter(s => m[s.key]);

    if (links.length) {
        socials.innerHTML = links.map(s => `
            <a href="${m[s.key]}" target="_blank" rel="noopener noreferrer" class="team-social-link">
                <span>${s.icon}</span><span>${s.label}</span>
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
