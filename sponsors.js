// ========================================
// Sponsor Management System - Enhanced
// ========================================

// State for sponsors
if (!window.state) window.state = {};
if (!window.state.sponsors) window.state.sponsors = [];
let editingSponsorId = null;
let selectedLogoFile = null;
let currentSponsorWebsite = '';

// Handle logo file selection
window.handleLogoFileSelect = (input) => {
    const file = input.files[0];
    if (file) {
        selectedLogoFile = file;
        document.getElementById('logo-file-name').textContent = file.name;
        // Clear URL input if file is selected
        document.getElementById('sponsor-logo-url').value = '';
    }
};

// Upload logo to Firebase Storage
async function uploadLogoToStorage(file, sponsorId) {
    try {
        // Check if Firebase Storage is available
        if (!firebase.storage) {
            console.error('Firebase Storage is not available');
            throw new Error('Firebase Storage is not configured. Please use a logo URL instead.');
        }

        console.log('Starting upload for:', file.name);
        const storageRef = firebase.storage().ref();
        const logoRef = storageRef.child(`sponsors/${sponsorId}/${file.name}`);

        console.log('Uploading to path:', `sponsors/${sponsorId}/${file.name}`);
        const snapshot = await logoRef.put(file);

        console.log('Upload complete, getting download URL...');
        const downloadURL = await snapshot.ref.getDownloadURL();

        console.log('Download URL obtained:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading logo:', error);
        console.error('Error details:', error.message, error.code);
        throw error;
    }
}

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

// Render sponsors on public page (click opens info modal)
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

// Render sponsor banner on dashboard (click opens info modal)
window.renderSponsorBanner = () => {
    const wrapper = document.getElementById('sponsor-banner-wrapper');
    const track = document.getElementById('sponsor-banner-track');
    if (!wrapper || !track) return;

    if (window.state.sponsors.length === 0) {
        wrapper.style.display = 'none';
        return;
    }

    wrapper.style.display = 'block';

    const sponsorItems = window.state.sponsors.map(sponsor => `
    <div class="sponsor-banner-item" onclick="openSponsorInfoModal('${sponsor.id}')">
      <img src="${sponsor.logoUrl}" alt="${sponsor.name}" class="sponsor-banner-logo" onerror="this.src='assets/logo.png'">
    </div>
  `).join('');

    track.innerHTML = sponsorItems + sponsorItems;
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
    selectedLogoFile = null;
    document.getElementById('sponsor-modal-title').textContent = '➕ Add New Sponsor';
    document.getElementById('save-sponsor-btn').textContent = 'Add Sponsor';
    document.getElementById('sponsor-name-input').value = '';
    document.getElementById('sponsor-logo-url').value = '';
    document.getElementById('sponsor-email-input').value = '';
    document.getElementById('sponsor-phone-input').value = '';
    document.getElementById('sponsor-website-input').value = '';
    document.getElementById('sponsor-description-input').value = '';
    document.getElementById('logo-file-name').textContent = 'No file selected';
    document.getElementById('sponsor-logo-file').value = '';
    document.getElementById('sponsor-modal').style.display = 'flex';
};

// Open edit sponsor modal
window.editSponsor = (sponsorId) => {
    const sponsor = window.state.sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;

    editingSponsorId = sponsorId;
    selectedLogoFile = null;
    document.getElementById('sponsor-modal-title').textContent = '✏️ Edit Sponsor';
    document.getElementById('save-sponsor-btn').textContent = 'Save Changes';
    document.getElementById('sponsor-name-input').value = sponsor.name;
    document.getElementById('sponsor-logo-url').value = sponsor.logoUrl || '';
    document.getElementById('sponsor-email-input').value = sponsor.email || '';
    document.getElementById('sponsor-phone-input').value = sponsor.phone || '';
    document.getElementById('sponsor-website-input').value = sponsor.websiteUrl;
    document.getElementById('sponsor-description-input').value = sponsor.description || '';
    document.getElementById('logo-file-name').textContent = 'No file selected';
    document.getElementById('sponsor-logo-file').value = '';
    document.getElementById('sponsor-modal').style.display = 'flex';
};

// Close sponsor modal
window.closeSponsorModal = () => {
    document.getElementById('sponsor-modal').style.display = 'none';
    editingSponsorId = null;
    selectedLogoFile = null;
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

    if (!selectedLogoFile && !logoUrl) {
        alert('Please upload a logo or provide a logo URL');
        return;
    }

    // Basic URL validation (only if URLs are provided)
    try {
        if (logoUrl) new URL(logoUrl);
        if (websiteUrl) new URL(websiteUrl);
    } catch (e) {
        alert('Please enter valid URLs');
        return;
    }

    try {
        const sponsorId = editingSponsorId || firebase.database().ref('sponsors').push().key;
        let finalLogoUrl = logoUrl;

        // Upload logo if file is selected
        if (selectedLogoFile) {
            const uploadBtn = document.getElementById('save-sponsor-btn');
            uploadBtn.textContent = 'Uploading...';
            uploadBtn.disabled = true;

            try {
                finalLogoUrl = await uploadLogoToStorage(selectedLogoFile, sponsorId);
            } catch (uploadError) {
                console.error('Upload error:', uploadError);
                uploadBtn.textContent = editingSponsorId ? 'Save Changes' : 'Add Sponsor';
                uploadBtn.disabled = false;
                alert('Error uploading logo. Please try using a URL instead or check your Firebase Storage configuration.');
                return;
            }

            uploadBtn.textContent = editingSponsorId ? 'Save Changes' : 'Add Sponsor';
            uploadBtn.disabled = false;
        }


        const sponsorData = {
            name,
            logoUrl: finalLogoUrl,
            email,
            phone,
            websiteUrl,
            description,
            addedAt: editingSponsorId ? window.state.sponsors.find(s => s.id === editingSponsorId).addedAt : Date.now(),
            addedBy: window.currentUser ? window.currentUser.uid : 'unknown'
        };

        console.log('Saving sponsor data:', sponsorData);

        try {
            if (editingSponsorId) {
                console.log('Updating sponsor:', editingSponsorId);
                await firebase.database().ref(`sponsors/${editingSponsorId}`).update(sponsorData);
                alert('Sponsor updated successfully!');
            } else {
                console.log('Creating new sponsor:', sponsorId);
                await firebase.database().ref(`sponsors/${sponsorId}`).set(sponsorData);
                alert('Sponsor added successfully!');
            }

            closeSponsorModal();
            await loadSponsors();
        } catch (dbError) {
            console.error('Database save error:', dbError);
            console.error('Error details:', dbError.message, dbError.code);
            alert('Error saving sponsor to database: ' + dbError.message);
        }
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

// Open sponsor info modal
window.openSponsorInfoModal = (sponsorId) => {
    const sponsor = window.state.sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;

    currentSponsorWebsite = sponsor.websiteUrl;

    document.getElementById('sponsor-info-logo').src = sponsor.logoUrl;
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
    websiteLink.href = sponsor.websiteUrl;
    websiteLink.textContent = sponsor.websiteUrl;

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
