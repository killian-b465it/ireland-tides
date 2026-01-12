/**
 * Ireland Tides - Real-Time Fishing Tide Data
 * Main Application Logic
 */

// ============================================
// Firebase Configuration (Cross-Device User Sync)
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyB1dhBLpKJdlkFVQ3R9lajHyuU2L_z_2b0",
  authDomain: "irish-fishing-hub.firebaseapp.com",
  databaseURL: "https://irish-fishing-hub-default-rtdb.firebaseio.com",
  projectId: "irish-fishing-hub",
  storageBucket: "irish-fishing-hub.firebasestorage.app",
  messagingSenderId: "975072154696",
  appId: "1:975072154696:web:d7fc268ea7e89ece63347d",
  measurementId: "G-ETMBTS4K96"
};


// Initialize Firebase
let firebaseApp = null;
let firebaseDB = null;

try {
  if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseDB = firebase.database();
    console.log('Firebase initialized for user sync');
  }
} catch (e) {
  console.warn('Firebase initialization skipped:', e.message);
}

// ============================================
// Configuration
// ============================================
const CONFIG = {
  apiBase: 'https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork',
  mapCenter: [53.5, -8.0],
  mapZoom: 7,
  updateInterval: 5 * 60 * 1000,
  // Station IDs must match Marine Ireland ERDDAP API exactly
  stations: [
    // East Coast - LIVE DATA
    { id: 'Dublin Port', name: 'Dublin Port', lat: 53.3478, lon: -6.2044, region: 'East Coast', live: true },
    { id: 'Howth Water Level 1', name: 'Howth Harbour', lat: 53.3897, lon: -6.0656, region: 'East Coast', live: true },
    { id: 'Skerries Harbour', name: 'Skerries', lat: 53.5822, lon: -6.1094, region: 'East Coast', live: true },
    { id: 'Wexford Harbour', name: 'Wexford', lat: 52.3369, lon: -6.4572, region: 'East Coast', live: true },
    { id: 'Rosslare', name: 'Rosslare', lat: 52.2533, lon: -6.3381, region: 'East Coast', live: true },

    // South Coast - LIVE DATA
    { id: 'Dunmore East Harbour', name: 'Dunmore East', lat: 52.1489, lon: -6.9903, region: 'South Coast', live: true },
    { id: 'Ballycotton Harbour', name: 'Ballycotton', lat: 51.8264, lon: -8.0089, region: 'South Coast', live: true },
    { id: 'Union Hall Harbor', name: 'Union Hall', lat: 51.5361, lon: -9.1372, region: 'South Coast', live: true },
    { id: 'Castletownbere Port', name: 'Castletownbere', lat: 51.6503, lon: -9.9108, region: 'South Coast', live: true },

    // South West - LIVE DATA
    { id: 'Dingle Harbour', name: 'Dingle', lat: 52.1408, lon: -10.2686, region: 'South West', live: true },
    { id: 'Kilrush Lough', name: 'Kilrush', lat: 52.6347, lon: -9.4872, region: 'South West', live: true },

    // West Coast - LIVE DATA
    { id: 'Galway Port', name: 'Galway', lat: 53.2707, lon: -9.0568, region: 'West Coast', live: true },
    { id: 'Kinvara - Unreferenced', name: 'Kinvara', lat: 53.1424, lon: -8.9389, region: 'West Coast', live: true },
    { id: 'Roonagh Pier', name: 'Roonagh (Clare Island)', lat: 53.7597, lon: -9.9036, region: 'West Coast', live: true },
    { id: 'Ballyglass Harbour', name: 'Ballyglass', lat: 54.2500, lon: -9.8833, region: 'West Coast', live: true },
    { id: 'Sligo', name: 'Sligo', lat: 54.2697, lon: -8.4761, region: 'West Coast', live: true },
    { id: 'Inishmore', name: 'Inis Mór (Aran Islands)', lat: 53.0647, lon: -9.6647, region: 'West Coast', live: true },

    // North West - LIVE DATA
    { id: 'Killybegs Port', name: 'Killybegs', lat: 54.6364, lon: -8.4400, region: 'North West', live: true },
    { id: 'Aranmore Island - Leabgarrow', name: 'Aranmore Island', lat: 54.9947, lon: -8.5214, region: 'North West', live: true },
    { id: 'Buncranna', name: 'Buncrana', lat: 55.1333, lon: -7.4500, region: 'North West', live: true },
    { id: 'Malin Head - Portmore Pier', name: 'Malin Head', lat: 55.3717, lon: -7.3392, region: 'North West', live: true },

    // Additional stations without live API data (estimates only)
    { id: 'Arklow', name: 'Arklow', lat: 52.7978, lon: -6.1419, region: 'East Coast', live: false },
    { id: 'Courtown', name: 'Courtown Harbour', lat: 52.6461, lon: -6.2289, region: 'East Coast', live: false },
    { id: 'Cobh', name: 'Cobh (Cork)', lat: 51.8503, lon: -8.2967, region: 'South Coast', live: false },
    { id: 'Kinsale', name: 'Kinsale', lat: 51.7058, lon: -8.5222, region: 'South Coast', live: false },
    { id: 'Schull', name: 'Schull', lat: 51.5278, lon: -9.5417, region: 'South Coast', live: false },
    { id: 'Bantry', name: 'Bantry', lat: 51.6803, lon: -9.4528, region: 'South West', live: false },
    { id: 'Fenit', name: 'Fenit', lat: 52.2728, lon: -9.8608, region: 'South West', live: false },
    { id: 'Tarbert', name: 'Tarbert', lat: 52.5747, lon: -9.3664, region: 'South West', live: false },
    { id: 'Rossaveal', name: 'Rossaveal', lat: 53.2667, lon: -9.8333, region: 'West Coast', live: false },
    { id: 'Clifden', name: 'Clifden', lat: 53.4897, lon: -10.0189, region: 'West Coast', live: false },
    { id: 'Westport', name: 'Westport', lat: 53.8008, lon: -9.5228, region: 'West Coast', live: false },
    // Northern Ireland - no live data from Marine.ie
    { id: 'Portrush', name: 'Portrush', lat: 55.2069, lon: -6.6556, region: 'North of Ireland', live: false },
    { id: 'Larne', name: 'Larne', lat: 54.8531, lon: -5.7928, region: 'North of Ireland', live: false },
    { id: 'Bangor', name: 'Bangor', lat: 54.6603, lon: -5.6689, region: 'North of Ireland', live: false },
    { id: 'Belfast', name: 'Belfast', lat: 54.6097, lon: -5.9289, region: 'North of Ireland', live: false },
    { id: 'Warrenpoint', name: 'Warrenpoint', lat: 54.0997, lon: -6.2519, region: 'North of Ireland', live: false },
    { id: 'Carlingford', name: 'Carlingford', lat: 54.0442, lon: -6.1883, region: 'North of Ireland', live: false }
  ],
  API_KEYS: {
    streetView: 'DEMO_KEY_PLACEHOLDER', // Replace with valid Google Maps API Key
    stripePublishable: 'pk_live_51PWJQERsc2tHXy0gV05ejlWaH6mwy4Xfqvfa7cSqUTdZaK6eFr4oEFYlXsZyeutnrlKzOmsRW7VDZkAQ4yO0XVu7004MBj4h9Q'
  },
  // Admin emails - users with these emails get admin access
  ADMIN_EMAILS: ['admin@irishtides.ie', 'support@irishtides.ie'],
  // Admin password - required for admin accounts
  ADMIN_PASSWORD: 'IrishTides2026!'
};

// ============================================
// Piers Data (Popular Fishing Piers)
// ============================================
const PIERS = [
  { name: 'Dun Laoghaire Pier', lat: 53.2946, lon: -6.1349 },
  { name: 'Howth West Pier', lat: 53.3905, lon: -6.0672 },
  { name: 'Bray Pier', lat: 53.2021, lon: -6.0908 },
  { name: 'Skerries Pier', lat: 53.5805, lon: -6.1089 },
  { name: 'Greystones Pier', lat: 53.1433, lon: -6.0639 },
  { name: 'Cobh Pier', lat: 51.8503, lon: -8.2967 },
  { name: 'Kinsale Pier', lat: 51.7058, lon: -8.5222 },
  { name: 'Galway Docks', lat: 53.2707, lon: -9.0568 },
  { name: 'Kilmore Quay Pier', lat: 52.1726, lon: -6.5857 },
  { name: 'Dunmore East Pier', lat: 52.1522, lon: -6.9944 },
  { name: 'Fenit Pier', lat: 52.2711, lon: -9.8667 },
  { name: 'Dingle Pier', lat: 52.1408, lon: -10.2686 },
  { name: 'Clifden Pier', lat: 53.4880, lon: -10.0217 },
  { name: 'Killybegs Pier', lat: 54.6347, lon: -8.4389 },
  { name: 'Portrush Pier', lat: 55.2064, lon: -6.6561 },
  // East Coast additions
  { name: 'Courtown Pier', lat: 52.6461, lon: -6.2289 },
  { name: 'Rush Pier', lat: 53.5231, lon: -6.0858 },
  { name: 'Laytown Pier', lat: 53.6853, lon: -6.2389 },
  { name: 'Clogherhead Pier', lat: 53.7894, lon: -6.2336 },
  { name: 'Wicklow Pier', lat: 52.9808, lon: -6.0333 },
  { name: 'Arklow Pier', lat: 52.7978, lon: -6.1419 },
  // South Coast additions
  { name: 'Youghal Pier', lat: 51.9547, lon: -7.8447 },
  { name: 'Ballycotton Pier', lat: 51.8289, lon: -8.0089 },
  { name: 'Union Hall Pier', lat: 51.5408, lon: -9.1389 },
  // West Coast additions
  { name: 'Rossaveal Pier', lat: 53.2689, lon: -9.5567 },
  { name: 'Roundstone Pier', lat: 53.3997, lon: -9.9239 },
  { name: 'Cleggan Pier', lat: 53.5603, lon: -10.1256 },
  { name: 'Westport Quay', lat: 53.7989, lon: -9.5247 },
  // North West additions
  { name: 'Downings Pier', lat: 55.1897, lon: -7.8328 },
  { name: 'Burtonport Pier', lat: 54.9897, lon: -8.4328 },
  // Northern Ireland
  { name: 'Bangor Pier', lat: 54.6603, lon: -5.6689 },
  { name: 'Donaghadee Pier', lat: 54.6419, lon: -5.5344 },
  { name: 'Ballycastle Pier', lat: 55.2064, lon: -6.2428 },
  { name: 'Carrickfergus Pier', lat: 54.7139, lon: -5.8064 },
  { name: 'Newcastle Pier', lat: 54.2103, lon: -5.8828 },
  { name: 'Ardglass Pier', lat: 54.2611, lon: -5.6056 },
  { name: 'Portavogie Pier', lat: 54.4586, lon: -5.4361 },
  { name: 'Kilkeel Pier', lat: 54.0617, lon: -5.9928 },
  { name: 'Cushendall Pier', lat: 55.0803, lon: -6.0542 },
  { name: 'Glenarm Pier', lat: 54.9686, lon: -5.9553 }
];

// ============================================
// Boat Ramps Data (Public Slipways)
// ============================================
const BOAT_RAMPS = [
  { name: 'Malahide Slipway', lat: 53.4503, lon: -6.1519 },
  { name: 'Skerries Slipway', lat: 53.5824, lon: -6.1064 },
  { name: 'Balbriggan Slipway', lat: 53.6103, lon: -6.1833 },
  { name: 'Howth Slipway', lat: 53.3875, lon: -6.0681 },
  { name: 'Dun Laoghaire Slipway', lat: 53.2897, lon: -6.1289 },
  { name: 'Arklow Slipway', lat: 52.7978, lon: -6.1419 },
  { name: 'Wexford Slipway', lat: 52.3336, lon: -6.4575 },
  { name: 'Dunmore East Slipway', lat: 52.1500, lon: -6.9933 },
  { name: 'Cobh Slipway', lat: 51.8489, lon: -8.2978 },
  { name: 'Kinsale Slipway', lat: 51.7050, lon: -8.5233 },
  { name: 'Fenit Slipway', lat: 52.2700, lon: -9.8656 },
  { name: 'Galway Slipway', lat: 53.2700, lon: -9.0600 },
  { name: 'Clifden Slipway', lat: 53.4889, lon: -10.0200 },
  { name: 'Killybegs Slipway', lat: 54.6339, lon: -8.4400 },
  { name: 'Malin Head Slipway', lat: 55.3757, lon: -7.3906 },
  // Northern Ireland
  { name: 'Bangor Marina Slipway', lat: 54.6622, lon: -5.6706 },
  { name: 'Donaghadee Slipway', lat: 54.6436, lon: -5.5339 },
  { name: 'Strangford Slipway', lat: 54.3675, lon: -5.5536 },
  { name: 'Portaferry Slipway', lat: 54.3803, lon: -5.5519 },
  { name: 'Kilkeel Slipway', lat: 54.0603, lon: -5.9933 },
  { name: 'Carlingford Marina Slipway', lat: 54.0442, lon: -6.1883 },
  { name: 'Warrenpoint Slipway', lat: 54.0997, lon: -6.2519 },
  { name: 'Portavogie Slipway', lat: 54.4578, lon: -5.4372 },
  { name: 'Ballycastle Slipway', lat: 55.2047, lon: -6.2417 }
];

