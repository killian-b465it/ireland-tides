// ========================================
// Sponsor Management System
// ========================================

// State for sponsors
if (!window.state) window.state = {};
if (!window.state.sponsors) window.state.sponsors = [];
let editingSponsorId = null;

// Load sponsors from Firebase
window.loadSponsors = async () => {
    try {
        const sponsorsRef = firebase.database().ref('sponsors');
        const snapshot = await sponsorsRef.once('value');
        const sponsorsData = snapshot.val() || {};

        window.state.sponsors = Object.keys(sponsorsData).map(id => ({
            id,
            ...sponsorsData[id]
        }));

        renderSponsorsGrid();
        renderSponsorBanner();
        if (window.currentUser && window.currentUser.isAdmin) {
            loadAdminSponsors();
        }
    } catch (error) {
        console.error('Error loading sponsors:', error);
    }
};

// Render sponsors on public page
window.renderSponsorsGrid = () => {
    const grid = document.getElementById('sponsors-grid');
    if (!grid) return;

    if (window.state.sponsors.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No sponsors yet. Check back soon!</p></div>';
        return;
    }

    grid.innerHTML = window.state.sponsors.map(sponsor => `
    <a href="${sponsor.websiteUrl}" target="_blank" rel="noopener noreferrer" class="sponsor-card">
      <img src="${sponsor.logoUrl}" alt="${sponsor.name}" class="sponsor-logo" onerror="this.src='assets/logo.png'">
      <h3 class="sponsor-name">${sponsor.name}</h3>
    </a>
  `).join('');
};

// Load sponsors in admin table
window.loadAdminSponsors = () => {
    const tbody = document.getElementById('sponsors-table-body');
    if (!tbody) return;

    if (window.state.sponsors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No sponsors yet. Click "Add New Sponsor" to get started.</p></td></tr>';
        return;
    }

    tbody.innerHTML = window.state.sponsors.map(sponsor => `
    <tr>
      <td><img src="${sponsor.logoUrl}" alt="${sponsor.name}" class="sponsor-table-logo" onerror="this.src='assets/logo.png'"></td>
      <td>${sponsor.name}</td>
      <td><a href="${sponsor.websiteUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary);">${sponsor.websiteUrl}</a></td>
      <td>${new Date(sponsor.addedAt).toLocaleDateString('en-GB')}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editSponsor('${sponsor.id}')">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSponsor('${sponsor.id}')">🗑️ Delete</button>
      </td>
    </tr>
  `).join('');
};

// Open add sponsor modal
window.openAddSponsorModal = () => {
    editingSponsorId = null;
    document.getElementById('sponsor-modal-title').textContent = '➕ Add New Sponsor';
    document.getElementById('save-sponsor-btn').textContent = 'Add Sponsor';
    document.getElementById('sponsor-name-input').value = '';
    document.getElementById('sponsor-logo-input').value = '';
    document.getElementById('sponsor-website-input').value = '';
    document.getElementById('sponsor-modal').style.display = 'flex';
};

// Open edit sponsor modal
window.editSponsor = (sponsorId) => {
    const sponsor = window.state.sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;

    editingSponsorId = sponsorId;
    document.getElementById('sponsor-modal-title').textContent = '✏️ Edit Sponsor';
    document.getElementById('save-sponsor-btn').textContent = 'Save Changes';
    document.getElementById('sponsor-name-input').value = sponsor.name;
    document.getElementById('sponsor-logo-input').value = sponsor.logoUrl;
    document.getElementById('sponsor-website-input').value = sponsor.websiteUrl;
    document.getElementById('sponsor-modal').style.display = 'flex';
};

// Close sponsor modal
window.closeSponsorModal = () => {
    document.getElementById('sponsor-modal').style.display = 'none';
    editingSponsorId = null;
};

// Save sponsor (add or update)
window.saveSponsor = async () => {
    const name = document.getElementById('sponsor-name-input').value.trim();
    const logoUrl = document.getElementById('sponsor-logo-input').value.trim();
    const websiteUrl = document.getElementById('sponsor-website-input').value.trim();

    if (!name || !logoUrl || !websiteUrl) {
        alert('Please fill in all fields');
        return;
    }

    // Basic URL validation
    try {
        new URL(logoUrl);
        new URL(websiteUrl);
    } catch (e) {
        alert('Please enter valid URLs for logo and website');
        return;
    }

    try {
        const sponsorData = {
            name,
            logoUrl,
            websiteUrl,
            addedAt: editingSponsorId ? window.state.sponsors.find(s => s.id === editingSponsorId).addedAt : Date.now(),
            addedBy: window.currentUser.uid
        };

        if (editingSponsorId) {
            // Update existing sponsor
            await firebase.database().ref(`sponsors/${editingSponsorId}`).update(sponsorData);
            alert('Sponsor updated successfully!');
        } else {
            // Add new sponsor
            const newSponsorRef = firebase.database().ref('sponsors').push();
            await newSponsorRef.set(sponsorData);
            alert('Sponsor added successfully!');
        }

        closeSponsorModal();
        await loadSponsors();
    } catch (error) {
        console.error('Error saving sponsor:', error);
        alert('Error saving sponsor. Please try again.');
    }
};

// Delete sponsor
window.deleteSponsor = async (sponsorId) => {
    const sponsor = window.state.sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;

    if (!confirm(`Are you sure you want to delete ${sponsor.name}?`)) return;

    try {
        await firebase.database().ref(`sponsors/${sponsorId}`).remove();
        alert('Sponsor deleted successfully!');
        await loadSponsors();
    } catch (error) {
        console.error('Error deleting sponsor:', error);
        alert('Error deleting sponsor. Please try again.');
    }
};

// Auto-load sponsors when Firebase is ready
setTimeout(() => {
    if (typeof firebase !== 'undefined' && firebase.database) {
        loadSponsors();
    }
}, 2000);

// Render sponsor banner on dashboard (infinite scroll)
window.renderSponsorBanner = () => {
  const wrapper = document.getElementById('sponsor-banner-wrapper');
  const track = document.getElementById('sponsor-banner-track');
  if (!wrapper || !track) return;
  
  if (window.state.sponsors.length === 0) {
    wrapper.style.display = 'none';
    return;
  }
  
  // Show the banner
  wrapper.style.display = 'block';
  
  // Create sponsor items (duplicate for seamless loop)
  const sponsorItems = window.state.sponsors.map(sponsor => `
    <a href="${sponsor.websiteUrl}" target="_blank" rel="noopener noreferrer" class="sponsor-banner-item">
      <img src="${sponsor.logoUrl}" alt="${sponsor.name}" class="sponsor-banner-logo" onerror="this.src='assets/logo.png'">
    </a>
  `).join('');
  
  // Duplicate the items for seamless infinite scroll
  track.innerHTML = sponsorItems + sponsorItems;
};
