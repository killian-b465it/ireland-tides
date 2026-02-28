// ========================================
// Sponsor Management System - Refined
// ========================================

// State for sponsors
if (!window.state) window.state = {};
if (!window.state.sponsors) window.state.sponsors = [];
let editingSponsorId = null;
let currentSponsorWebsite = '';

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
    <div class="sponsor-card" onclick="openSponsorInfoModal('${sponsor.id}')">
      <img src="${sponsor.logoUrl}" alt="${sponsor.name}" class="sponsor-logo" onerror="this.src='assets/logo.png'">
      <h3 class="sponsor-name">${sponsor.name}</h3>
    </div>
  `).join('');
};

// Render sponsor banner on dashboard
window.renderSponsorBanner = () => {
    const wrapper = document.getElementById('sponsor-banner-wrapper');
    const track = document.getElementById('sponsor-banner-track');
    if (!wrapper || !track) return;

    if (window.state.sponsors.length === 0) {
        wrapper.style.display = 'none';
        return;
    }

    wrapper.style.display = 'block';

    // Build ONE set of sponsor items
    const buildItems = () => window.state.sponsors.map(sponsor => {
        const item = document.createElement('div');
        item.className = 'sponsor-banner-item';
        item.onclick = () => openSponsorInfoModal(sponsor.id);
        item.innerHTML = `<img src="${sponsor.logoUrl}" alt="${sponsor.name}" class="sponsor-banner-logo" onerror="this.src='assets/logo.png'">`;
        return item;
    });

    // Clear and render original set
    track.innerHTML = '';
    const originalItems = buildItems();
    originalItems.forEach(el => track.appendChild(el));

    // After layout paint, clone exact items for seamless loop tail
    requestAnimationFrame(() => {
        // Only clone if there are items to clone
        if (originalItems.length === 0) return;

        // Clone each original item and append as "infinite tail"
        originalItems.forEach(el => {
            const clone = el.cloneNode(true);
            clone.onclick = el.onclick;
            track.appendChild(clone);
        });

        // Calculate total width of one set and adjust animation duration
        // so speed is consistent regardless of sponsor count
        const itemWidth = originalItems[0].offsetWidth || 170;
        const gap = 32; // --space-xl ~= 32px
        const singleSetWidth = (itemWidth + gap) * originalItems.length;
        const speed = 80; // pixels per second
        const duration = Math.max(singleSetWidth / speed, 8); // minimum 8s

        track.style.animationDuration = `${duration}s`;
    });
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
      <td><a href="${sponsor.websiteUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary);">${sponsor.websiteUrl || 'N/A'}</a></td>
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
    document.getElementById('sponsor-logo-url').value = '';
    document.getElementById('sponsor-email-input').value = '';
    document.getElementById('sponsor-phone-input').value = '';
    document.getElementById('sponsor-website-input').value = '';
    document.getElementById('sponsor-description-input').value = '';
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
    document.getElementById('sponsor-logo-url').value = sponsor.logoUrl || '';
    document.getElementById('sponsor-email-input').value = sponsor.email || '';
    document.getElementById('sponsor-phone-input').value = sponsor.phone || '';
    document.getElementById('sponsor-website-input').value = sponsor.websiteUrl || '';
    document.getElementById('sponsor-description-input').value = sponsor.description || '';
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
    const logoUrl = document.getElementById('sponsor-logo-url').value.trim();
    const email = document.getElementById('sponsor-email-input').value.trim();
    const phone = document.getElementById('sponsor-phone-input').value.trim();
    const websiteUrl = document.getElementById('sponsor-website-input').value.trim();
    const description = document.getElementById('sponsor-description-input').value.trim();

    if (!name) {
        alert('Please enter a sponsor name');
        return;
    }

    if (!logoUrl) {
        alert('Please provide a logo URL');
        return;
    }

    // Basic URL validation
    try {
        new URL(logoUrl);
        if (websiteUrl) new URL(websiteUrl);
    } catch (e) {
        alert('Please enter valid URLs');
        return;
    }

    const saveBtn = document.getElementById('save-sponsor-btn');
    const originalBtnText = saveBtn.textContent;

    try {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const sponsorId = editingSponsorId || firebase.database().ref('sponsors').push().key;

        const sponsorData = {
            name,
            logoUrl: logoUrl,
            email,
            phone,
            websiteUrl,
            description,
            addedAt: editingSponsorId ? window.state.sponsors.find(s => s.id === editingSponsorId).addedAt : Date.now(),
            addedBy: window.currentUser ? window.currentUser.uid : 'unknown'
        };

        if (editingSponsorId) {
            await firebase.database().ref(`sponsors/${editingSponsorId}`).update(sponsorData);
            alert('Sponsor updated successfully!');
        } else {
            await firebase.database().ref(`sponsors/${sponsorId}`).set(sponsorData);
            alert('Sponsor added successfully!');
        }

        closeSponsorModal();
        await loadSponsors();
    } catch (error) {
        console.error('Error saving sponsor:', error);
        alert('Error saving sponsor: ' + error.message);
    } finally {
        saveBtn.textContent = originalBtnText;
        saveBtn.disabled = false;
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

// Open sponsor info modal
window.openSponsorInfoModal = (sponsorId) => {
    const sponsor = window.state.sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;

    currentSponsorWebsite = sponsor.websiteUrl;

    // Reset image state before loading new sponsor logo
    const logoImg = document.getElementById('sponsor-info-logo');
    const logoFallback = document.getElementById('sponsor-logo-fallback');
    logoImg.style.display = 'block';
    if (logoFallback) logoFallback.style.display = 'none';

    if (sponsor.logoUrl) {
        logoImg.src = sponsor.logoUrl;
        logoImg.onerror = () => {
            logoImg.style.display = 'none';
            if (logoFallback) logoFallback.style.display = 'flex';
        };
    } else {
        logoImg.src = '';
        logoImg.style.display = 'none';
        if (logoFallback) logoFallback.style.display = 'flex';
    }
    document.getElementById('sponsor-info-name').textContent = sponsor.name;

    // Description
    const descEl = document.getElementById('sponsor-info-description');
    if (sponsor.description) {
        descEl.textContent = sponsor.description;
        descEl.style.display = 'block';
    } else {
        descEl.style.display = 'none';
    }

    // Email
    const emailItem = document.getElementById('sponsor-contact-email');
    const emailLink = document.getElementById('sponsor-email-link');
    if (sponsor.email) {
        emailLink.href = `mailto:${sponsor.email}`;
        emailLink.textContent = sponsor.email;
        emailItem.style.display = 'flex';
    } else {
        emailItem.style.display = 'none';
    }

    // Phone
    const phoneItem = document.getElementById('sponsor-contact-phone');
    const phoneLink = document.getElementById('sponsor-phone-link');
    if (sponsor.phone) {
        phoneLink.href = `tel:${sponsor.phone}`;
        phoneLink.textContent = sponsor.phone;
        phoneItem.style.display = 'flex';
    } else {
        phoneItem.style.display = 'none';
    }

    // Website
    const websiteLink = document.getElementById('sponsor-website-link');
    if (sponsor.websiteUrl) {
        websiteLink.href = sponsor.websiteUrl;
        websiteLink.textContent = sponsor.websiteUrl;
        websiteLink.parentElement.style.display = 'flex';
    } else {
        websiteLink.parentElement.style.display = 'none';
    }

    document.getElementById('sponsor-info-modal').style.display = 'flex';
};

// Close sponsor info modal
window.closeSponsorInfoModal = () => {
    document.getElementById('sponsor-info-modal').style.display = 'none';
    currentSponsorWebsite = '';
};

// Visit sponsor website
window.visitSponsorWebsite = () => {
    if (currentSponsorWebsite) {
        window.open(currentSponsorWebsite, '_blank', 'noopener,noreferrer');
    }
};

// Auto-load sponsors when Firebase is ready
setTimeout(() => {
    if (typeof firebase !== 'undefined' && firebase.database) {
        loadSponsors();
    }
}, 2000);