// ============================================
// Harbours Data (Major Harbours)
// ============================================
const HARBOURS = [
  { name: 'Dublin Port', lat: 53.3478, lon: -6.2044 },
  { name: 'Cork Harbour', lat: 51.8503, lon: -8.2967 },
  { name: 'Galway Harbour', lat: 53.2707, lon: -9.0568 },
  { name: 'Waterford Harbour', lat: 52.2633, lon: -7.0911 },
  { name: 'Limerick Harbour', lat: 52.6639, lon: -8.6308 },
  { name: 'Drogheda Port', lat: 53.7189, lon: -6.3475 },
  { name: 'Rosslare Harbour', lat: 52.2536, lon: -6.3394 },
  { name: 'Dun Laoghaire Harbour', lat: 53.2946, lon: -6.1349 },
  { name: 'Howth Harbour', lat: 53.3905, lon: -6.0672 },
  { name: 'Killybegs Harbour', lat: 54.6347, lon: -8.4389 },
  { name: 'Greencastle Harbour', lat: 55.1997, lon: -6.9836 },
  { name: 'Castletownbere Harbour', lat: 51.6508, lon: -9.9106 },
  { name: 'Bantry Harbour', lat: 51.6839, lon: -9.4522 },
  { name: 'Schull Harbour', lat: 51.5286, lon: -9.5417 },
  { name: 'Baltimore Harbour', lat: 51.4828, lon: -9.3722 },
  // East Coast additions
  { name: 'Courtown Harbour', lat: 52.6461, lon: -6.2289 },
  { name: 'Wicklow Harbour', lat: 52.9808, lon: -6.0333 },
  { name: 'Arklow Harbour', lat: 52.7978, lon: -6.1419 },
  { name: 'Skerries Harbour', lat: 53.5805, lon: -6.1089 },
  { name: 'Balbriggan Harbour', lat: 53.6103, lon: -6.1833 },
  { name: 'Dundalk Harbour', lat: 53.9875, lon: -6.3833 },
  // South Coast additions
  { name: 'Youghal Harbour', lat: 51.9547, lon: -7.8447 },
  { name: 'Kinsale Harbour', lat: 51.7058, lon: -8.5222 },
  { name: 'Union Hall Harbour', lat: 51.5408, lon: -9.1389 },
  // West Coast additions
  { name: 'Westport Harbour', lat: 53.7989, lon: -9.5247 },
  { name: 'Sligo Harbour', lat: 54.2697, lon: -8.4694 },
  { name: 'Roundstone Harbour', lat: 53.3997, lon: -9.9239 },
  // Northern Ireland
  { name: 'Belfast Harbour', lat: 54.6097, lon: -5.9289 },
  { name: 'Bangor Marina', lat: 54.6622, lon: -5.6706 },
  { name: 'Larne Harbour', lat: 54.8531, lon: -5.8128 },
  { name: 'Portrush Harbour', lat: 55.2064, lon: -6.6561 },
  { name: 'Coleraine Marina', lat: 55.1333, lon: -6.6667 },
  { name: 'Ardglass Harbour', lat: 54.2611, lon: -5.6056 },
  { name: 'Portavogie Harbour', lat: 54.4586, lon: -5.4361 },
  { name: 'Kilkeel Harbour', lat: 54.0617, lon: -5.9928 },
  { name: 'Warrenpoint Harbour', lat: 54.0997, lon: -6.2519 },
  { name: 'Carlingford Marina', lat: 54.0442, lon: -6.1883 }
];

// ============================================
// State
// ============================================
let state = {
  map: null,
  communityMap: null,
  chart: null,
  selectedStation: null,
  markers: {},
  shopMarkers: null,
  pierMarkers: null,
  rampMarkers: null,
  harbourMarkers: null,
  activeFilters: { stations: true, shops: true, piers: true, ramps: true, harbours: true },
  tideData: {},
  isLoading: false,
  catches: [], // Will be loaded from Firebase
  currentModalLatLng: null,
  user: JSON.parse(localStorage.getItem('fishing_user') || sessionStorage.getItem('fishing_user') || 'null'),
  authMode: 'login', // 'login' or 'signup'
  allUsers: JSON.parse(localStorage.getItem('fishing_all_users') || '[]'),
  supportMessages: JSON.parse(localStorage.getItem('fishing_support_messages') || '[]'),
  currentReplyUserId: null
};

// ============================================
// Firebase Community Sync Functions
// ============================================
function syncCatchToFirebase(catchData) {
  if (!firebaseDB || !catchData || !catchData.id) return;

  try {
    const catchRef = firebaseDB.ref('catches/' + catchData.id);
    catchRef.set(catchData);
  } catch (e) {
    console.warn('Firebase catch sync failed:', e.message);
  }
}

function loadCatchesFromFirebase() {
  if (!firebaseDB) {
    // Fallback to localStorage if Firebase not available
    state.catches = JSON.parse(localStorage.getItem('fishing_catches') || '[]');
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    try {
      const catchesRef = firebaseDB.ref('catches');
      catchesRef.orderByChild('id').once('value', (snapshot) => {
        const catches = [];
        snapshot.forEach((childSnapshot) => {
          catches.push(childSnapshot.val());
        });
        // Sort by newest first
        state.catches = catches.sort((a, b) => b.id - a.id);
        resolve();
      }, (error) => {
        console.warn('Firebase catches load failed:', error.message);
        state.catches = JSON.parse(localStorage.getItem('fishing_catches') || '[]');
        resolve();
      });
    } catch (e) {
      console.warn('Firebase catches load error:', e.message);
      state.catches = JSON.parse(localStorage.getItem('fishing_catches') || '[]');
      resolve();
    }
  });
}

function syncMessageToFirebase(msg) {
  if (!firebaseDB || !msg || !msg.id) return;
  try {
    firebaseDB.ref('support_messages/' + msg.id).set(msg);
  } catch (e) {
    console.warn('Firebase message sync failed:', e.message);
  }
}

function loadMessagesFromFirebase() {
  if (!firebaseDB) return;
  const messagesRef = firebaseDB.ref('support_messages');
  messagesRef.on('value', (snapshot) => {
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      messages.push(childSnapshot.val());
    });
    state.supportMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
    localStorage.setItem('fishing_support_messages', JSON.stringify(state.supportMessages));

    // Refresh relevant UIs
    if (document.getElementById('page-admin').style.display === 'block') {
      loadAdminMessages();
    }
    if (document.getElementById('support-modal').classList.contains('active')) {
      renderUserSupportThread();
    }
    updateNotificationBadge();
  });
}

function updateCatchInFirebase(catchId, updates) {
  if (!firebaseDB) return;

  try {
    const catchRef = firebaseDB.ref('catches/' + catchId);
    catchRef.update(updates);
  } catch (e) {
    console.warn('Firebase catch update failed:', e.message);
  }
}

function syncUserToFirebase(user) {
  if (!firebaseDB || !user || !user.id) return;
  try {
    // Sanitize user object for Firebase (remove session specific flags if any)
    const data = { ...user };
    delete data.remember; // Don't sync remember me preference
    firebaseDB.ref('users/' + user.id).set(data);
  } catch (e) {
    console.warn('Firebase user sync failed:', e.message);
  }
}

function loadUsersFromFirebase(callback) {
  if (!firebaseDB) return;
  try {
    firebaseDB.ref('users').once('value', (snapshot) => {
      const users = [];
      snapshot.forEach((childSnapshot) => {
        users.push(childSnapshot.val());
      });
      if (callback) callback(users);
    });
  } catch (e) {
    console.warn('Firebase users load failed:', e.message);
  }
}

// ============================================
// Navigation Logic
// ============================================
window.showPage = (pageId) => {
  // Gating check for Community tab
  if (pageId === 'community') {
    const isPremium = state.user && state.user.plan === 'pro';
    const overlay = document.getElementById('community-gating-overlay');

    if (overlay) {
      if (!isPremium) {
        overlay.style.display = 'flex';
      } else {
        overlay.style.display = 'none';
      }
    }
  }

  // Admin page requires admin access
  if (pageId === 'admin' && !isAdmin()) {
    return showPage('home');
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.id === `nav-${pageId}`);
  });

  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
    page.classList.remove('active');
  });

  const activePage = document.getElementById(`page-${pageId}`);
  activePage.style.display = 'block';
  setTimeout(() => activePage.classList.add('active'), 10);

  if (pageId === 'home' && state.map) {
    setTimeout(() => state.map.invalidateSize(), 50);
  }
  if (pageId === 'community') {
    if (!state.communityMap) {
      initCommunityMap();
    } else {
      setTimeout(() => state.communityMap.invalidateSize(), 50);
    }
  }
  if (pageId === 'directory') {
    loadNationalDirectory();
  }
  if (pageId === 'admin') {
    loadAdminDashboard();
  }
};

// Check if current user is admin
function isAdmin() {
  return state.user && CONFIG.ADMIN_EMAILS.includes(state.user.email?.toLowerCase());
}

function updateClock() {
  const now = new Date();
  const options = {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  };
  const timeStr = now.toLocaleString('en-GB', options);
  const el = document.getElementById('current-time');
  if (el) el.innerText = timeStr;
}

// ============================================
// Subscription Verification Logic
// ============================================

/**
 * Check if Pro subscription is still valid based on billing cycle
 * Runs once per day on app load
 */
function verifySubscriptionStatus() {
  if (!state.user || state.user.plan !== 'pro') return;

  const now = Date.now();

  // Check for gifted Pro expiration
  if (state.user.proExpirationDate && now > state.user.proExpirationDate) {
    state.user.plan = 'free';
    state.user.proExpirationDate = null;
    state.user.subscriptionExpired = true;
    persistUserData();

    setTimeout(() => {
      alert('Your complimentary Pro access has expired. We hope you enjoyed it! You can upgrade anytime to keep Pro features.');
    }, 1000);
    return;
  }

  const lastVerified = state.user.lastVerifiedDate || 0;
  const todayStart = new Date().setHours(0, 0, 0, 0);

  // Only run verification once per day
  if (lastVerified >= todayStart) return;

  const cycleStart = state.user.subscriptionCycleStart;
  if (!cycleStart) {
    if (state.user.proExpirationDate) return; // Gifted pro doesn't use cycle tracking

    // Legacy Pro user without cycle tracking - set it now
    state.user.subscriptionCycleStart = now;
    state.user.proStartDate = state.user.proStartDate || now;
    state.user.lastVerifiedDate = now;
    persistUserData();
    return;
  }

  const daysSinceCycle = Math.floor((now - cycleStart) / (1000 * 60 * 60 * 24));

  // Subscription valid for 28-31 days (monthly billing)
  if (daysSinceCycle > 31) {
    // Subscription expired - downgrade to free
    state.user.plan = 'free';
    state.user.subscriptionExpired = true;
    persistUserData();

    // Show expiration notice after UI loads
    setTimeout(() => {
      alert('Your Pro subscription has expired. Please renew to continue enjoying Pro features.');
    }, 1000);
  } else {
    // Still valid - update last verified date
    state.user.lastVerifiedDate = now;
    persistUserData();
  }
}

/**
 * Helper to persist user data to appropriate storage
 */
function persistUserData() {
  if (!state.user) return;

  if (state.user.remember || localStorage.getItem('fishing_user')) {
    localStorage.setItem('fishing_user', JSON.stringify(state.user));
  } else {
    sessionStorage.setItem('fishing_user', JSON.stringify(state.user));
  }

  // Sync to Firebase for cross-device visibility
  syncUserToFirebase(state.user);
}

// ============================================
// Firebase User Sync Functions
// ============================================
function syncUserToFirebase(user) {
  if (!firebaseDB || !user || !user.id) return;

  try {
    const userRef = firebaseDB.ref('users/' + user.id);
    userRef.set({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      plan: user.plan || 'free',
      joinDate: user.joinDate || Date.now(),
      betaProUser: user.betaProUser || false,
      lastActive: Date.now()
    });
  } catch (e) {
    console.warn('Firebase sync failed:', e.message);
  }
}

function loadUsersFromFirebase(callback) {
  if (!firebaseDB) {
    callback([]);
    return;
  }

  try {
    const usersRef = firebaseDB.ref('users');
    usersRef.once('value', (snapshot) => {
      const users = [];
      snapshot.forEach((childSnapshot) => {
        users.push(childSnapshot.val());
      });
      callback(users);
    }, (error) => {
      console.warn('Firebase load failed:', error.message);
      callback([]);
    });
  } catch (e) {
    console.warn('Firebase load error:', e.message);
    callback([]);
  }
}

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize beta banner
  initBetaBanner();

  updateClock();
  setInterval(updateClock, 1000);
  initMap();
  loadStationList();
  startAutoUpdate();

  // Auto-grant Pro status during beta (free for all users)
  if (state.user && state.user.plan !== 'pro') {
    state.user.plan = 'pro';
    state.user.betaProUser = true; // Mark as beta user for later tracking
    persistUserData();
  }

  // Sync current user to Firebase on load
  if (state.user) {
    syncUserToFirebase(state.user);
  }

  // Verify Pro subscription status on app load (runs once daily)
  verifySubscriptionStatus();

  // Check for Stripe redirect results
  checkPaymentStatus();

  loadMessagesFromFirebase();

  updateAuthUI();
  showPage('home');

  // Dismiss loading screen after animation
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) loader.classList.add('hidden');
  }, 6500); // 1s delay + 5s fill animation
});

// Beta Banner Functions
function initBetaBanner() {
  const banner = document.getElementById('beta-banner');
  const dismissed = sessionStorage.getItem('beta_banner_dismissed');

  if (dismissed) {
    if (banner) banner.classList.add('hidden');
  } else {
    document.body.classList.add('has-beta-banner');
  }
}

window.closeBetaBanner = () => {
  const banner = document.getElementById('beta-banner');
  if (banner) {
    banner.classList.add('hidden');
    document.body.classList.remove('has-beta-banner');
    sessionStorage.setItem('beta_banner_dismissed', 'true');
  }
};

/**
 * Handle Stripe redirect parameters (success/cancel)
 */
function checkPaymentStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');

  if (paymentStatus === 'success') {
    if (state.user) {
      state.user.plan = 'pro';
      const now = Date.now();
      state.user.proStartDate = state.user.proStartDate || now;
      state.user.subscriptionCycleStart = now;
      state.user.lastVerifiedDate = now;
      state.user.subscriptionExpired = false;

      persistUserData();
      updateAuthUI();

      // Clean up URL parameters without reloading
      window.history.replaceState({}, document.title, window.location.pathname);

      alert('Welcome to Ireland Tides Pro! Your payment was successful.');
      showPage('community');
    }
  } else if (paymentStatus === 'cancel') {
    window.history.replaceState({}, document.title, window.location.pathname);
    alert('Payment cancelled. You can upgrade anytime from your profile.');
  }
}

// ============================================
// Main Map Functions
// ============================================
function initMap() {
  state.map = L.map('map', {
    zoomControl: true,
    attributionControl: true
  }).setView(CONFIG.mapCenter, CONFIG.mapZoom);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.map);

  // Create layer groups
  state.shopMarkers = L.layerGroup().addTo(state.map);
  state.pierMarkers = L.layerGroup().addTo(state.map);
  state.rampMarkers = L.layerGroup().addTo(state.map);

  // Add station markers
  CONFIG.stations.forEach(station => {
    addStationMarker(station);
  });

  // Add pier markers
  PIERS.forEach(pier => {
    const icon = L.divIcon({
      className: 'pier-marker-wrapper',
      html: `<div class="pier-marker" title="${pier.name}">🎣</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const marker = L.marker([pier.lat, pier.lon], { icon })
      .bindPopup(`
        <div class="popup-content">
          <strong>${pier.name}</strong>
          <span class="popup-type">Fishing Pier</span>
          <button class="popup-directions-btn" onclick="getDirections(${pier.lat}, ${pier.lon})">📍 Get Directions</button>
        </div>
      `);
    state.pierMarkers.addLayer(marker);
  });

  // Add boat ramp markers
  BOAT_RAMPS.forEach(ramp => {
    const icon = L.divIcon({
      className: 'ramp-marker-wrapper',
      html: `<div class="ramp-marker" title="${ramp.name}">🚤</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const marker = L.marker([ramp.lat, ramp.lon], { icon })
      .bindPopup(`
        <div class="popup-content">
          <strong>${ramp.name}</strong>
          <span class="popup-type">Boat Ramp / Slipway</span>
          <button class="popup-directions-btn" onclick="getDirections(${ramp.lat}, ${ramp.lon})">📍 Get Directions</button>
        </div>
      `);
    state.rampMarkers.addLayer(marker);
  });

  // Add harbour markers
  state.harbourMarkers = L.layerGroup().addTo(state.map);
  HARBOURS.forEach(harbour => {
    const icon = L.divIcon({
      className: 'harbour-marker-wrapper',
      html: `<div class="harbour-marker" title="${harbour.name}">⚓</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    const marker = L.marker([harbour.lat, harbour.lon], { icon })
      .bindPopup(`
        <div class="popup-content">
          <strong>${harbour.name}</strong>
          <span class="popup-type">Harbour</span>
          <button class="popup-directions-btn" onclick="getDirections(${harbour.lat}, ${harbour.lon})">📍 Get Directions</button>
        </div>
      `);
    state.harbourMarkers.addLayer(marker);
  });
}

// Open Google Maps with directions to coordinates
window.getDirections = (lat, lon) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  window.open(url, '_blank');
};

// ============================================
// Collapsible Filter Panel Functions
// ============================================
window.toggleFilterPanel = () => {
  const sidebar = document.getElementById('filter-sidebar');
  const overlay = document.getElementById('filter-overlay');

  if (sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }
};

window.closeFilterPanel = () => {
  const sidebar = document.getElementById('filter-sidebar');
  const overlay = document.getElementById('filter-overlay');

  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
};

window.applyFilters = () => {
  // Read checkbox states
  const filters = {
    stations: document.getElementById('filter-stations')?.checked ?? true,
    shops: document.getElementById('filter-shops')?.checked ?? true,
    piers: document.getElementById('filter-piers')?.checked ?? true,
    ramps: document.getElementById('filter-ramps')?.checked ?? true,
    harbours: document.getElementById('filter-harbours')?.checked ?? true
  };

  // Apply stations filter
  Object.values(state.markers).forEach(marker => {
    if (filters.stations) {
      marker.addTo(state.map);
    } else {
      state.map.removeLayer(marker);
    }
  });

  // Apply shops filter
  if (filters.shops) {
    state.shopMarkers.addTo(state.map);
  } else {
    state.map.removeLayer(state.shopMarkers);
  }

  // Apply piers filter
  if (filters.piers) {
    state.pierMarkers.addTo(state.map);
  } else {
    state.map.removeLayer(state.pierMarkers);
  }

  // Apply ramps filter
  if (filters.ramps) {
    state.rampMarkers.addTo(state.map);
  } else {
    state.map.removeLayer(state.rampMarkers);
  }

  // Apply harbours filter
  if (filters.harbours) {
    state.harbourMarkers.addTo(state.map);
  } else {
    state.map.removeLayer(state.harbourMarkers);
  }

  // Update state
  state.activeFilters = filters;

  // Close the panel
  closeFilterPanel();
};

// Toggle map filter layers
window.toggleMapFilter = (layerName) => {
  const btn = document.querySelector(`.filter-btn[data-layer="${layerName}"]`);
  state.activeFilters[layerName] = !state.activeFilters[layerName];

  if (btn) {
    btn.classList.toggle('active', state.activeFilters[layerName]);
  }

  switch (layerName) {
    case 'stations':
      Object.values(state.markers).forEach(marker => {
        if (state.activeFilters.stations) {
          marker.addTo(state.map);
        } else {
          state.map.removeLayer(marker);
        }
      });
      break;
    case 'shops':
      if (state.activeFilters.shops) {
        state.shopMarkers.addTo(state.map);
      } else {
        state.map.removeLayer(state.shopMarkers);
      }
      break;
    case 'piers':
      if (state.activeFilters.piers) {
        state.pierMarkers.addTo(state.map);
      } else {
        state.map.removeLayer(state.pierMarkers);
      }
      break;
    case 'ramps':
      if (state.activeFilters.ramps) {
        state.rampMarkers.addTo(state.map);
      } else {
        state.map.removeLayer(state.rampMarkers);
      }
      break;
    case 'harbours':
      if (state.activeFilters.harbours) {
        state.harbourMarkers.addTo(state.map);
      } else {
        state.map.removeLayer(state.harbourMarkers);
      }
      break;
  }
};


function addStationMarker(station) {
  const icon = L.divIcon({
    className: 'tide-marker-wrapper',
    html: `<div class="tide-marker ${station.status === 'offline' ? 'offline' : ''}" data-station="${station.id}">🌊</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const marker = L.marker([station.lat, station.lon], { icon })
    .addTo(state.map)
    .on('click', () => selectStation(station));

  state.markers[station.id] = marker;
}

function selectStation(station) {
  state.selectedStation = station;

  document.querySelectorAll('.tide-marker').forEach(el => el.classList.remove('active'));
  const activeMarker = document.querySelector(`.tide-marker[data-station="${station.id}"]`);
  if (activeMarker) activeMarker.classList.add('active');

  document.querySelectorAll('.station-item').forEach(el => {
    el.classList.toggle('active', el.dataset.station === station.id);
  });

  state.map.flyTo([station.lat, station.lon], 10, { duration: 0.5 });
  updateStationStatusUI(station.id, station.status || 'online');
  showTideCards();
  updateLocationInfo(station);

  if (station.status !== 'offline') {
    fetchTideData(station);
  } else {
    displayCalculatedTides(station);
  }

  fetchWeatherData(station);
  fetchNearbyShops(station);
}

// Fetch and display nearby fishing shops based on station region
function fetchNearbyShops(station) {
  const shopsCard = document.getElementById('shops-card');
  const shopList = document.getElementById('shop-list');

  if (!shopsCard || !shopList) return;

  // Show the shops card
  shopsCard.style.display = 'block';

  // Find shops in the same region as the station
  const stationRegion = station.region || 'East Coast';
  const nearbyShops = TACKLE_SHOPS.filter(shop => {
    // Match by region or find closest shops by distance
    return shop.county && stationRegion.toLowerCase().includes(shop.county.toLowerCase().split(' ')[0]) ||
      getDistanceKm(station.lat, station.lon, shop.lat, shop.lng || shop.lon) < 50;
  });

  // If no regional matches, get closest 3 shops by distance
  const shopsToShow = nearbyShops.length > 0 ? nearbyShops.slice(0, 5) :
    TACKLE_SHOPS
      .map(shop => ({
        ...shop,
        distance: getDistanceKm(station.lat, station.lon, shop.lat, shop.lng || shop.lon)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

  if (shopsToShow.length === 0) {
    shopList.innerHTML = '<div class="empty-state"><p>No fishing shops found in this area</p></div>';
    return;
  }

  shopList.innerHTML = shopsToShow.map(shop => {
    const lat = shop.lat;
    const lon = shop.lng || shop.lon;
    const distance = shop.distance || getDistanceKm(station.lat, station.lon, lat, lon);

    return `
      <div class="shop-item">
        <div class="shop-info">
          <strong>${shop.name}</strong>
          <span class="shop-address">${shop.address || shop.county}</span>
          ${shop.phone ? `<span class="shop-phone">📞 ${shop.phone}</span>` : ''}
          <span class="shop-distance">${distance.toFixed(1)} km away</span>
        </div>
        <button class="btn btn-sm btn-primary" onclick="getDirections(${lat}, ${lon})">📍 Directions</button>
      </div>
    `;
  }).join('');
}

// Calculate distance between two coordinates in kilometers
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


function showTideCards() {
  const cards = ['tide-card', 'weather-card', 'shops-card', 'tide-times-card', 'fishing-card', 'chart-card'];
  cards.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  });
}

function loadStationList() {
  const container = document.getElementById('station-list');
  const stationsByRegion = {};
  const now = new Date();

  CONFIG.stations.forEach(station => {
    const region = station.region || 'Other';
    if (!stationsByRegion[region]) stationsByRegion[region] = [];
    stationsByRegion[region].push(station);
  });

  const regions = Object.keys(stationsByRegion).sort();

  container.innerHTML = regions.map(region => {
    const stations = stationsByRegion[region].sort((a, b) => a.name.localeCompare(b.name));
    return `
      <div class="region-group">
        <div class="region-header" onclick="toggleRegion(this)">
          <span class="region-title">${region}</span>
          <span class="region-chevron">▼</span>
        </div>
        <div class="region-content">
          ${stations.map(station => {
      const { level, direction } = calculateTideLevel(now, station);
      const arrow = direction === 'rising' ? '↑' : direction === 'falling' ? '↓' : '';
      const liveIndicator = station.live ? '<span class="live-badge">LIVE</span>' : '';
      return `
              <div class="station-item" data-station="${station.id}" data-station-index="${CONFIG.stations.indexOf(station)}">
                <div class="station-indicator ${station.status === 'offline' ? 'offline' : ''}"></div>
                <span class="station-name">${station.name}${liveIndicator}</span>
                <span class="station-level" id="level-${station.id}">${level.toFixed(1)}m ${arrow}</span>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.addEventListener('click', (e) => {
    const stationItem = e.target.closest('.station-item');
    if (stationItem) {
      const idx = parseInt(stationItem.dataset.stationIndex, 10);
      if (!isNaN(idx) && CONFIG.stations[idx]) selectStation(CONFIG.stations[idx]);
    }
  });

  setInterval(updateAllStationLevels, 60000);
}

window.toggleRegion = (header) => {
  header.parentElement.classList.toggle('collapsed');
};

function updateAllStationLevels() {
  const now = new Date();
  CONFIG.stations.forEach(station => {
    const levelEl = document.getElementById(`level-${station.id}`);
    if (levelEl && !state.tideData[station.id]) {
      const { level, direction } = calculateTideLevel(now, station);
      const arrow = direction === 'rising' ? '↑' : direction === 'falling' ? '↓' : '';
      levelEl.textContent = `${level.toFixed(1)}m ${arrow}`;
    }
  });
}

function updateLocationInfo(station) {
  const container = document.getElementById('location-info');
  let maintHtml = '';

  if (station.status === 'offline') {
    const m = station.maintenance || { reason: 'Offline', duration: 'Unknown', restoration: 'TBD' };
    maintHtml = `
      <div class="maintenance-info fade-in">
        <div class="maintenance-icon">⚠️</div>
        <div class="maintenance-text">
          <div class="maintenance-title"><span class="maintenance-dot"></span>OFFLINE</div>
          <div class="maintenance-detail"><strong>Reason:</strong> ${m.reason}</div>
          <div class="maintenance-detail"><strong>Restoration:</strong> ${m.restoration}</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <h2 class="location-name">${station.name}</h2>
    <div class="location-coords">${station.lat.toFixed(4)}°N, ${Math.abs(station.lon).toFixed(4)}°W</div>
    ${maintHtml}
  `;
}

// ============================================
// Tide Data logic
// ============================================
async function fetchTideData(station) {
  const container = document.getElementById('tide-current');
  container.innerHTML = `<div class="loading"><div class="loading-spinner"></div><span>Loading...</span></div>`;

  // If station doesn't have live data, use calculated estimates directly
  if (station.live === false) {
    console.log(`${station.name}: No live API data available, using estimates.`);
    displayCalculatedTides(station);
    return;
  }

  try {
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const url = `${CONFIG.apiBase}.json?station_id,time,Water_Level_LAT&time>=${past24h.toISOString()}&orderBy("time")`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();

    // Use exact station ID matching
    const stationData = data.table.rows.filter(row => row[0] === station.id);

    if (stationData.length > 0) {
      state.tideData[station.id] = stationData;
      displayTideData(station, stationData);
      updateChart(stationData);
      updateFishingConditions(station, stationData);
    } else {
      console.warn(`No tide data found for ${station.id}, using estimate.`);
      displayCalculatedTides(station);
    }
  } catch (err) {
    console.error(`Failed to fetch tide data for ${station.id}:`, err);
    displayCalculatedTides(station);
  }
}

function displayTideData(station, data) {
  const container = document.getElementById('tide-current');
  const latest = data[data.length - 1];
  const level = latest[2];
  const time = new Date(latest[1]);

  let dir = 'stable';
  if (data.length >= 2) {
    const prev = data[data.length - 2][2];
    dir = level > prev ? 'rising' : level < prev ? 'falling' : 'stable';
  }

  const icon = dir === 'rising' ? '↑' : dir === 'falling' ? '↓' : '→';
  container.innerHTML = `
    <div class="tide-level">${level.toFixed(2)}<span class="tide-unit">m</span></div>
    <div class="tide-status ${dir}">${icon} ${dir.toUpperCase()}</div>
    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
      Updated: ${time.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
    </div>
  `;

  displayTideTimes(data);

  // Sync sidebar list with live data if it exists
  const sidebarLevel = document.getElementById(`level-${station.id}`);
  if (sidebarLevel) {
    sidebarLevel.innerHTML = `${level.toFixed(1)}m ${icon}`;
    sidebarLevel.classList.add('live-data-active'); // Optional: add class to show it's live
  }
}

function findTideExtremes(data) {
  const extremes = [];
  for (let i = 1; i < data.length - 1; i++) {
    const p = data[i - 1][2], c = data[i][2], n = data[i + 1][2];
    if (p === null || c === null || n === null) continue;
    if (c > p && c > n) extremes.push({ type: 'high', time: data[i][1], level: c });
    else if (c < p && c < n) extremes.push({ type: 'low', time: data[i][1], level: c });
  }
  return extremes;
}

function displayTideTimes(data) {
  const container = document.getElementById('tide-times');
  const extremes = findTideExtremes(data);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const display = extremes.filter(e => new Date(e.time) >= now).slice(0, 4);
  if (display.length === 0) {
    container.innerHTML = generateEstimatedTides(new Date()).map(t => `
      <div class="tide-time-item ${t.type}">
        <div class="tide-time-label">${t.type.toUpperCase()} TIDE</div>
        <div class="tide-time-value">${t.time}</div>
        <div class="tide-time-height">${t.height}</div>
      </div>
    `).join('');
    return;
  }

  container.innerHTML = display.map(e => `
    <div class="tide-time-item ${e.type}">
      <div class="tide-time-label">${e.type.toUpperCase()} TIDE</div>
      <div class="tide-time-value">${new Date(e.time).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</div>
      <div class="tide-time-height">${e.level.toFixed(2)}m</div>
    </div>
  `).join('');
}

function generateEstimatedTides(base) {
  const tides = [];
  const period = 6.2 * 60 * 60 * 1000;
  for (let i = 0; i < 4; i++) {
    const t = new Date(base.getTime() + i * period);
    tides.push({
      type: i % 2 === 0 ? 'high' : 'low',
      time: t.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }),
      height: i % 2 === 0 ? '~4.2m' : '~1.3m'
    });
  }
  return tides;
}

function calculateTideLevel(time, station) {
  const period = 12.42 * 60 * 60 * 1000;
  const mean = 2.5, amp = 1.8;
  const phase = station.lon * (period / 360);
  const t = time.getTime() + phase;
  const level = mean + amp * Math.cos(2 * Math.PI * t / period);
  const prevLevel = mean + amp * Math.cos(2 * Math.PI * (t - 60000) / period);
  const dir = level > prevLevel + 0.001 ? 'rising' : level < prevLevel - 0.001 ? 'falling' : 'stable';
  return { level, direction: dir };
}

function displayCalculatedTides(station) {
  const container = document.getElementById('tide-current');
  const now = new Date();
  const { level, direction } = calculateTideLevel(now, station);
  const icon = direction === 'rising' ? '↑' : direction === 'falling' ? '↓' : '→';

  container.innerHTML = `
    <div class="tide-level">${level.toFixed(2)}<span class="tide-unit">m</span></div>
    <div class="tide-status ${direction}">${icon} ${direction.toUpperCase()}</div>
    <div style="font-size: 0.75rem; color: var(--accent-warning); margin-top: 8px;">⚠️ Estimated</div>
  `;
  displayTideTimes([]);
  updateCalculatedChart(station);
  updateFishingConditions(station, null);
}

// ============================================
// Weather logic
// ============================================
async function fetchWeatherData(station) {
  const container = document.getElementById('weather-display');
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m`;
    const res = await fetch(url);
    const data = await res.json();
    displayWeatherData(data.current);
  } catch (err) {
    console.warn(`Weather fetch failed for ${station.id}:`, err);
    container.innerHTML = `
      <div class="error-message fade-in">
        <span>⚠️ Weather unavailable</span>
        <button class="btn btn-sm btn-outline" onclick="fetchWeatherData(state.selectedStation)" style="margin-top:8px">Retry</button>
      </div>`;
  }
}

function displayWeatherData(d) {
  const container = document.getElementById('weather-display');
  const w = mapWeatherCode(d.weather_code);
  container.innerHTML = `
    <div class="weather-main fade-in">
      <div class="weather-temp-section">
        <div class="weather-icon">${w.icon}</div>
        <div>
          <div class="weather-temp">${Math.round(d.temperature_2m)}°C</div>
          <div class="weather-condition">${w.description}</div>
          <div class="weather-label">Feels like ${Math.round(d.apparent_temperature)}°C</div>
        </div>
      </div>
    </div>
    <div class="weather-grid fade-in" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
      <div class="weather-item">
        <span class="weather-label">Wind</span>
        <span class="weather-value"><span style="display:inline-block; transform:rotate(${d.wind_direction_10m}deg)">⬆</span> ${Math.round(d.wind_speed_10m)} km/h</span>
      </div>
      <div class="weather-item">
        <span class="weather-label">Humidity</span>
        <span class="weather-value">${d.relative_humidity_2m}%</span>
      </div>
    </div>
  `;
}

function mapWeatherCode(c) {
  const map = { 0: '☀️ Clear', 1: '🌤️ Mostly Clear', 2: '⛅ Partly Cloudy', 3: '☁️ Overcast', 45: '🌫️ Fog', 51: '🌦️ Drizzle', 61: '🌧️ Rain', 80: '🌦️ Showers', 95: '⛈️ Storm' };
  const desc = map[c] || ' Normal';
  return { icon: desc.split(' ')[0], description: desc.split(' ').slice(1).join(' ') };
}

// ============================================
// Charts & Conditions logic
// ============================================
function updateChart(data) {
  const ctx = document.getElementById('tide-chart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(r => new Date(r[1]).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })),
      datasets: [{ label: 'Water Level (m)', data: data.map(r => r[2]), borderColor: '#00d4ff', backgroundColor: 'rgba(0, 212, 255, 0.1)', fill: true, tension: 0.4, pointRadius: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 6, color: '#5a7a94' } }, y: { ticks: { color: '#5a7a94' } } } }
  });
}

function updateCalculatedChart(station) {
  const ctx = document.getElementById('tide-chart').getContext('2d');
  if (state.chart) state.chart.destroy();
  const now = new Date();
  const labels = [], levels = [];
  for (let i = -12; i <= 12; i++) {
    const t = new Date(now.getTime() + i * 3600000);
    labels.push(t.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }));
    levels.push(calculateTideLevel(t, station).level);
  }
  state.chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Estimated (m)', data: levels, borderColor: '#ffab00', fill: false, borderDash: [5, 5], tension: 0.4, pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 6, color: '#5a7a94' } } } }
  });
}

function updateFishingConditions(station, data) {
  const now = new Date();
  const moon = SunCalc.getMoonIllumination(now);
  let score = 50;
  if (moon.phase < 0.1 || moon.phase > 0.9 || (moon.phase > 0.4 && moon.phase < 0.6)) score += 20;
  const h = now.getHours();
  if ((h >= 5 && h <= 8) || (h >= 17 && h <= 20)) score += 20;
  score = Math.min(100, score);

  let rating = score > 80 ? 'Excellent' : score > 60 ? 'Good' : 'Fair';
  let rClass = rating.toLowerCase();

  const scoreEl = document.getElementById('fishing-score');
  if (scoreEl) {
    scoreEl.innerHTML = `
      <div class="score-circle ${rClass}">${score}</div>
      <div class="score-details">
        <div class="score-label">${rating} Conditions</div>
        <div class="score-factors"><span class="factor-tag">Tidal Flow</span><span class="factor-tag">Moon Phase</span></div>
      </div>
    `;
  }

  const moonEl = document.getElementById('moon-phase');
  if (moonEl) {
    moonEl.innerHTML = `
      <div class="moon-icon">🌖</div>
      <div class="moon-info">
        <div class="moon-name">Moon Phase</div>
        <div class="moon-detail">${Math.round(moon.fraction * 100)}% illuminated</div>
      </div>
    `;
  }
}

// ============================================
// Bait Shops logic
// ============================================
window.openShopDetails = (lat, lon, name, street, city, phone) => {
  const modal = document.getElementById('shop-details-modal');
  const img = document.getElementById('street-view-image');
  const loading = document.getElementById('sv-loading');
  const fallback = document.getElementById('sv-fallback');
  const dirBtn = document.getElementById('shop-details-directions-btn');

  img.style.display = 'none';
  loading.style.display = 'flex';
  fallback.style.display = 'none';

  document.getElementById('shop-details-name').innerText = name || 'Tackle Shop';
  document.getElementById('shop-details-address').innerText = `📍 ${street ? street + ', ' : ''}${city || 'Ireland'}`;
  document.getElementById('shop-details-phone').innerText = phone ? `📞 ${phone}` : '📞 Phone not available';

  dirBtn.onclick = () => getDirections(lat, lon);

  // Street View Static Image URL
  // Street View Logic with improved fallback
  const apiKey = CONFIG.API_KEYS.streetView;
  const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${lat},${lon}&fov=90&heading=0&pitch=0&key=${apiKey}`;

  img.src = svUrl;

  // If no valid key or error, ensure fallback shows
  img.onerror = () => {
    loading.style.display = 'none';
    img.style.display = 'none';
    fallback.style.display = 'flex';
  };

  // If using placeholder, trigger error handler manually after timeout if it doesn't fail fast
  if (apiKey.includes('PLACEHOLDER')) {
    setTimeout(() => img.onerror(), 500);
  }

  modal.classList.add('active');
};

window.closeShopDetails = () => {
  document.getElementById('shop-details-modal').classList.remove('active');
};

async function fetchNearbyShops(station) {
  const container = document.getElementById('shop-list');
  if (state.shopMarkers) state.shopMarkers.clearLayers();
  container.innerHTML = `<div class="loading"><div class="loading-spinner"></div><span>Searching...</span></div>`;

  try {
    const q = `[out:json][timeout:25];(node["shop"="fishing"](around:20000,${station.lat},${station.lon});way["shop"="fishing"](around:20000,${station.lat},${station.lon}););out body center;`;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
    const data = await res.json();
    displayShops(station, data.elements);

  } catch (err) {
    console.error('Shop search failed:', err);
    container.innerHTML = `
      <div class="error-message fade-in">
        <p>Could not search for local shops.</p>
        <button class="btn btn-sm btn-outline" onclick="fetchNearbyShops(state.selectedStation)" style="margin-top:8px">Retry</button>
      </div>`;
  }
}

function displayShops(station, shops) {
  const container = document.getElementById('shop-list');
  if (!shops || shops.length === 0) {
    container.innerHTML = `<p style="padding:15px; color:var(--text-muted)">No specialized tackle shops found within 20km.</p>`;
    return;
  }

  const sorted = shops.map(s => {
    const lat = s.lat || s.center.lat, lon = s.lon || s.center.lon;
    return { ...s, lat, lon, dist: calculateDistance(station.lat, station.lon, lat, lon) };
  }).sort((a, b) => a.dist - b.dist);

  container.innerHTML = sorted.map(s => {
    addShopMarker(s);
    const email = tags.email || '';

    return `
      <div class="shop-item fade-in" onclick="openShopDetails(${s.lat}, ${s.lon}, '${name.replace(/'/g, "\\'")}', '${street.replace(/'/g, "\\'")}', '${city.replace(/'/g, "\\'")}', '${phone}', '${email}')">
        <span class="shop-name">${name}</span>
        <div class="shop-detail">
          <span class="shop-dist">${s.dist.toFixed(1)} km</span>
          <span>${street || 'Local area'}</span>
        </div>
        <div class="shop-actions">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); getDirections(${s.lat},${s.lon})">Directions</button>
        </div>
      </div>
    `;
  }).join('');
}

function addShopMarker(s) {
  const icon = L.divIcon({ className: 'shop-marker', html: '🎣', iconSize: [24, 24], iconAnchor: [12, 12] });
  L.marker([s.lat, s.lon], { icon }).bindPopup(`<strong>${s.tags.name || 'Tackle Shop'}</strong>`).addTo(state.shopMarkers);
}

window.getDirections = (lat, lon) => {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function updateStationStatusUI(id, status) {
  const ind = document.querySelector(`.station-item[data-station="${id}"] .station-indicator`);
  if (ind) ind.classList.toggle('offline', status === 'offline');
}

function startAutoUpdate() {
  setInterval(() => { if (state.selectedStation) fetchTideData(state.selectedStation); }, CONFIG.updateInterval);
}

// ============================================
// Community Logic
// ============================================
function initCommunityMap() {
  state.communityMap = L.map('social-map').setView([53.5, -8], 7);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.communityMap);
  state.communityMap.on('click', e => {
    state.currentModalLatLng = e.latlng;
    document.getElementById('catch-modal').classList.add('active');
  });
  loadCommunityCatches();
}

window.closeModal = () => {
  document.getElementById('catch-modal').classList.remove('active');
  document.getElementById('catch-photo').value = '';
  removeImage();
};

window.previewImage = (input) => {
  const preview = document.getElementById('image-preview');
  const img = document.getElementById('preview-img');

  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.removeImage = () => {
  document.getElementById('catch-photo').value = '';
  document.getElementById('image-preview').style.display = 'none';
  document.getElementById('preview-img').src = '';
};

window.submitCatch = () => {
  if (!state.user || state.user.plan !== 'pro') {
    closeModal();
    return openPremiumModal();
  }

  const sp = document.getElementById('catch-species').value;
  const dt = document.getElementById('catch-details').value;
  const photoInput = document.getElementById('catch-photo');

  if (!sp) return alert('Enter species!');

  const processCatch = (photoData) => {
    const c = {
      id: Date.now(),
      species: sp,
      details: dt,
      lat: state.currentModalLatLng.lat,
      lng: state.currentModalLatLng.lng,
      date: new Date().toLocaleDateString('en-GB'),
      author: state.user.name,
      authorId: state.user.id,
      photo: photoData,
      likes: 0,
      likedBy: [],
      comments: []
    };

    // Sync to Firebase for cross-device visibility
    syncCatchToFirebase(c);

    closeModal();
    // Note: renderCatchFeed and markers will be updated by the ref.on('value') listener automatically
  };

  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => processCatch(e.target.result);
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    processCatch(null);
  }
};

// Layer group for community markers
let communityMarkerGroup = null;


function loadCommunityCatches() {
  if (!firebaseDB) {
    // Fallback if Firebase fails
    state.catches = JSON.parse(localStorage.getItem('fishing_catches') || '[]');
    state.catches.forEach(addCommunityMarker);
    renderCatchFeed();
    return;
  }

  // Clear existing feed and markers if any
  if (communityMarkerGroup) {
    communityMarkerGroup.clearLayers();
  } else if (state.communityMap) {
    communityMarkerGroup = L.layerGroup().addTo(state.communityMap);
  }

  // Real-time listener for catches
  const catchesRef = firebaseDB.ref('catches');
  catchesRef.on('value', (snapshot) => {
    const catches = [];
    snapshot.forEach((childSnapshot) => {
      catches.push(childSnapshot.val());
    });

    // Update local state with latest data and sort by newest
    state.catches = catches.sort((a, b) => b.id - a.id);

    // Also update backup localStorage
    localStorage.setItem('fishing_catches', JSON.stringify(state.catches));

    // Refresh UI
    if (communityMarkerGroup) {
      communityMarkerGroup.clearLayers();
    }

    state.catches.forEach(addCommunityMarker);
    renderCatchFeed();
  });
}

function addCommunityMarker(c) {
  if (!state.communityMap || !communityMarkerGroup) return;

  const icon = L.divIcon({
    className: 'social-marker',
    html: '📸',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const marker = L.marker([c.lat, c.lng], { icon })
    .bindPopup(`<strong>${c.species}</strong><br>${c.date}<br>${c.details}`);

  communityMarkerGroup.addLayer(marker);
}

function renderCatchFeed() {
  const container = document.getElementById('catch-feed');
  if (state.catches.length === 0) return;

  container.innerHTML = state.catches.map(c => {
    const isLiked = c.likedBy && state.user && c.likedBy.includes(state.user.id);
    return `
      <div class="catch-card fade-in">
        <div class="catch-header">
          <span class="catch-species">${c.species}</span>
          <span class="catch-date">${c.date}</span>
        </div>
        <div class="catch-author">By ${c.author || 'Member'}</div>
        ${c.photo ? `<img src="${c.photo}" class="catch-image" alt="${c.species}">` : ''}
        <p class="catch-details">${c.details}</p>
        
        <div class="catch-card-actions">
          <button class="social-btn ${isLiked ? 'liked' : ''}" onclick="likeCatch(${c.id})">
            ${isLiked ? '❤️' : '🤍'} ${c.likes || 0}
          </button>
          <button class="social-btn" onclick="toggleComments(${c.id})">
            💬 ${c.comments ? c.comments.length : 0}
          </button>
        </div>

        <div id="comments-${c.id}" class="comments-section">
          <div class="comment-list">
            ${(c.comments || []).map(comment => `
              <div class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">${comment.author}</span>
                  <span class="comment-date">${comment.date}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
              </div>
            `).join('')}
            ${(!c.comments || c.comments.length === 0) ? '<p style="color:var(--text-muted); font-size:0.8rem;">No comments yet.</p>' : ''}
          </div>
          <div class="comment-input-area">
            <input type="text" id="input-${c.id}" class="comment-input" placeholder="Add a comment..." onkeypress="handleCommentKey(event, ${c.id})">
            <button class="btn btn-primary btn-sm" onclick="postComment(${c.id})">Post</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleComments = (id) => {
  const el = document.getElementById(`comments-${id}`);
  if (el) el.classList.toggle('active');
};

window.handleCommentKey = (e, id) => {
  if (e.key === 'Enter') postComment(id);
};

window.postComment = (id) => {
  if (!state.user || state.user.plan !== 'pro') return openPremiumModal();

  const input = document.getElementById(`input-${id}`);
  const text = input.value.trim();
  if (!text) return;

  const targetCatch = state.catches.find(c => c.id === id);
  if (targetCatch) {
    if (!targetCatch.comments) targetCatch.comments = [];
    targetCatch.comments.push({
      author: state.user.name,
      authorId: state.user.id,
      text: text,
      date: new Date().toLocaleDateString('en-GB')
    });

    // Sync to Firebase for cross-device visibility
    updateCatchInFirebase(id, { comments: targetCatch.comments });

    // Also save to localStorage as backup
    localStorage.setItem('fishing_catches', JSON.stringify(state.catches));

    input.value = '';
    renderCatchFeed();

    // Re-open comments for this item so user sees their comment
    setTimeout(() => {
      const commentsSection = document.getElementById(`comments-${id}`);
      if (commentsSection) commentsSection.classList.add('active');
    }, 50);
  }
};



// ============================================
// Auth & Subscription Logic
// ============================================
window.openAuthModal = () => {
  state.authMode = 'login';
  updateAuthModalContent();
  document.getElementById('auth-modal').classList.add('active');
};

window.closeAuthModal = () => document.getElementById('auth-modal').classList.remove('active');

window.toggleAuthMode = () => {
  state.authMode = state.authMode === 'login' ? 'signup' : 'login';
  updateAuthModalContent();
};

function updateAuthModalContent() {
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  const btn = document.querySelector('.auth-form-container .btn-primary');
  const switchTarget = document.querySelector('.auth-switch a');
  const usernameInput = document.getElementById('auth-username');

  if (state.authMode === 'login') {
    title.innerText = 'Welcome Back';
    sub.innerText = 'Log in to your account';
    btn.innerText = 'Log In';
    if (usernameInput) usernameInput.style.display = 'none';
    switchTarget.parentElement.innerHTML = `Don't have an account? <a href="#" onclick="toggleAuthMode()">Sign up</a>`;
  } else {
    title.innerText = 'Join the Hub';
    sub.innerText = 'Create your free account';
    btn.innerText = 'Sign Up';
    if (usernameInput) usernameInput.style.display = 'block';
    switchTarget.parentElement.innerHTML = `Already have an account? <a href="#" onclick="toggleAuthMode()">Log in</a>`;
  }
}

window.handleAuthSubmit = async () => {
  const email = document.getElementById('auth-email').value;
  const username = document.getElementById('auth-username').value;
  const password = document.getElementById('auth-password').value;
  if (!email) return alert('Please enter your email address.');
  if (!password) return alert('Please enter your password.');

  const remember = document.getElementById('auth-remember').checked;

  // Check if admin email - require correct password
  const isAdminEmail = CONFIG.ADMIN_EMAILS.includes(email.toLowerCase());
  if (isAdminEmail) {
    if (password !== CONFIG.ADMIN_PASSWORD) {
      return alert('Invalid admin password.');
    }
    // Admin credentials valid - Force login
    // Try to find existing profile logic via Firebase would be here, but for simplicity
    // we just construct the admin session directly to ensure access.
    state.user = {
      id: email.includes('admin') ? 'admin_main_root' : 'support_main_root',
      name: email.includes('admin') ? 'Administrator' : 'Customer Support',
      email: email.toLowerCase(),
      plan: 'pro',
      remember: remember,
      betaProUser: true,
      joinDate: Date.now(),
      isAdmin: true
    };

    // Complete login process
    state.user.remember = remember;
    registerUserInSystem(state.user);
    // Determine storage
    if (remember) {
      localStorage.setItem('fishing_user', JSON.stringify(state.user));
      sessionStorage.removeItem('fishing_user');
    } else {
      sessionStorage.setItem('fishing_user', JSON.stringify(state.user));
      localStorage.removeItem('fishing_user');
    }
    updateAuthUI();
    closeAuthModal();
    return;
  }

  // For non-admin users, check Firebase for existing account
  if (!isAdminEmail && firebaseDB) {
    try {
      const snapshot = await firebaseDB.ref('users').orderByChild('email').equalTo(email.toLowerCase()).once('value');
      const firebaseUser = snapshot.val();

      if (state.authMode === 'login') {
        // LOGIN: User must exist in Firebase
        if (!firebaseUser) {
          return alert('No account found with this email. Please sign up first!');
        }

        // Get the user data from Firebase
        const userId = Object.keys(firebaseUser)[0];
        const userData = firebaseUser[userId];

        // Check password (simple validation - in production use proper auth)
        if (userData.password && userData.password !== password) {
          return alert('Incorrect password. Please try again.');
        }

        // Check if user is deactivated
        if (userData.active === false) {
          return alert('This account has been deactivated. Please contact support.');
        }

        // Login successful - load user data
        state.user = {
          id: userId,
          name: userData.name,
          email: userData.email,
          plan: userData.plan || 'pro', // Beta = free Pro
          remember: remember,
          betaProUser: userData.betaProUser || true,
          joinDate: userData.joinDate
        };

      } else {
        // SIGNUP: Check if email already exists
        if (firebaseUser) {
          return alert('An account with this email already exists. Please login instead!');
        }

        // Validate username
        if (!username) return alert('Please enter a username.');

        // Check if username is taken
        const usernameSnapshot = await firebaseDB.ref('users').orderByChild('name').equalTo(username).once('value');
        if (usernameSnapshot.val()) {
          return alert('This username is already taken. Please choose another.');
        }

        // Create new user
        state.user = {
          id: 'user_' + Date.now(),
          name: username,
          email: email.toLowerCase(),
          password: password, // Store for validation (in production, hash this!)
          plan: 'pro', // Beta = free Pro
          remember: remember,
          betaProUser: true,
          joinDate: Date.now()
        };
      }
    } catch (error) {
      console.warn('Firebase auth check failed:', error);
      // Fallback to local auth if Firebase fails
    }
  } else {
    // Fallback for when Firebase is not available
    const existingUser = state.allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (state.authMode === 'login' && !existingUser) {
      return alert('No account found with this email. Please sign up first!');
    }

    if (state.authMode === 'signup') {
      if (!username) return alert('Please enter a username.');
      if (existingUser) return alert('An account with this email already exists. Please login instead!');
      const isUsernameTaken = state.allUsers.some(u => u.name.toLowerCase() === username.toLowerCase());
      if (isUsernameTaken) return alert('This username is already taken. Please choose another.');
    }

    const defaultName = email.split('@')[0];
    state.user = existingUser || {
      id: 'user_' + Date.now(),
      name: username || (defaultName.charAt(0).toUpperCase() + defaultName.slice(1)),
      email: email.toLowerCase(),
      password: password,
      plan: 'pro',
      remember: remember,
      betaProUser: true,
      joinDate: Date.now()
    };
  }

  state.user.remember = remember;

  // Register/update user in system and sync to Firebase
  registerUserInSystem(state.user);
  syncUserToFirebase(state.user);

  if (remember) {
    localStorage.setItem('fishing_user', JSON.stringify(state.user));
    sessionStorage.removeItem('fishing_user');
  } else {
    sessionStorage.setItem('fishing_user', JSON.stringify(state.user));
    localStorage.removeItem('fishing_user');
  }

  updateAuthUI();
  closeAuthModal();
};


function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const userDisplay = document.getElementById('user-display');
  const label = document.getElementById('user-name-label');
  const adminNav = document.getElementById('nav-admin');

  if (state.user) {
    loginBtn.style.display = 'none';
    userDisplay.style.display = 'flex';
    label.innerText = state.user.name;
    // Show [PRO] if premium
    if (state.user.plan === 'pro') {
      label.innerHTML += ' <span style="font-size:0.65rem; color:#ffab00">[PRO]</span>';
      // During beta: Manage link shows free notice instead of Stripe
      label.innerHTML += ` <a href="#" onclick="alert('Pro features are FREE during beta! No subscription to manage yet.')" style="font-size:0.65rem; color:var(--text-muted); margin-left:5px; text-decoration:none">Manage</a>`;
    }
    // Show admin nav if admin
    if (isAdmin()) {
      label.innerHTML += ' <span style="font-size:0.65rem; color:#ff4d4d">[ADMIN]</span>';
      if (adminNav) adminNav.style.display = 'block';
    } else {
      if (adminNav) adminNav.style.display = 'none';
    }
  } else {
    loginBtn.style.display = 'block';
    userDisplay.style.display = 'none';
    if (adminNav) adminNav.style.display = 'none';
  }

  // Update avatar in navbar if it exists
  const navAvatar = document.querySelector('.user-avatar');
  if (state.user && state.user.avatar) {
    navAvatar.innerHTML = '';
    navAvatar.style.backgroundImage = `url(${state.user.avatar})`;
    navAvatar.style.backgroundSize = 'cover';
  } else if (navAvatar) {
    navAvatar.innerHTML = '👤';
    navAvatar.style.backgroundImage = 'none';
  }

  // Update mobile admin nav link
  const mobileAdminNav = document.getElementById('mobile-nav-admin');
  if (state.user && isAdmin()) {
    if (mobileAdminNav) mobileAdminNav.style.display = 'block';
  } else {
    if (mobileAdminNav) mobileAdminNav.style.display = 'none';
  }

  // Update notification badge
  updateNotificationBadge();
}

// ============================================
// Profile Logic
// ============================================
window.openProfileModal = () => {
  if (!state.user) return;

  document.getElementById('profile-name').value = state.user.name || '';
  document.getElementById('profile-bio').value = state.user.bio || '';

  const preview = document.getElementById('profile-avatar-preview');
  if (state.user.avatar) {
    preview.src = state.user.avatar;
  } else {
    // Placeholder
    preview.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYTBhZWMwIiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjxwYXRoIGQ9Ik02IDIxdjItYTQgNCAwIDAgMSA0LTRoOGE0IDQgMCAwIDEgNCA0djIiLz48L3N2Zz4=';
    // Simple SVG user icon base64
  }

  const badge = document.getElementById('profile-plan-badge');
  const upgradeBtn = document.getElementById('profile-upgrade-btn');

  badge.innerText = (state.user.plan || 'free').toUpperCase() + ' PLAN';
  if (state.user.plan === 'pro') {
    badge.classList.add('pro');
    // During beta: hide manage subscription since Pro is free
    upgradeBtn.innerText = '✓ Pro Features Active';
    upgradeBtn.classList.add('btn-outline');
    upgradeBtn.onclick = () => alert('Pro features are FREE during beta! No subscription to manage yet.');
    upgradeBtn.style.display = 'inline-block';
    upgradeBtn.disabled = false;
  } else {
    badge.classList.remove('pro');
    // During beta: everyone gets Pro for free
    upgradeBtn.innerText = 'Activate Free Pro';
    upgradeBtn.classList.remove('btn-outline');
    upgradeBtn.onclick = () => {
      state.user.plan = 'pro';
      state.user.betaProUser = true;
      persistUserData();
      syncUserToFirebase(state.user);
      alert('🎉 Pro features activated for FREE during beta!');
      closeProfileModal();
      updateAuthUI();
    };
    upgradeBtn.style.display = 'inline-block';
  }

  document.getElementById('profile-modal').classList.add('active');
};

window.closeProfileModal = () => document.getElementById('profile-modal').classList.remove('active');

window.handleAvatarSelect = (input) => {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('profile-avatar-preview').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.saveProfile = () => {
  if (!state.user) return;

  const name = document.getElementById('profile-name').value;
  const bio = document.getElementById('profile-bio').value;
  const imgSrc = document.getElementById('profile-avatar-preview').src;

  state.user.name = name;
  state.user.bio = bio;

  // Only save avatar if it's data URI (new upload) or existing. 
  if (imgSrc.startsWith('data:image')) {
    state.user.avatar = imgSrc;
  }

  // Persist locally
  if (state.user.remember || localStorage.getItem('fishing_user')) {
    localStorage.setItem('fishing_user', JSON.stringify(state.user));
  } else {
    sessionStorage.setItem('fishing_user', JSON.stringify(state.user));
  }

  // Sync to Firebase and update system-wide user registry
  syncUserToFirebase(state.user);
  registerUserInSystem(state.user);

  updateAuthUI();
  closeProfileModal();
  alert('Profile saved!');
};


window.logout = () => {
  state.user = null;
  localStorage.removeItem('fishing_user');
  sessionStorage.removeItem('fishing_user');
  updateAuthUI();
  closeProfileModal();
  showPage('home'); // Go to dashboard

  // Reset nav avatar
  const navAvatar = document.querySelector('.user-avatar');
  navAvatar.innerHTML = '👤';
  navAvatar.style.backgroundImage = 'none';
};

window.openPremiumModal = () => document.getElementById('premium-modal').classList.add('active');
window.closePremiumModal = () => document.getElementById('premium-modal').classList.remove('active');

window.upgradeToPremium = () => {
  if (!state.user) {
    closePremiumModal();
    return openAuthModal();
  }

  // Transition to Stripe Checkout
  closePremiumModal();
  openStripeCheckout();
};

window.openStripeCheckout = () => {
  if (!state.user) return openAuthModal();

  // Reset payment button state
  const payBtn = document.getElementById('stripe-pay-btn');
  if (payBtn) {
    payBtn.disabled = false;
    payBtn.querySelector('.btn-text').innerText = state.user.plan === 'pro' ? 'Update Subscription' : 'Subscribe';
    document.getElementById('stripe-pay-spinner').classList.add('hidden');
  }

  document.getElementById('stripe-checkout-modal').classList.add('active');
};

window.closeStripeCheckout = () => {
  document.getElementById('stripe-checkout-modal').classList.remove('active');
};

window.processStripePayment = async () => {
  const payBtn = document.getElementById('stripe-pay-btn');
  const spinner = document.getElementById('stripe-pay-spinner');
  const btnText = payBtn.querySelector('.btn-text');

  payBtn.disabled = true;
  if (btnText) btnText.innerText = '';
  if (spinner) spinner.classList.remove('hidden');

  try {
    const response = await fetch('http://localhost:3000/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.user.email })
    });

    const session = await response.json();
    if (session.url) {
      window.location.href = session.url;
    } else {
      throw new Error(session.error || 'Checkout session failed');
    }
  } catch (error) {
    console.error('Stripe Error:', error);
    alert('Secure connection failed. Please ensure your backend server is running on port 3000.');

    payBtn.disabled = false;
    if (btnText) btnText.innerText = state.user.plan === 'pro' ? 'Update Subscription' : 'Subscribe';
    if (spinner) spinner.classList.add('hidden');
  }
};

window.manageStripeSubscription = async () => {
  if (!state.user || state.user.plan !== 'pro') return;

  try {
    const response = await fetch('http://localhost:3000/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.user.email })
    });

    const portal = await response.json();
    if (portal.url) {
      window.location.href = portal.url;
    } else {
      throw new Error(portal.error || 'Portal session failed');
    }
  } catch (error) {
    console.error('Portal Error:', error);
    alert('Subscription management is currently unavailable. Please ensure your backend server is running.');
  }
};

window.likeCatch = (id) => {
  if (!state.user || state.user.plan !== 'pro') return openPremiumModal();

  const c = state.catches.find(cat => cat.id === id);
  if (!c) return;

  if (!c.likedBy) c.likedBy = [];
  const idx = c.likedBy.indexOf(state.user.id);

  if (idx === -1) {
    c.likedBy.push(state.user.id);
    c.likes = (c.likes || 0) + 1;
  } else {
    c.likedBy.splice(idx, 1);
    c.likes = Math.max(0, (c.likes || 1) - 1);
  }

  // Global sync
  updateCatchInFirebase(id, {
    likes: c.likes,
    likedBy: c.likedBy
  });

  localStorage.setItem('fishing_catches', JSON.stringify(state.catches));
  renderCatchFeed();
};

window.commentOnCatch = (id) => {
  if (!state.user || state.user.plan !== 'pro') return openPremiumModal();

  const text = prompt('Enter your comment:');
  if (!text) return;

  const c = state.catches.find(cat => cat.id === id);
  if (!c) return;

  if (!c.comments) c.comments = [];
  c.comments.push({
    author: state.user.name,
    text: text,
    date: new Date().toLocaleDateString('en-GB')
  });

  localStorage.setItem('fishing_catches', JSON.stringify(state.catches));
  renderCatchFeed();
};

// ============================================
// Directory Logic
// ============================================
const IRISH_COUNTIES = ["Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal", "Down", "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow"];

function loadNationalDirectory() {
  const container = document.getElementById('county-directory');
  if (container.children.length > 1) return;
  container.innerHTML = IRISH_COUNTIES.map(c => `
    <div class="county-group" id="county-${c}">
      <div class="county-header" onclick="toggleCounty('${c}')">
        <span class="county-name">${c}</span>
        <span class="county-count" id="count-${c}">Click to load</span>
        <span class="county-chevron">▼</span>
      </div>
      <div class="county-shops" id="shops-${c}">
        <div class="loading"><div class="loading-spinner"></div><span>Finding stores...</span></div>
      </div>
    </div>
  `).join('');
}

window.toggleCounty = async (c) => {
  const group = document.getElementById(`county-${c}`);
  if (group.classList.toggle('open')) {
    const shops = document.getElementById(`shops-${c}`);
    if (shops.innerText.includes('Finding stores')) await fetchShopsByCounty(c);
  }
};

async function fetchShopsByCounty(c) {
  const container = document.getElementById(`shops-${c}`);
  const label = document.getElementById(`count-${c}`);
  try {
    const q = `[out:json][timeout:25];area[name="County ${c}"];(node["shop"="fishing"](area);way["shop"="fishing"](area););out body center;`;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
    const data = await res.json();
    label.innerText = `${data.elements.length} stores found`;
    renderCountyShops(c, data.elements);
  } catch {
    container.innerHTML = `<p style="padding:15px">Unable to load.</p>`;
  }
}

window.openShopDetails = (lat, lon, name, street, city, phone, email) => {
  const modal = document.getElementById('shop-details-modal');
  document.getElementById('shop-details-name').innerText = name;
  document.getElementById('shop-details-address').innerHTML = `<span class="icon">📍</span> ${street}${city ? ', ' + city : ''}`;

  const phoneEl = document.getElementById('shop-details-phone');
  if (phone && phone !== 'undefined') {
    phoneEl.innerHTML = `<span class="icon">📞</span> ${phone}`;
    phoneEl.style.display = 'block';
  } else {
    phoneEl.style.display = 'none';
  }

  const emailEl = document.getElementById('shop-details-email');
  if (email && email !== 'undefined' && email !== '') {
    emailEl.innerHTML = `<span class="icon">📧</span> <a href="mailto:${email}" style="color:var(--accent-primary); text-decoration:none">${email}</a>`;
    emailEl.style.display = 'block';
  } else {
    emailEl.style.display = 'none';
  }

  // Set directions button
  document.getElementById('shop-details-directions-btn').onclick = () => getDirections(lat, lon);

  // Street View Logic
  const img = document.getElementById('street-view-image');
  const loading = document.getElementById('sv-loading');
  const fallback = document.getElementById('sv-fallback');

  img.style.display = 'none';
  loading.style.display = 'flex';
  fallback.style.display = 'none';

  const apiKey = CONFIG.API_KEYS.streetView;
  img.src = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${lat},${lon}&key=${apiKey}`;

  img.onerror = () => {
    loading.style.display = 'none';
    img.style.display = 'none';
    fallback.style.display = 'flex';
  };

  if (apiKey.includes('PLACEHOLDER')) {
    setTimeout(() => img.onerror(), 500);
  }

  modal.classList.add('active');
};

window.closeShopDetails = () => document.getElementById('shop-details-modal').classList.remove('active');

function renderCountyShops(c, shops) {
  const container = document.getElementById(`shops-${c}`);
  if (!shops || shops.length === 0) {
    container.innerHTML = `<p style="padding:15px; color:var(--text-muted)">No shops found.</p>`;
    return;
  }
  container.innerHTML = shops.map(s => {
    const lat = s.lat || (s.center ? s.center.lat : 0);
    const lon = s.lon || (s.center ? s.center.lon : 0);
    const tags = s.tags || {};
    const name = tags.name || 'Tackle Shop';
    const street = tags['addr:street'] || '';
    const city = tags['addr:city'] || '';
    const phone = tags.phone || tags['contact:phone'] || '';
    const email = tags.email || tags['contact:email'] || '';

    return `
      <div class="shop-item" onclick="openShopDetails(${lat}, ${lon}, '${name.replace(/'/g, "\\'")}', '${street.replace(/'/g, "\\'")}', '${city.replace(/'/g, "\\'")}', '${phone}', '${email}')">
        <span class="shop-name">${name}</span>
        <div class="shop-detail"><span>${street || 'Ireland'}</span></div>
        <div class="shop-actions"><button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); getDirections(${lat},${lon})">Directions</button></div>
      </div>
    `;
  }).join('');
}

// ============================================
// Admin Dashboard Logic
// ============================================

function loadAdminDashboard() {
  if (!isAdmin()) return;

  loadStationInsights();

  // Load users from Firebase for the admin table
  loadUsersFromFirebase((users) => {
    state.allUsers = users;
    // Auto-cleanup old deactivated users
    cleanupDeactivatedUsers();
    loadUsersTable();
  });

  loadAdminMessages();
}

function loadStationInsights() {
  const stations = CONFIG.stations;
  const total = stations.length;
  const offline = stations.filter(s => s.maintenance).length;
  const active = total - offline;

  document.getElementById('total-stations').textContent = total;
  document.getElementById('active-stations').textContent = active;
  document.getElementById('offline-stations').textContent = offline;

  const listEl = document.getElementById('admin-station-list');
  listEl.innerHTML = stations.map(s => `
    <div class="station-status-item">
      <span>${s.name}</span>
      <span class="status ${s.maintenance ? 'offline' : 'online'}">
        ${s.maintenance ? 'MAINTENANCE' : 'ONLINE'}
      </span>
    </div>
  `).join('');
}

function loadUsersTable() {
  const searchTerm = (document.getElementById('admin-user-search')?.value || '').toLowerCase();
  const filteredUsers = state.allUsers.filter(u =>
    u.email.toLowerCase().includes(searchTerm) ||
    (u.name && u.name.toLowerCase().includes(searchTerm))
  );

  document.getElementById('total-users-badge').textContent = `${filteredUsers.length} users`;

  const tbody = document.getElementById('users-table-body');
  if (filteredUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">${searchTerm ? 'No matches found' : 'No users registered yet'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredUsers.map(u => {
    const joinDate = u.joinDate ? new Date(u.joinDate).toLocaleDateString('en-GB') : 'N/A';
    const isActive = u.active !== false;
    const plan = u.plan || 'free';

    return `
      <tr>
        <td>${u.name || 'Unknown'}</td>
        <td>${u.email}</td>
        <td><span class="badge ${plan === 'pro' ? 'pro' : ''}">${plan.toUpperCase()}</span></td>
        <td>${joinDate}</td>
        <td><span class="badge ${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Inactive'}</span></td>
        <td style="display: flex; gap: 5px;">
          <button class="btn btn-xs ${isActive ? 'btn-danger' : 'btn-success'}" 
                  onclick="toggleUserStatus('${u.id}')">
            ${isActive ? 'Deactivate' : 'Activate'}
          </button>
          ${plan !== 'pro' ? `
            <button class="btn btn-xs btn-primary" onclick="giftProSubscription('${u.id}')" title="Gift 1 Month Free Pro">
              🎁 Gift Pro
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

window.giftProSubscription = (userId) => {
  if (!confirm('Are you sure you want to gift this user 1 month of Pro status for free?')) return;

  const user = state.allUsers.find(u => u.id === userId);
  if (!user) return;

  user.plan = 'pro';
  // Expiration in 30 days
  user.proExpirationDate = Date.now() + (30 * 24 * 60 * 60 * 1000);

  localStorage.setItem('fishing_all_users', JSON.stringify(state.allUsers));

  // If this is the current user, update their state too
  if (state.user && state.user.id === userId) {
    state.user.plan = 'pro';
    state.user.proExpirationDate = user.proExpirationDate;
    persistUserData();
    updateAuthUI();
  }

  alert(`Successfully gifted 1 month of Pro to ${user.name || user.email}`);
  loadUsersTable();
};

window.toggleUserStatus = (userId) => {
  const user = state.allUsers.find(u => u.id === userId);
  if (!user) return;

  user.active = user.active === false ? true : false;
  // Timestamp for auto-deletion logic
  if (user.active === false) {
    user.deactivationDate = Date.now();
  } else {
    delete user.deactivationDate;
  }

  // Sync changes locally and globally
  localStorage.setItem('fishing_all_users', JSON.stringify(state.allUsers));
  syncUserToFirebase(user);

  // Email Notification Logic for Deactivation
  if (user.active === false && user.email) {
    const subject = encodeURIComponent("Account Status Update - Irish Fishing Hub");
    const body = encodeURIComponent(`Dear ${user.name || 'Member'},\n\nWe are writing to inform you that your account on Irish Fishing Hub has been deactivated.\n\nIf you believe this is an error or would like to appeal this decision, please reply to this email.\n\nBest regards,\nSupport Team\nIrish Fishing Hub`);
    const mailtoLink = `mailto:${user.email}?subject=${subject}&body=${body}`;

    // Open default email client
    window.open(mailtoLink, '_blank');
  }

  // If current user is being deactivated, log them out
  if (state.user && state.user.id === userId && !user.active) {
    logout();
    return;
  }

  loadUsersTable();
};

/**
 * Checks for users deactivated > 30 days and removes them
 */
function cleanupDeactivatedUsers() {
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const usersToDelete = state.allUsers.filter(u =>
    u.active === false &&
    u.deactivationDate &&
    (now - u.deactivationDate > thirtyDaysMs)
  );

  if (usersToDelete.length > 0) {
    console.log(`Auto-cleaning ${usersToDelete.length} deactivated users...`);
    usersToDelete.forEach(u => {
      // Remove from Firebase
      if (firebaseDB) {
        firebaseDB.ref('users/' + u.id).remove().catch(err => console.error('Cleanup failed:', err));
      }
      // Remove from local state
      state.allUsers = state.allUsers.filter(user => user.id !== u.id);
    });
    // Update local storage
    localStorage.setItem('fishing_all_users', JSON.stringify(state.allUsers));
  }
}

function loadAdminMessages() {
  const messages = state.supportMessages;
  const unread = messages.filter(m => !m.read).length;

  document.getElementById('unread-messages-badge').textContent = `${unread} unread`;

  const listEl = document.getElementById('admin-messages-list');
  if (messages.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>No support messages yet</p></div>';
    return;
  }

  // Group messages by user
  const userThreads = {};
  messages.forEach(m => {
    if (!userThreads[m.userId]) {
      userThreads[m.userId] = {
        userId: m.userId,
        userName: m.userName,
        userEmail: m.userEmail,
        messages: [],
        hasUnread: false
      };
    }
    userThreads[m.userId].messages.push(m);
    if (!m.read) userThreads[m.userId].hasUnread = true;
  });

  listEl.innerHTML = Object.values(userThreads).map(thread => {
    const lastMsg = thread.messages[thread.messages.length - 1];
    const time = new Date(lastMsg.timestamp).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    return `
      <div class="message-item ${thread.hasUnread ? 'unread' : ''}" 
           onclick="openAdminReply('${thread.userId}')">
        <div class="message-avatar">👤</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">${thread.userName}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-preview">${lastMsg.text}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.openAdminReply = (userId) => {
  state.currentReplyUserId = userId;

  // Mark messages as read
  state.supportMessages.forEach(m => {
    if (m.userId === userId && !m.read) {
      m.read = true;
      syncMessageToFirebase(m);
    }
  });
  localStorage.setItem('fishing_support_messages', JSON.stringify(state.supportMessages));

  // Get thread for this user
  const thread = state.supportMessages.filter(m => m.userId === userId);
  const user = state.allUsers.find(u => u.id === userId);

  document.getElementById('reply-to-user').textContent = user?.name || 'User';
  renderAdminReplyThread(thread);

  document.getElementById('admin-reply-modal').classList.add('active');
  loadAdminMessages(); // Refresh unread count
};

function renderAdminReplyThread(messages) {
  const threadEl = document.getElementById('admin-reply-thread');

  if (messages.length === 0) {
    threadEl.innerHTML = '<div class="empty-state"><p>No messages in this thread</p></div>';
    return;
  }

  threadEl.innerHTML = messages.map(m => {
    const time = new Date(m.timestamp).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    return `
      <div class="thread-message ${m.from === 'admin' ? 'admin' : 'user'}">
        ${m.text}
        <span class="time">${time}</span>
      </div>
    `;
  }).join('');

  threadEl.scrollTop = threadEl.scrollHeight;
}

window.closeAdminReplyModal = () => {
  document.getElementById('admin-reply-modal').classList.remove('active');
  state.currentReplyUserId = null;
};

window.sendAdminReply = () => {
  const input = document.getElementById('admin-reply-input');
  const text = input.value.trim();
  if (!text || !state.currentReplyUserId) return;

  const msg = {
    id: 'msg_' + Date.now(),
    userId: state.currentReplyUserId,
    userName: 'Support Team',
    userEmail: 'support@tides.ie',
    text: text,
    timestamp: Date.now(),
    from: 'admin',
    read: true,
    readByUser: false
  };

  // Sync to Firebase (Listener handles UI and localStorage)
  syncMessageToFirebase(msg);

  input.value = '';
};


// ============================================
// User Support Messaging
// ============================================

window.openSupportModal = () => {
  if (!state.user) return openAuthModal();

  renderUserSupportThread();
  document.getElementById('support-modal').classList.add('active');
};

window.closeSupportModal = () => {
  document.getElementById('support-modal').classList.remove('active');
};

function renderUserSupportThread() {
  const threadEl = document.getElementById('support-thread');
  const userMessages = state.supportMessages.filter(m => m.userId === state.user.id);

  if (userMessages.length === 0) {
    threadEl.innerHTML = '<div class="empty-state"><p>No messages yet. Send us a message below!</p></div>';
    return;
  }

  threadEl.innerHTML = userMessages.map(m => {
    const time = new Date(m.timestamp).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    return `
      <div class="thread-message ${m.from === 'admin' ? 'admin' : 'user'}">
        ${m.text}
        <span class="time">${time}</span>
      </div>
    `;
  }).join('');

  threadEl.scrollTop = threadEl.scrollHeight;
}

window.sendSupportMessage = () => {
  if (!state.user) return openAuthModal();

  const input = document.getElementById('support-message-input');
  const text = input.value.trim();
  if (!text) return;

  const msg = {
    id: 'msg_' + Date.now(),
    userId: state.user.id,
    userName: state.user.name,
    userEmail: state.user.email,
    text: text,
    timestamp: Date.now(),
    from: 'user',
    read: false,
    readByUser: true
  };

  // Sync to Firebase (Real-time listener handles UI and localStorage)
  syncMessageToFirebase(msg);

  input.value = '';
};

// ============================================
// User Registration Tracking
// ============================================

function registerUserInSystem(user) {
  // Check if user already exists
  const existingIndex = state.allUsers.findIndex(u => u.email === user.email);

  const userData = {
    id: user.id || (existingIndex !== -1 ? state.allUsers[existingIndex].id : 'user_' + Date.now()),
    name: user.name,
    email: user.email,
    plan: user.plan || (existingIndex !== -1 ? state.allUsers[existingIndex].plan : 'free'),
    proExpirationDate: user.proExpirationDate || (existingIndex !== -1 ? state.allUsers[existingIndex].proExpirationDate : null),
    bio: user.bio || (existingIndex !== -1 ? state.allUsers[existingIndex].bio : ''),
    joinDate: existingIndex === -1 ? Date.now() : state.allUsers[existingIndex].joinDate,
    active: existingIndex === -1 ? true : state.allUsers[existingIndex].active
  };

  if (existingIndex === -1) {
    state.allUsers.push(userData);
  } else {
    // Update existing user data
    state.allUsers[existingIndex] = { ...state.allUsers[existingIndex], ...userData };
  }

  // Sync to Firebase
  syncUserToFirebase(userData);

  localStorage.setItem('fishing_all_users', JSON.stringify(state.allUsers));
}

// ============================================
// Mobile Menu Logic
// ============================================

window.toggleMobileMenu = () => {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('hamburger-btn');
  menu.classList.toggle('active');
  btn.classList.toggle('active');
};

window.closeMobileMenu = () => {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('hamburger-btn');
  menu.classList.remove('active');
  btn.classList.remove('active');
};

// ============================================
// Notification Badge Logic
// ============================================

function updateNotificationBadge() {
  if (!state.user) return;

  const badge = document.getElementById('notification-badge');
  if (!badge) return;

  // Count unread admin replies for this user
  const unreadCount = state.supportMessages.filter(
    m => m.userId === state.user.id && m.from === 'admin' && !m.readByUser
  ).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Mark messages as read when user opens support modal
const originalOpenSupportModal = window.openSupportModal;
window.openSupportModal = () => {
  if (!state.user) return openAuthModal();

  // Mark all admin messages as read by user
  state.supportMessages.forEach(m => {
    if (m.userId === state.user.id && m.from === 'admin' && !m.readByUser) {
      m.readByUser = true;
      syncMessageToFirebase(m);
    }
  });
  localStorage.setItem('fishing_support_messages', JSON.stringify(state.supportMessages));

  updateNotificationBadge();
  renderUserSupportThread();
  document.getElementById('support-modal').classList.add('active');
};

// ============================================
// National Directory (Tackle Shops)
// ============================================

const TACKLE_SHOPS = [
  // Dublin
  { name: "Rory's Fishing Tackle", county: "Dublin", address: "17a Temple Bar, Dublin 2", phone: "01 677 2351", website: "https://www.rorys.ie", lat: 53.3449, lng: -6.2643, rating: 4.8 },
  { name: "Southside Angling", county: "Dublin", address: "213 Crumlin Rd, Dublin 12", phone: "01 455 9049", website: "https://www.southsideangling.ie", lat: 53.3284, lng: -6.3032, rating: 4.6 },
  { name: "The Angling Centre", county: "Dublin", address: "Unit 1, Swords Business Park, Swords", phone: "01 813 4455", website: "", lat: 53.4575, lng: -6.2214, rating: 4.5 },

  // Cork
  { name: "T.W. Murray & Co", county: "Cork", address: "87 Patrick St, Cork City", phone: "021 427 1089", website: "", lat: 51.8986, lng: -8.4756, rating: 4.7 },
  { name: "The Tackle Shop Cork", county: "Cork", address: "4 Drawbridge St, Cork City", phone: "021 427 2842", website: "", lat: 51.8972, lng: -8.4743, rating: 4.5 },
  { name: "West Cork Angling", county: "Cork", address: "Main St, Bantry", phone: "027 50328", website: "", lat: 51.6793, lng: -9.4512, rating: 4.4 },

  // Galway
  { name: "Duffy's Fishing", county: "Galway", address: "5 Mainguard St, Galway City", phone: "091 562 367", website: "https://www.duffysfishing.ie", lat: 53.2723, lng: -9.0530, rating: 4.9 },
  { name: "Freeney's Angling", county: "Galway", address: "19 High St, Galway", phone: "091 568 794", website: "", lat: 53.2730, lng: -9.0528, rating: 4.6 },

  // Kerry
  { name: "O'Neill's Fishing Tackle", county: "Kerry", address: "6 Plunkett St, Killarney", phone: "064 663 1970", website: "https://www.killarneyfishing.com", lat: 52.0599, lng: -9.5044, rating: 4.7 },
  { name: "Kerry Angling", county: "Kerry", address: "Strand St, Tralee", phone: "066 712 6644", website: "", lat: 52.2700, lng: -9.7025, rating: 4.3 },

  // Mayo
  { name: "Pat Scahill's Tackle Shop", county: "Mayo", address: "Castlebar St, Westport", phone: "098 27899", website: "", lat: 53.8010, lng: -9.5181, rating: 4.8 },
  { name: "Ballina Angling Centre", county: "Mayo", address: "Dillon Terrace, Ballina", phone: "096 21850", website: "", lat: 54.1163, lng: -9.1528, rating: 4.5 },

  // Donegal
  { name: "Donegal Angling Supplies", county: "Donegal", address: "Main St, Donegal Town", phone: "074 972 1119", website: "", lat: 54.6540, lng: -8.1100, rating: 4.6 },
  { name: "Letterkenny Tackle", county: "Donegal", address: "Port Rd, Letterkenny", phone: "074 912 4888", website: "", lat: 54.9548, lng: -7.7337, rating: 4.4 },

  // Wicklow
  { name: "Wicklow Bait & Tackle", county: "Wicklow", address: "The Harbour, Wicklow Town", phone: "0404 61444", website: "", lat: 52.9808, lng: -6.0332, rating: 4.5 },
  { name: "Arklow Marine & Angling", county: "Wicklow", address: "South Quay, Arklow", phone: "0402 32125", website: "", lat: 52.7960, lng: -6.1472, rating: 4.6 },

  // Wexford
  { name: "Wexford Tackle Shop", county: "Wexford", address: "Crescent Quay, Wexford", phone: "053 912 3055", website: "", lat: 52.3369, lng: -6.4633, rating: 4.4 },

  // Waterford
  { name: "The Waterford Angler", county: "Waterford", address: "26 The Quay, Waterford", phone: "051 874 455", website: "", lat: 52.2593, lng: -7.1101, rating: 4.5 },

  // Clare
  { name: "Ennis Tackle & Bait", county: "Clare", address: "Abbey St, Ennis", phone: "065 682 8366", website: "", lat: 52.8430, lng: -8.9816, rating: 4.3 },

  // Limerick
  { name: "Steve's Fishing Tackle", county: "Limerick", address: "23 William St, Limerick City", phone: "061 415 484", website: "", lat: 52.6647, lng: -8.6308, rating: 4.6 },

  // Sligo
  { name: "Barton Smith Tackle", county: "Sligo", address: "Hyde Bridge, Sligo", phone: "071 914 2356", website: "", lat: 54.2697, lng: -8.4694, rating: 4.7 },

  // Louth
  { name: "Drogheda Angling Centre", county: "Louth", address: "West St, Drogheda", phone: "041 983 6978", website: "", lat: 53.7193, lng: -6.3509, rating: 4.5 },

  // Meath
  { name: "Navan Tackle", county: "Meath", address: "Trimgate St, Navan", phone: "046 902 8844", website: "", lat: 53.6528, lng: -6.6818, rating: 4.4 },

  // Northern Ireland
  { name: "Belfast Angling Centre", county: "Antrim", address: "93 North St, Belfast", phone: "028 9024 5678", website: "", lat: 54.6018, lng: -5.9347, rating: 4.7 },
  { name: "Bangor Angling Centre", county: "Down", address: "High St, Bangor", phone: "028 9127 1234", website: "", lat: 54.6603, lng: -5.6689, rating: 4.6 },
  { name: "Newtownards Tackle", county: "Down", address: "Frances St, Newtownards", phone: "028 9181 2345", website: "", lat: 54.5944, lng: -5.6917, rating: 4.5 },
  { name: "Lisburn Angling Supplies", county: "Antrim", address: "Bow St, Lisburn", phone: "028 9266 3456", website: "", lat: 54.5097, lng: -6.0372, rating: 4.5 },
  { name: "Ballymena Tackle Shop", county: "Antrim", address: "Church St, Ballymena", phone: "028 2565 4567", website: "", lat: 54.8644, lng: -6.2761, rating: 4.4 },
  { name: "Portrush Sea Angling", county: "Antrim", address: "Main St, Portrush", phone: "028 7082 5678", website: "", lat: 55.2064, lng: -6.6561, rating: 4.8 },
  { name: "Newry Angling Centre", county: "Down", address: "Hill St, Newry", phone: "028 3026 6789", website: "", lat: 54.1753, lng: -6.3389, rating: 4.5 }
];

function loadNationalDirectory() {
  const container = document.getElementById('county-directory');
  if (!container) return;

  // Group shops by county
  const byCounty = {};
  TACKLE_SHOPS.forEach(shop => {
    if (!byCounty[shop.county]) byCounty[shop.county] = [];
    byCounty[shop.county].push(shop);
  });

  // Sort counties alphabetically
  const sortedCounties = Object.keys(byCounty).sort();

  let html = '<div class="directory-grid">';

  sortedCounties.forEach(county => {
    const shops = byCounty[county];
    html += `
      <div class="county-card">
        <div class="county-header">
          <h3>📍 ${county}</h3>
          <span class="shop-count">${shops.length} shop${shops.length > 1 ? 's' : ''}</span>
        </div>
        <div class="shop-list">
    `;

    shops.forEach(shop => {
      const stars = '⭐'.repeat(Math.round(shop.rating));
      html += `
        <div class="shop-item" onclick="showShopOnMap(${shop.lat}, ${shop.lng}, '${shop.name.replace(/'/g, "\\'")}')">
          <div class="shop-name">${shop.name}</div>
          <div class="shop-address">${shop.address}</div>
          <div class="shop-meta">
            <span class="shop-rating">${shop.rating} ${stars}</span>
            <a href="tel:${shop.phone}" class="shop-phone" onclick="event.stopPropagation()">📞 ${shop.phone}</a>
          </div>
          ${shop.website ? `<a href="${shop.website}" target="_blank" class="shop-website" onclick="event.stopPropagation()">🌐 Visit Website</a>` : ''}
        </div>
      `;
    });

    html += '</div></div>';
  });

  html += '</div>';

  // Add summary stats
  const totalShops = TACKLE_SHOPS.length;
  const counties = sortedCounties.length;

  html = `
    <div class="directory-stats">
      <div class="stat-item">
        <span class="stat-value">${totalShops}</span>
        <span class="stat-label">Tackle Shops</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${counties}</span>
        <span class="stat-label">Counties</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">⭐ ${(TACKLE_SHOPS.reduce((acc, s) => acc + s.rating, 0) / totalShops).toFixed(1)}</span>
        <span class="stat-label">Avg Rating</span>
      </div>
    </div>
  ` + html;

  container.innerHTML = html;
}

window.showShopOnMap = (lat, lng, name) => {
  // Switch to home page and pan to shop location
  showPage('home');

  if (state.map) {
    state.map.setView([lat, lng], 15);

    // Add a temporary marker
    const shopIcon = L.divIcon({
      className: 'shop-marker',
      html: '🏪',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([lat, lng], { icon: shopIcon }).addTo(state.map);
    marker.bindPopup(`<div class="shop-popup"><strong>${name}</strong><br>Tackle Shop</div>`).openPopup();

    // Remove marker after 30 seconds
    setTimeout(() => {
      state.map.removeLayer(marker);
    }, 30000);
  }
};

// ============================================
// Terms & Conditions Logic
// ============================================
window.openTermsModal = () => {
  document.getElementById('terms-modal').classList.add('active');
};

window.closeTermsModal = () => {
  document.getElementById('terms-modal').classList.remove('active');
};
