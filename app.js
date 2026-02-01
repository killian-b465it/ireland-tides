/**
 * Irish Fishing Hub - Real-Time Fishing Tide Data
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

    // Additional stations - attempting live API data
    { id: 'Arklow', name: 'Arklow', lat: 52.7978, lon: -6.1419, region: 'East Coast', live: true },
    { id: 'Courtown', name: 'Courtown Harbour', lat: 52.6461, lon: -6.2289, region: 'East Coast', live: true },
    { id: 'Cobh', name: 'Cobh (Cork)', lat: 51.8503, lon: -8.2967, region: 'South Coast', live: true },
    { id: 'Kinsale', name: 'Kinsale', lat: 51.7058, lon: -8.5222, region: 'South Coast', live: true },
    { id: 'Schull', name: 'Schull', lat: 51.5278, lon: -9.5417, region: 'South Coast', live: true },
    { id: 'Bantry', name: 'Bantry', lat: 51.6803, lon: -9.4528, region: 'South West', live: true },
    { id: 'Fenit', name: 'Fenit', lat: 52.2728, lon: -9.8608, region: 'South West', live: true },
    { id: 'Tarbert', name: 'Tarbert', lat: 52.5747, lon: -9.3664, region: 'South West', live: true },
    { id: 'Rossaveal', name: 'Rossaveal', lat: 53.2667, lon: -9.8333, region: 'West Coast', live: true },
    { id: 'Clifden', name: 'Clifden', lat: 53.4897, lon: -10.0189, region: 'West Coast', live: true },
    { id: 'Westport', name: 'Westport', lat: 53.8008, lon: -9.5228, region: 'West Coast', live: true },
    // Northern Ireland - attempting live data from Marine.ie
    { id: 'Portrush', name: 'Portrush', lat: 55.2069, lon: -6.6556, region: 'North of Ireland', live: true },
    { id: 'Larne', name: 'Larne', lat: 54.8531, lon: -5.7928, region: 'North of Ireland', live: true },
    { id: 'Bangor', name: 'Bangor', lat: 54.6603, lon: -5.6689, region: 'North of Ireland', live: true },
    { id: 'Belfast', name: 'Belfast', lat: 54.6097, lon: -5.9289, region: 'North of Ireland', live: true },
    { id: 'Warrenpoint', name: 'Warrenpoint', lat: 54.0997, lon: -6.2519, region: 'North of Ireland', live: true },
    { id: 'Carlingford', name: 'Carlingford', lat: 54.0442, lon: -6.1883, region: 'North of Ireland', live: true }
  ],
  API_KEYS: {
    streetView: 'DEMO_KEY_PLACEHOLDER', // Replace with valid Google Maps API Key
    stripePublishable: 'pk_live_51PWJQERsc2tHXy0gV05ejlWaH6mwy4Xfqvfa7cSqUTdZaK6eFr4oEFYlXsZyeutnrlKzOmsRW7VDZkAQ4yO0XVu7004MBj4h9Q'
  },
  // Admin emails - users with these emails get admin access
  ADMIN_EMAILS: ['irishfishinghub@gmail.com'],
  // Admin password - required for admin accounts
  // [SECURITY WARNING] In a production environment, this should never be hardcoded on the client-side.
  // Use Firebase Authentication's custom claims or a secure backend for admin verification.
  ADMIN_PASSWORD: 'IrishTides2026!',
  // Integration endpoints
  STRIPE_API_ENDPOINT: window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://api.irishfishinghub.com'
};

// ============================================
// Piers Data (Popular Fishing Piers)
// ============================================
const PIERS = [
  { name: 'Dun Laoghaire Pier', lat: 53.2946, lon: -6.1349 },
  { name: 'Howth West Pier', lat: 53.3905, lon: -6.0672 },
  { name: 'Bray Pier', lat: 53.2021, lon: -6.0908 },
  { name: 'Skerries Pier', lat: 53.5795, lon: -6.1100 },
  { name: 'Greystones Pier', lat: 53.1433, lon: -6.0639 },
  { name: 'Cobh Pier', lat: 51.8493, lon: -8.2990 },
  { name: 'Kinsale Pier', lat: 51.7048, lon: -8.5245 },
  { name: 'Galway Docks', lat: 53.2695, lon: -9.0590 },
  { name: 'Kilmore Quay Pier', lat: 52.1726, lon: -6.5857 },
  { name: 'Dunmore East Pier', lat: 52.1508, lon: -6.9965 },
  { name: 'Fenit Pier', lat: 52.2698, lon: -9.8680 },
  { name: 'Dingle Pier', lat: 52.1395, lon: -10.2700 },
  { name: 'Clifden Pier', lat: 53.4865, lon: -10.0235 },
  { name: 'Killybegs Pier', lat: 54.6335, lon: -8.4410 },
  { name: 'Portrush Pier', lat: 55.2050, lon: -6.6580 },
  // East Coast additions
  { name: 'Courtown Pier', lat: 52.6448, lon: -6.2305 },
  { name: 'Rush Pier', lat: 53.5231, lon: -6.0858 },
  { name: 'Laytown Pier', lat: 53.6853, lon: -6.2389 },
  { name: 'Clogherhead Pier', lat: 53.7894, lon: -6.2336 },
  { name: 'Wicklow Pier', lat: 52.9795, lon: -6.0355 },
  { name: 'Arklow Pier', lat: 52.7965, lon: -6.1440 },
  // South Coast additions
  { name: 'Youghal Pier', lat: 51.9535, lon: -7.8465 },
  { name: 'Ballycotton Pier', lat: 51.8275, lon: -8.0105 },
  { name: 'Union Hall Pier', lat: 51.5395, lon: -9.1405 },
  // West Coast additions
  { name: 'Rossaveal Pier', lat: 53.2675, lon: -9.5585 },
  { name: 'Roundstone Pier', lat: 53.3985, lon: -9.9255 },
  { name: 'Cleggan Pier', lat: 53.5603, lon: -10.1256 },
  { name: 'Westport Quay', lat: 53.7975, lon: -9.5265 },
  // North West additions
  { name: 'Downings Pier', lat: 55.1897, lon: -7.8328 },
  { name: 'Burtonport Pier', lat: 54.9897, lon: -8.4328 },
  // Northern Ireland
  { name: 'Bangor Pier', lat: 54.6590, lon: -5.6710 },
  { name: 'Donaghadee Pier', lat: 54.6419, lon: -5.5344 },
  { name: 'Ballycastle Pier', lat: 55.2050, lon: -6.2445 },
  { name: 'Carrickfergus Pier', lat: 54.7139, lon: -5.8064 },
  { name: 'Newcastle Pier', lat: 54.2103, lon: -5.8828 },
  { name: 'Ardglass Pier', lat: 54.2598, lon: -5.6075 },
  { name: 'Portavogie Pier', lat: 54.4572, lon: -5.4380 },
  { name: 'Kilkeel Pier', lat: 54.0605, lon: -5.9945 },
  { name: 'Cushendall Pier', lat: 55.0803, lon: -6.0542 },
  { name: 'Glenarm Pier', lat: 54.9686, lon: -5.9553 }
];

// ============================================
// Boat Ramps Data (Public Slipways)
// ============================================
const BOAT_RAMPS = [
  { name: 'Malahide Slipway', lat: 53.4503, lon: -6.1519 },
  { name: 'Skerries Slipway', lat: 53.5812, lon: -6.1075 },
  { name: 'Balbriggan Slipway', lat: 53.6103, lon: -6.1833 },
  { name: 'Howth Slipway', lat: 53.3865, lon: -6.0695 },
  { name: 'Dun Laoghaire Slipway', lat: 53.2897, lon: -6.1289 },
  { name: 'Arklow Slipway', lat: 52.7990, lon: -6.1395 },
  { name: 'Wexford Slipway', lat: 52.3336, lon: -6.4575 },
  { name: 'Dunmore East Slipway', lat: 52.1475, lon: -6.9920 },
  { name: 'Cobh Slipway', lat: 51.8475, lon: -8.2995 },
  { name: 'Kinsale Slipway', lat: 51.7035, lon: -8.5260 },
  { name: 'Fenit Slipway', lat: 52.2685, lon: -9.8695 },
  { name: 'Galway Slipway', lat: 53.2685, lon: -9.0615 },
  { name: 'Clifden Slipway', lat: 53.4875, lon: -10.0185 },
  { name: 'Killybegs Slipway', lat: 54.6315, lon: -8.4425 },
  { name: 'Malin Head Slipway', lat: 55.3757, lon: -7.3906 },
  // Northern Ireland
  { name: 'Bangor Marina Slipway', lat: 54.6635, lon: -5.6690 },
  { name: 'Donaghadee Slipway', lat: 54.6430, lon: -5.5325 },
  { name: 'Strangford Slipway', lat: 54.3675, lon: -5.5536 },
  { name: 'Portaferry Slipway', lat: 54.3803, lon: -5.5519 },
  { name: 'Kilkeel Slipway', lat: 54.0590, lon: -5.9960 },
  { name: 'Carlingford Marina Slipway', lat: 54.0428, lon: -6.1905 },
  { name: 'Warrenpoint Slipway', lat: 54.0980, lon: -6.2540 },
  { name: 'Portavogie Slipway', lat: 54.4560, lon: -5.4395 },
  { name: 'Ballycastle Slipway', lat: 55.2035, lon: -6.2430 }
];

// ============================================
// Harbours Data (Major Harbours)
// ============================================
const HARBOURS = [
  { name: 'Dublin Port', lat: 53.3490, lon: -6.2020 },       // Offset from station
  { name: 'Cork Harbour', lat: 51.8520, lon: -8.2940 },      // Offset from Cobh pier/slipway
  { name: 'Galway Harbour', lat: 53.2725, lon: -9.0540 },    // Offset from pier
  { name: 'Waterford Harbour', lat: 52.2633, lon: -7.0911 },
  { name: 'Limerick Harbour', lat: 52.6639, lon: -8.6308 },
  { name: 'Drogheda Port', lat: 53.7189, lon: -6.3475 },
  { name: 'Rosslare Harbour', lat: 52.2550, lon: -6.3360 },  // Offset from station
  { name: 'Dun Laoghaire Harbour', lat: 53.2960, lon: -6.1320 },  // Offset from pier
  { name: 'Howth Harbour', lat: 53.3920, lon: -6.0640 },     // Offset from pier/station
  { name: 'Killybegs Harbour', lat: 54.6370, lon: -8.4360 }, // Offset from pier/station
  { name: 'Greencastle Harbour', lat: 55.1997, lon: -6.9836 },
  { name: 'Castletownbere Harbour', lat: 51.6520, lon: -9.9080 }, // Offset from station
  { name: 'Bantry Harbour', lat: 51.6820, lon: -9.4500 },    // Offset from station
  { name: 'Schull Harbour', lat: 51.5295, lon: -9.5390 },    // Offset from station
  { name: 'Baltimore Harbour', lat: 51.4828, lon: -9.3722 },
  // East Coast additions
  { name: 'Courtown Harbour', lat: 52.6480, lon: -6.2260 },  // Offset from pier/station
  { name: 'Wicklow Harbour', lat: 52.9825, lon: -6.0305 },   // Offset from pier
  { name: 'Arklow Harbour', lat: 52.7995, lon: -6.1390 },    // Offset from pier/station/slipway
  { name: 'Skerries Harbour', lat: 53.5835, lon: -6.1060 },  // Offset from pier/station/slipway
  { name: 'Balbriggan Harbour', lat: 53.6120, lon: -6.1805 }, // Offset from slipway
  { name: 'Dundalk Harbour', lat: 53.9875, lon: -6.3833 },
  // South Coast additions
  { name: 'Youghal Harbour', lat: 51.9565, lon: -7.8420 },   // Offset from pier
  { name: 'Kinsale Harbour', lat: 51.7075, lon: -8.5195 },   // Offset from pier/slipway/station
  { name: 'Union Hall Harbour', lat: 51.5425, lon: -9.1360 }, // Offset from pier/station
  // West Coast additions
  { name: 'Westport Harbour', lat: 53.7995, lon: -9.5195 },  // Offset from pier/station
  { name: 'Sligo Harbour', lat: 54.2715, lon: -8.4720 },     // Offset from station
  { name: 'Roundstone Harbour', lat: 53.4015, lon: -9.9210 }, // Offset from pier
  // Northern Ireland
  { name: 'Belfast Harbour', lat: 54.6110, lon: -5.9250 },   // Offset from station
  { name: 'Bangor Marina', lat: 54.6640, lon: -5.6675 },     // Offset from pier/slipway
  { name: 'Larne Harbour', lat: 54.8550, lon: -5.8100 },     // Offset from station
  { name: 'Portrush Harbour', lat: 55.2080, lon: -6.6530 },  // Offset from pier/station
  { name: 'Coleraine Marina', lat: 55.1333, lon: -6.6667 },
  { name: 'Ardglass Harbour', lat: 54.2630, lon: -5.6030 },  // Offset from pier
  { name: 'Portavogie Harbour', lat: 54.4600, lon: -5.4335 }, // Offset from pier/slipway
  { name: 'Kilkeel Harbour', lat: 54.0635, lon: -5.9900 },   // Offset from pier/slipway
  { name: 'Warrenpoint Harbour', lat: 54.1015, lon: -6.2490 }, // Offset from slipway
  { name: 'Carlingford Marina', lat: 54.0460, lon: -6.1855 }  // Offset from slipway
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
  currentWeatherDaily: null, // Store 7-day weather
  forecastOffset: 0, // 0 = Today, 1 = Tomorrow, etc.
  isLoading: false,
  catches: [], // Will be loaded from Firebase
  currentModalLatLng: null,
  user: JSON.parse(localStorage.getItem('fishing_user') || sessionStorage.getItem('fishing_user') || 'null'),
  authMode: 'login', // 'login' or 'signup'
  allUsers: JSON.parse(localStorage.getItem('fishing_all_users') || '[]'),
  supportMessages: JSON.parse(localStorage.getItem('fishing_support_messages') || '[]'),
  currentReplyUserId: null,
  showArchive: false, // Toggle for viewing posts older than 7 days
  fishingMode: 'sea' // 'sea' or 'freshwater'
};

// ============================================
// Freshwater Fishing Spots Data
// ============================================
const FRESHWATER_SPOTS = [
  // ===== CONNACHT (Galway, Mayo, Sligo, Roscommon, Leitrim) =====
  { id: 'lough_corrib', name: 'Lough Corrib', type: 'Lake', lat: 53.4167, lng: -9.1833, species: ['Brown Trout', 'Pike', 'Salmon', 'Perch'], licenseRequired: true, licenseType: 'Salmon/Sea Trout License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: "Ireland's largest lake. Famous mayfly hatches May-June." },
  { id: 'lough_mask', name: 'Lough Mask', type: 'Lake', lat: 53.60, lng: -9.40, species: ['Brown Trout', 'Pike', 'Ferox Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Crystal clear water. Excellent fly fishing.' },
  { id: 'lough_conn', name: 'Lough Conn', type: 'Lake', lat: 53.95, lng: -9.53, species: ['Salmon', 'Brown Trout', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon/Sea Trout License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Best April-September.' },
  { id: 'lough_cullin', name: 'Lough Cullin', type: 'Lake', lat: 53.87, lng: -9.47, species: ['Brown Trout', 'Pike'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Connected to Lough Conn.' },
  { id: 'lough_beltra', name: 'Lough Beltra', type: 'Lake', lat: 53.83, lng: -9.70, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Scenic Mayo lake.' },
  { id: 'lough_inagh', name: 'Lough Inagh', type: 'Lake', lat: 53.48, lng: -9.85, species: ['Salmon', 'Sea Trout', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Connemara. Part of Ballynahinch system.' },
  { id: 'kylemore_lough', name: 'Kylemore Lough', type: 'Lake', lat: 53.55, lng: -9.88, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'At base of Kylemore Abbey.' },
  { id: 'derryclare_lough', name: 'Derryclare Lough', type: 'Lake', lat: 53.48, lng: -9.82, species: ['Salmon', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Connemara scenic lake.' },
  { id: 'lough_gill', name: 'Lough Gill', type: 'Lake', lat: 54.25, lng: -8.40, species: ['Pike', 'Perch', 'Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Sligo/Leitrim border. Isle of Innisfree.' },
  { id: 'glencar_lake', name: 'Glencar Lake', type: 'Lake', lat: 54.35, lng: -8.38, species: ['Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Scenic lake near waterfall.' },
  { id: 'lough_allen', name: 'Lough Allen', type: 'Lake', lat: 54.08, lng: -8.05, species: ['Pike', 'Perch', 'Bream'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Source of River Shannon.' },
  { id: 'lough_key', name: 'Lough Key', type: 'Lake', lat: 53.98, lng: -8.18, species: ['Pike', 'Perch', 'Bream', 'Roach'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Roscommon. Forest park nearby.' },
  { id: 'lough_rinn', name: 'Lough Rinn', type: 'Lake', lat: 53.90, lng: -7.95, species: ['Pike', 'Perch', 'Bream'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Leitrim. Good coarse fishing.' },
  { id: 'river_moy', name: 'River Moy', type: 'River', lat: 54.10, lng: -9.15, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License + Local Permit', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Top salmon river. Ridge Pool famous.' },
  { id: 'river_erriff', name: 'River Erriff', type: 'River', lat: 53.63, lng: -9.72, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Excellent spate river.' },
  { id: 'owenmore_river', name: 'Owenmore River', type: 'River', lat: 53.90, lng: -9.92, species: ['Salmon'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Mayo salmon fishery.' },

  // ===== MUNSTER (Kerry, Cork, Clare, Limerick, Tipperary, Waterford) =====
  { id: 'killarney_lakes', name: 'Killarney Lakes (Lough Leane)', type: 'Lake', lat: 52.02, lng: -9.52, species: ['Salmon', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Free fishing. Stunning scenery.' },
  { id: 'muckross_lake', name: 'Muckross Lake', type: 'Lake', lat: 52.00, lng: -9.50, species: ['Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Middle Killarney lake.' },
  { id: 'lough_currane', name: 'Lough Currane', type: 'Lake', lat: 51.82, lng: -10.15, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon/Sea Trout License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Waterville. World famous sea trout.' },
  { id: 'caragh_lake', name: 'Caragh Lake', type: 'Lake', lat: 52.00, lng: -9.87, species: ['Salmon', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Kerry gem.' },
  { id: 'barfinnihy_lake', name: 'Barfinnihy Lake', type: 'Lake', lat: 51.93, lng: -9.85, species: ['Rainbow Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Stocked monthly with rainbows.' },
  { id: 'lough_derg', name: 'Lough Derg', type: 'Lake', lat: 52.92, lng: -8.33, species: ['Pike', 'Brown Trout', 'Perch', 'Bream'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Third largest lake. Great pike fishing.' },
  { id: 'lake_inchiquin', name: 'Lake Inchiquin', type: 'Lake', lat: 52.90, lng: -9.05, species: ['Brown Trout', 'Pike'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Clare. Scenic limestone lake.' },
  { id: 'lough_bofinne', name: 'Lough Bofinne', type: 'Lake', lat: 51.70, lng: -9.50, species: ['Rainbow Trout', 'Brown Trout', 'Pike'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Near Bantry. IFI stocked.' },
  { id: 'shepperton_lakes', name: 'Shepperton Lakes', type: 'Lake', lat: 51.55, lng: -9.27, species: ['Rainbow Trout', 'Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Skibbereen. IFI stocked.' },
  { id: 'river_shannon', name: 'River Shannon', type: 'River', lat: 52.67, lng: -8.63, species: ['Salmon', 'Brown Trout', 'Pike', 'Bream', 'Roach'], licenseRequired: true, licenseType: 'Salmon License (salmon only)', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: "Ireland's longest river." },
  { id: 'river_blackwater_munster', name: 'Munster Blackwater', type: 'River', lat: 52.13, lng: -8.00, species: ['Salmon', 'Brown Trout', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License + Permit', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'The Irish Rhine.' },
  { id: 'river_laune', name: 'River Laune', type: 'River', lat: 52.07, lng: -9.75, species: ['Salmon', 'Sea Trout', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Flows from Killarney Lakes.' },
  { id: 'river_feale', name: 'River Feale', type: 'River', lat: 52.45, lng: -9.40, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Kerry/Limerick border.' },
  { id: 'river_suir', name: 'River Suir', type: 'River', lat: 52.35, lng: -7.50, species: ['Salmon', 'Brown Trout', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Three Sisters river.' },
  { id: 'river_bandon', name: 'River Bandon', type: 'River', lat: 51.73, lng: -8.73, species: ['Salmon', 'Sea Trout', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Cork river.' },
  { id: 'river_lee', name: 'River Lee', type: 'River', lat: 51.90, lng: -8.90, species: ['Salmon', 'Sea Trout', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Flows through Cork city.' },

  // ===== LEINSTER (Dublin, Wicklow, Wexford, Carlow, Kilkenny, Laois, Offaly, Westmeath, Longford, Meath, Louth, Kildare) =====
  // Dublin Area
  { id: 'river_liffey', name: 'River Liffey', type: 'River', lat: 53.35, lng: -6.30, species: ['Brown Trout', 'Salmon', 'Sea Trout', 'Roach'], licenseRequired: true, licenseType: 'Salmon License (salmon only)', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Dublin. Free stretch at Islandbridge & above Leixlip.' },
  { id: 'leixlip_reservoir', name: 'Leixlip Reservoir', type: 'Lake', lat: 53.37, lng: -6.48, species: ['Roach', 'Rudd', 'Tench', 'Pike', 'Perch'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Free fishing. Good coarse & pike.' },
  { id: 'royal_canal', name: 'Royal Canal', type: 'River', lat: 53.40, lng: -6.45, species: ['Roach', 'Perch', 'Tench', 'Pike', 'Carp'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Dublin to Shannon. Free coarse fishing. Maynooth stretch good.' },
  { id: 'grand_canal_dublin', name: 'Grand Canal (Dublin)', type: 'River', lat: 53.33, lng: -6.32, species: ['Bream', 'Roach', 'Rudd', 'Tench', 'Carp'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Free fishing. Clondalkin & Dolphins Barn areas.' },
  { id: 'river_tolka', name: 'River Tolka', type: 'River', lat: 53.38, lng: -6.25, species: ['Brown Trout', 'Sea Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'North Dublin. Urban stream with trout.' },
  { id: 'river_dodder', name: 'River Dodder', type: 'River', lat: 53.30, lng: -6.23, species: ['Brown Trout', 'Sea Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'South Dublin. Runs through city.' },
  // Drogheda/Boyne Valley Area
  { id: 'river_boyne', name: 'River Boyne', type: 'River', lat: 53.72, lng: -6.35, species: ['Brown Trout', 'Salmon', 'Sea Trout', 'Bream', 'Roach'], licenseRequired: true, licenseType: 'Salmon License (salmon only)', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Premier trout fishery. Slane, Navan, Trim.' },
  { id: 'river_fane', name: 'River Fane', type: 'River', lat: 54.00, lng: -6.42, species: ['Brown Trout', 'Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Louth/Monaghan. Good wild brown trout.' },
  { id: 'river_dee', name: 'River Dee', type: 'River', lat: 53.95, lng: -6.55, species: ['Brown Trout', 'Salmon'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Louth. Runs to Ardee.' },
  { id: 'river_glyde', name: 'River Glyde', type: 'River', lat: 53.92, lng: -6.57, species: ['Brown Trout', 'Salmon'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Louth. Good brown trout.' },
  // Wicklow
  { id: 'blessington_lakes', name: 'Blessington Lakes', type: 'Lake', lat: 53.15, lng: -6.55, species: ['Brown Trout', 'Pike', 'Perch', 'Roach'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Near Glendalough. Permit required.' },
  { id: 'lough_dan', name: 'Lough Dan', type: 'Lake', lat: 53.08, lng: -6.28, species: ['Brown Trout', 'Minnow', 'Eel'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Wicklow Mountains. Scenic.' },
  { id: 'lough_tay', name: 'Lough Tay (Guinness Lake)', type: 'Lake', lat: 53.10, lng: -6.25, species: ['Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Private but worth noting. Dramatic views.' },
  { id: 'annamoe_trout_fishery', name: 'Annamoe Trout Fishery', type: 'Lake', lat: 53.05, lng: -6.25, species: ['Rainbow Trout', 'Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Near Glendalough. Fly fishing.' },
  { id: 'roundwood_lakes', name: 'Roundwood Lakes', type: 'Lake', lat: 53.07, lng: -6.23, species: ['Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Wicklow. Scenic trout fishing.' },
  // Midlands & Rest of Leinster
  { id: 'lough_ennell', name: 'Lough Ennell', type: 'Lake', lat: 53.45, lng: -7.38, species: ['Brown Trout', 'Perch', 'Pike'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Westmeath. Good trout & coarse.' },
  { id: 'lough_owel', name: 'Lough Owel', type: 'Lake', lat: 53.55, lng: -7.37, species: ['Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Westmeath. Quality trout.' },
  { id: 'lough_derravaragh', name: 'Lough Derravaragh', type: 'Lake', lat: 53.62, lng: -7.32, species: ['Brown Trout', 'Pike', 'Perch'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Children of Lir legend.' },
  { id: 'lough_sheelin', name: 'Lough Sheelin', type: 'Lake', lat: 53.78, lng: -7.33, species: ['Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Famous mayfly fishing.' },
  { id: 'lough_boora', name: 'Lough Boora', type: 'Lake', lat: 53.25, lng: -7.70, species: ['Tench', 'Roach', 'Perch'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Offaly. Great for kids.' },
  { id: 'grand_canal', name: 'Grand Canal (Midlands)', type: 'River', lat: 53.27, lng: -7.05, species: ['Bream', 'Rudd', 'Tench', 'Roach', 'Perch'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Enfield & Edenderry sections.' },
  { id: 'river_barrow', name: 'River Barrow', type: 'River', lat: 52.50, lng: -6.95, species: ['Pike', 'Bream', 'Roach', 'Tench'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Carlow/Kilkenny. Coarse paradise.' },
  { id: 'river_slaney', name: 'River Slaney', type: 'River', lat: 52.67, lng: -6.55, species: ['Salmon', 'Brown Trout', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Wexford/Wicklow salmon river.' },
  { id: 'river_dargle', name: 'River Dargle', type: 'River', lat: 53.18, lng: -6.10, species: ['Salmon', 'Sea Trout', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Wicklow spate river.' },
  { id: 'avonmore_river', name: 'Avonmore River', type: 'River', lat: 52.95, lng: -6.20, species: ['Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Wicklow. Near Glendalough.' },
  { id: 'river_nore', name: 'River Nore', type: 'River', lat: 52.65, lng: -7.25, species: ['Salmon', 'Brown Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Kilkenny. Three Sisters.' },

  // ===== ULSTER - Republic (Donegal, Cavan, Monaghan) =====
  { id: 'rosses_lakes', name: 'Rosses Lakes', type: 'Lake', lat: 54.95, lng: -8.35, species: ['Brown Trout', 'Sea Trout', 'Salmon'], licenseRequired: true, licenseType: 'Salmon License for salmon', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Donegal. 130+ small lakes.' },
  { id: 'dunfanaghy_lakes', name: 'Dunfanaghy Lakes', type: 'Lake', lat: 55.18, lng: -7.97, species: ['Brown Trout'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Donegal. Scenic fishing.' },
  { id: 'lough_eske', name: 'Lough Eske', type: 'Lake', lat: 54.72, lng: -8.02, species: ['Brown Trout', 'Salmon'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Donegal. Near Donegal town.' },
  { id: 'lough_melvin', name: 'Lough Melvin', type: 'Lake', lat: 54.42, lng: -8.15, species: ['Brown Trout', 'Salmon', 'Gillaroo', 'Sonaghan'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Border lake. Unique trout varieties.' },
  { id: 'lough_gowna', name: 'Lough Gowna', type: 'Lake', lat: 53.83, lng: -7.53, species: ['Pike', 'Bream', 'Perch'], licenseRequired: false, licenseType: null, licenseUrl: null, notes: 'Cavan. Excellent pike.' },
  { id: 'river_finn', name: 'River Finn', type: 'River', lat: 54.80, lng: -7.72, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Donegal. Spring salmon.' },
  { id: 'river_drowes', name: 'River Drowes', type: 'River', lat: 54.47, lng: -8.25, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Donegal/Leitrim. First salmon often here.' },
  { id: 'gweebarra_river', name: 'Gweebarra River', type: 'River', lat: 54.90, lng: -8.25, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Donegal spate river.' },
  { id: 'owenea_river', name: 'Owenea River', type: 'River', lat: 54.77, lng: -8.37, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Salmon License', licenseUrl: 'https://fishinginireland.info/angling-licences/', notes: 'Donegal spate river.' },

  // ===== NORTHERN IRELAND =====
  { id: 'lower_lough_erne', name: 'Lower Lough Erne', type: 'Lake', lat: 54.45, lng: -7.75, species: ['Pike', 'Bream', 'Roach', 'Brown Trout'], licenseRequired: true, licenseType: 'DAERA Rod License + Permit', licenseUrl: 'https://www.nidirect.gov.uk/articles/freshwater-angling', notes: 'Fermanagh. Excellent coarse & pike.' },
  { id: 'upper_lough_erne', name: 'Upper Lough Erne', type: 'Lake', lat: 54.18, lng: -7.52, species: ['Pike', 'Bream', 'Roach', 'Perch', 'Tench'], licenseRequired: true, licenseType: 'DAERA Rod License + Permit', licenseUrl: 'https://www.nidirect.gov.uk/articles/freshwater-angling', notes: 'Fermanagh. Exceptional pike.' },
  { id: 'lough_neagh', name: 'Lough Neagh', type: 'Lake', lat: 54.62, lng: -6.40, species: ['Pike', 'Perch', 'Bream', 'Roach', 'Pollan', 'Trout'], licenseRequired: true, licenseType: 'DAERA Rod License + Permit/Ticket', licenseUrl: 'https://www.nidirect.gov.uk/articles/freshwater-angling', notes: 'Largest lake in British Isles.' },
  { id: 'lough_beg', name: 'Lough Beg', type: 'Lake', lat: 54.78, lng: -6.48, species: ['Pike'], licenseRequired: true, licenseType: 'DAERA Rod License + Permit/Ticket', licenseUrl: 'https://www.nidirect.gov.uk/articles/freshwater-angling', notes: 'Antrim. Premier pike fishery.' },
  { id: 'camlough_lake', name: 'Camlough Lake', type: 'Lake', lat: 54.12, lng: -6.38, species: ['Pike', 'Bream', 'Roach', 'Perch'], licenseRequired: true, licenseType: 'DAERA Rod License + Permit', licenseUrl: 'https://www.nidirect.gov.uk/articles/freshwater-angling', notes: 'Armagh. Coarse fishing.' },
  { id: 'clay_lake', name: 'Clay Lake', type: 'Lake', lat: 54.25, lng: -6.72, species: ['Pike', 'Perch'], licenseRequired: true, licenseType: 'DAERA Rod License + Permit', licenseUrl: 'https://www.nidirect.gov.uk/articles/freshwater-angling', notes: 'Armagh pike fishery.' },
  { id: 'river_bush', name: 'River Bush', type: 'River', lat: 55.20, lng: -6.52, species: ['Salmon', 'Sea Trout', 'Brown Trout'], licenseRequired: true, licenseType: 'DAERA Rod License + Local Permit', licenseUrl: 'https://www.nidirect.gov.uk/articles/game-angling', notes: 'Famous NI salmon river.' },
  { id: 'river_bann_lower', name: 'Lower River Bann', type: 'River', lat: 54.85, lng: -6.67, species: ['Salmon', 'Roach', 'Bream', 'Pike'], licenseRequired: true, licenseType: 'DAERA Rod License + Permit', licenseUrl: 'https://www.nidirect.gov.uk/articles/game-angling', notes: 'Portglenone. Top coarse venue.' },
  { id: 'river_foyle', name: 'River Foyle', type: 'River', lat: 54.98, lng: -7.32, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Loughs Agency License + Permit', licenseUrl: 'https://www.loughs-agency.org/', notes: 'Cross-border. Excellent salmon.' },
  { id: 'river_mourne_ni', name: 'River Mourne/Strule', type: 'River', lat: 54.60, lng: -7.30, species: ['Salmon', 'Sea Trout'], licenseRequired: true, licenseType: 'Loughs Agency License + Permit', licenseUrl: 'https://www.loughs-agency.org/', notes: 'Tyrone. Salmon & sea trout.' }
];

// ============================================
// Freshwater Fishing Parks Data
// ============================================
const FRESHWATER_PARKS = [
  { id: 'lough_boora', name: 'Lough Boora Discovery Park', lat: 53.25, lng: -7.70, county: 'Offaly', species: ['Tench', 'Roach', 'Perch'], notes: 'Excellent for families. April-October.', website: 'https://www.loughboora.com/' },
  { id: 'lough_key_park', name: 'Lough Key Forest Park', lat: 53.98, lng: -8.18, county: 'Roscommon', species: ['Pike', 'Perch', 'Bream'], notes: 'Fishing from docks. Coillte managed.', website: 'https://www.loughkey.ie/' },
  { id: 'corkagh_park', name: 'Corkagh Park Fishery', lat: 53.31, lng: -6.40, county: 'Dublin', species: ['Rainbow Trout', 'Brown Trout'], notes: 'Wheelchair accessible. Urban fishery.', website: null },
  { id: 'rathbeggan_lakes', name: 'Rathbeggan Lakes', lat: 53.62, lng: -6.62, county: 'Meath', species: ['Rainbow Trout'], notes: 'Stocked fishery. Family friendly.', website: 'https://www.rathbegganlakes.ie/' },
  { id: 'lough_muckno', name: 'Lough Muckno Leisure Park', lat: 54.07, lng: -6.70, county: 'Monaghan', species: ['Pike', 'Bream', 'Rudd', 'Perch'], notes: 'Public park. Good coarse fishing.', website: null },
  { id: 'annagh_lake_park', name: 'Annagh Lake', lat: 53.83, lng: -6.95, county: 'Cavan', species: ['Rainbow Trout', 'Brown Trout'], notes: 'Stocked May-September.', website: null },
  { id: 'castle_lake', name: 'Castle Lake (Virginia)', lat: 53.83, lng: -7.08, county: 'Cavan', species: ['Pike', 'Perch', 'Bream'], notes: 'Disabled angling facilities.', website: null },
  { id: 'oaklands_lake', name: 'Oaklands Lake', lat: 52.40, lng: -6.95, county: 'Wexford', species: ['Coarse Fish'], notes: 'New Ross. Accessible stands.', website: null },
  { id: 'ballyshunnock', name: 'Ballyshunnock Reservoir', lat: 52.22, lng: -7.18, county: 'Waterford', species: ['Brown Trout'], notes: 'Scenic reservoir. Fly fishing.', website: null },
  { id: 'laois_angling', name: 'Laois Angling Centre', lat: 53.05, lng: -7.55, county: 'Laois', species: ['Rainbow Trout', 'Brown Trout', 'Carp', 'Bream'], notes: 'Multiple lakes. Well stocked.', website: 'https://www.laoisanglingcentre.ie/' },
  { id: 'angling_for_all', name: 'Angling for All (Aughrim)', lat: 52.85, lng: -6.32, county: 'Wicklow', species: ['Rainbow Trout', 'Brown Trout'], notes: 'National disabled facility. Year round.', website: null },
  { id: 'tinnehinch', name: 'Tinnehinch Fly Fishery', lat: 53.18, lng: -6.17, county: 'Wicklow', species: ['Rainbow Trout'], notes: 'Enniskerry. Open all year.', website: null },
  { id: 'annamoe_fishery', name: 'Annamoe Trout Fishery', lat: 53.05, lng: -6.25, county: 'Wicklow', species: ['Rainbow Trout', 'Brown Trout'], notes: 'Near Glendalough. Fly & bait.', website: null },
  { id: 'rathcon_fishery', name: 'Rathcon Trout Fishery', lat: 53.02, lng: -6.28, county: 'Wicklow', species: ['Rainbow Trout'], notes: '8.5 acre lake. Open all year.', website: null }
];

// ============================================
// Freshwater Boat Ramps/Slipways Data
// ============================================
const FRESHWATER_RAMPS = [
  { id: 'killaloe_slip', name: 'Killaloe Slipway', lat: 52.80, lng: -8.44, waterway: 'Lough Derg', type: 'Public', notes: 'Main access to Lough Derg south.' },
  { id: 'dromineer_slip', name: 'Dromineer Slipway', lat: 52.93, lng: -8.27, waterway: 'Lough Derg', type: 'Public', notes: 'Good parking. Marina nearby.' },
  { id: 'garrykennedy_slip', name: 'Garrykennedy Slipway', lat: 52.90, lng: -8.22, waterway: 'Lough Derg', type: 'Public', notes: 'Scenic harbour access.' },
  { id: 'portumna_slip', name: 'Portumna Slipway', lat: 53.09, lng: -8.22, waterway: 'Lough Derg', type: 'Public', notes: 'Near Portumna Castle.' },
  { id: 'carrick_shannon', name: 'Carrick-on-Shannon Slipway', lat: 53.95, lng: -8.10, waterway: 'River Shannon', type: 'Public', notes: 'Town centre. Waterways Ireland.' },
  { id: 'athlone_slip', name: 'Athlone Slipway', lat: 53.42, lng: -7.95, waterway: 'River Shannon', type: 'Public', notes: 'Central location.' },
  { id: 'banagher_slip', name: 'Banagher Slipway', lat: 53.19, lng: -7.99, waterway: 'River Shannon', type: 'Public', notes: 'River access. Good facilities.' },
  { id: 'roosky_slip', name: 'Roosky Slipway', lat: 53.83, lng: -7.92, waterway: 'River Shannon', type: 'Public', notes: 'Shannon navigation access.' },
  { id: 'lough_key_slip', name: 'Lough Key Slipway', lat: 53.97, lng: -8.17, waterway: 'Lough Key', type: 'Public', notes: 'Forest park access.' },
  { id: 'enniskillen_slip', name: 'Enniskillen Slipway', lat: 54.35, lng: -7.63, waterway: 'Lower Lough Erne', type: 'Public', notes: 'NI. Waterways Ireland.' },
  { id: 'belturbet_slip', name: 'Belturbet Slipway', lat: 54.10, lng: -7.45, waterway: 'River Erne', type: 'Public', notes: 'Border area access.' },
  { id: 'graiguenamanagh', name: 'Graiguenamanagh Slipway', lat: 52.54, lng: -6.95, waterway: 'River Barrow', type: 'Public', notes: 'Barrow Navigation.' }
];

// ============================================
// Freshwater Piers/Platforms Data
// ============================================
const FRESHWATER_PIERS = [
  { id: 'athlone_platform', name: 'Athlone Fishing Platform', lat: 53.42, lng: -7.94, waterway: 'River Shannon', accessible: true, notes: 'Wheelchair accessible stand.' },
  { id: 'moy_platform', name: 'River Moy Angling Platform', lat: 54.11, lng: -9.17, waterway: 'River Moy', accessible: true, notes: '76m wheelchair accessible. IFI built.' },
  { id: 'lough_ree_pier', name: 'Lough Ree Fishing Stand', lat: 53.52, lng: -7.95, waterway: 'Lough Ree', accessible: true, notes: 'Access for All boat available.' },
  { id: 'portumna_pier', name: 'Portumna Fishing Pier', lat: 53.09, lng: -8.21, waterway: 'Lough Derg', accessible: false, notes: 'Stone pier. Good for pike.' },
  { id: 'ballina_pier', name: 'Ballina Ridge Pool Stand', lat: 54.11, lng: -9.15, waterway: 'River Moy', accessible: false, notes: 'Famous salmon pool.' },
  { id: 'enniskillen_stand', name: 'Enniskillen Fishing Stand', lat: 54.35, lng: -7.64, waterway: 'Lower Lough Erne', accessible: true, notes: 'NI. Good coarse fishing.' },
  { id: 'cootehill_stand', name: 'Cootehill Lake Stand', lat: 54.07, lng: -7.08, waterway: 'Cootehill Lakes', accessible: false, notes: 'Cavan. Pike & bream.' },
  { id: 'virginia_stand', name: 'Virginia Lake Stand', lat: 53.83, lng: -7.08, waterway: 'Virginia Lake', accessible: true, notes: 'Disabled facilities.' },
  { id: 'mullingar_stand', name: 'Lough Ennell Stand', lat: 53.45, lng: -7.40, waterway: 'Lough Ennell', accessible: false, notes: 'Westmeath. Trout fishing.' },
  { id: 'carrick_stand', name: 'Carrick-on-Shannon Stand', lat: 53.94, lng: -8.09, waterway: 'River Shannon', accessible: true, notes: 'Town centre. Coarse fishing.' }
];

// ============================================
// Utility Functions
// ============================================
function getTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown';

  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

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

      // Also refresh active reply thread if open
      if (document.getElementById('admin-reply-modal').classList.contains('active') && state.currentReplyUserId) {
        const thread = state.supportMessages.filter(m => m.userId === state.currentReplyUserId);
        renderAdminReplyThread(thread);
      }
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



// ============================================
// Navigation Logic
// ============================================
window.showPage = (pageId) => {
  // Gating check for Community tab
  if (pageId === 'community') {
    const overlay = document.getElementById('community-gating-overlay');
    const loginPrompt = document.getElementById('community-login-prompt');
    const premiumPrompt = document.getElementById('community-premium-prompt');

    if (overlay && loginPrompt && premiumPrompt) {
      if (!state.user) {
        // User not logged in - show login prompt
        overlay.style.display = 'flex';
        loginPrompt.style.display = 'block';
        premiumPrompt.style.display = 'none';
      } else if (state.user.plan !== 'pro') {
        // User logged in but not pro - show premium prompt
        overlay.style.display = 'flex';
        loginPrompt.style.display = 'none';
        premiumPrompt.style.display = 'block';
      } else {
        // User is pro - hide overlay
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

  // [MONETIZATION] Trigger high-revenue ad when visiting Dashboard
  if (pageId === 'home') {
    triggerRevenueAd();
  }
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
    setTimeout(() => initAdminMap(), 100);
  }
};

// Check if current user is admin
function isAdmin() {
  return state.user && CONFIG.ADMIN_EMAILS.map(e => e.toLowerCase()).includes(state.user.email?.toLowerCase());
}

// Refresh community gating overlay based on current user state
window.refreshCommunityGating = function () {
  const overlay = document.getElementById('community-gating-overlay');
  const loginPrompt = document.getElementById('community-login-prompt');
  const premiumPrompt = document.getElementById('community-premium-prompt');

  if (overlay && loginPrompt && premiumPrompt) {
    if (!state.user) {
      // User not logged in - show login prompt
      overlay.style.display = 'flex';
      loginPrompt.style.display = 'block';
      premiumPrompt.style.display = 'none';
    } else if (state.user.plan !== 'pro') {
      // User logged in but not pro - show premium prompt
      overlay.style.display = 'flex';
      loginPrompt.style.display = 'none';
      premiumPrompt.style.display = 'block';
    } else {
      // User is pro - hide overlay
      overlay.style.display = 'none';
    }
  }
};

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
    // Use updates to preserve fields not present in the local user object (like password if missing)
    // Actually, state.allUsers should have password. We use set for full consistency or update for safety.
    userRef.set({
      ...user,
      lastActive: Date.now()
    }).catch(err => console.error('Firebase sync failed:', err));
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
  // Verify if current session is still active (not deactivated by admin)
  verifySessionStatus();

  updateClock();
  setInterval(updateClock, 1000);
  initMap();
  loadStationList();
  // Delay to ensure DOM elements are ready before syncing live data
  setTimeout(() => fetchAllLiveStationData(), 500);
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

    // Check for mandatory legal consent after loading
    checkLegalConsent();
  }, 6500); // 1s delay + 5s fill animation
});

// [BETA BANNER LOGIC REMOVED FOR V1.1.0]

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

      alert('Welcome to Irish Fishing Hub Pro! Your payment was successful.');
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
    attributionControl: true,
    zoomSnap: 0,
    zoomDelta: 0.25,
    wheelPxPerZoomLevel: 60
  }).setView(CONFIG.mapCenter, CONFIG.mapZoom);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.map);

  // Create layer groups (but don't add to map yet - map starts empty)
  state.shopMarkers = L.layerGroup();
  state.pierMarkers = L.layerGroup();
  state.rampMarkers = L.layerGroup();
  state.harbourMarkers = L.layerGroup();

  // Prepare station markers (but don't add to map yet)
  CONFIG.stations.forEach(station => {
    addStationMarker(station);
  });

  // Prepare pier markers
  PIERS.forEach(pier => {
    const icon = L.divIcon({
      className: 'pier-marker-wrapper',
      html: `<div class="pier-marker" title="${pier.name}">??</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const marker = L.marker([pier.lat, pier.lon], { icon })
      .bindPopup(`
        <div class="popup-content">
          <strong>${pier.name}</strong>
          <span class="popup-type">Fishing Pier</span>
          <button class="popup-directions-btn" onclick="getDirections(${pier.lat}, ${pier.lon})">?? Get Directions</button>
        </div>
      `);
    state.pierMarkers.addLayer(marker);
  });

  // Prepare boat ramp markers
  BOAT_RAMPS.forEach(ramp => {
    const icon = L.divIcon({
      className: 'ramp-marker-wrapper',
      html: `<div class="ramp-marker" title="${ramp.name}">??</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const marker = L.marker([ramp.lat, ramp.lon], { icon })
      .bindPopup(`
        <div class="popup-content">
          <strong>${ramp.name}</strong>
          <span class="popup-type">Boat Ramp / Slipway</span>
          <button class="popup-directions-btn" onclick="getDirections(${ramp.lat}, ${ramp.lon})">?? Get Directions</button>
        </div>
      `);
    state.rampMarkers.addLayer(marker);
  });

  // Prepare harbour markers
  HARBOURS.forEach(harbour => {
    const icon = L.divIcon({
      className: 'harbour-marker-wrapper',
      html: `<div class="harbour-marker" title="${harbour.name}">???</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const marker = L.marker([harbour.lat, harbour.lon], { icon })
      .bindPopup(`
        <div class="popup-content">
          <strong>${harbour.name}</strong>
          <span class="popup-type">Harbour</span>
          <button class="popup-directions-btn" onclick="getDirections(${harbour.lat}, ${harbour.lon})">?? Get Directions</button>
        </div>
      `);
    state.harbourMarkers.addLayer(marker);
  });

  // Prepare tackle shops from static array and Firebase (but don't add to map yet)
  loadShopsToMainMap();

  // Prepare freshwater fishing markers (but don't add to map yet)
  renderFreshwaterSpots();
  renderFreshwaterParks();
  renderFreshwaterRamps();
  renderFreshwaterPiers();

  // Log that map is ready but empty
  console.log('Map loaded. Apply filters to show locations.');
}

// Load all shops (static + Firebase) to main map
async function loadShopsToMainMap() {
  if (!state.shopMarkers) return;
  state.shopMarkers.clearLayers();

  // Add static TACKLE_SHOPS
  TACKLE_SHOPS.forEach(shop => {
    const icon = L.divIcon({
      className: 'shop-marker-wrapper',
      html: '<div class="shop-marker">??</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const marker = L.marker([shop.lat, shop.lng || shop.lon], { icon })
      .bindPopup(`
        <div class="popup-content">
          <strong>${shop.name}</strong>
          <span class="popup-type">Tackle Shop</span>
          ${shop.address ? `<p style="font-size:0.8rem;margin:4px 0">${shop.address}</p>` : ''}
          ${shop.phone ? `<a href="tel:${shop.phone}" style="font-size:0.8rem">?? ${shop.phone}</a>` : ''}
          <button class="popup-directions-btn" onclick="getDirections(${shop.lat}, ${shop.lng || shop.lon})">?? Get Directions</button>
        </div>
      `);
    state.shopMarkers.addLayer(marker);
  });

  // Load admin-added shops from Firebase
  try {
    const snapshot = await firebase.database().ref('locations').once('value');
    const data = snapshot.val();
    if (data) {
      // Sea shops
      if (data.sea && data.sea.shops) {
        Object.values(data.sea.shops).forEach(shop => {
          if (shop.id) addFirebaseShopMarker(shop);
        });
      }
      // Freshwater shops
      if (data.freshwater && data.freshwater.shops) {
        Object.values(data.freshwater.shops).forEach(shop => {
          if (shop.id) addFirebaseShopMarker(shop);
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load admin shops:', err);
  }
}

function addFirebaseShopMarker(shop) {
  const icon = L.divIcon({
    className: 'shop-marker-wrapper',
    html: '<div class="shop-marker">??</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
  const marker = L.marker([shop.lat, shop.lon], { icon })
    .bindPopup(`
      <div class="popup-content">
        <strong>${shop.name}</strong>
        <span class="popup-type">Tackle Shop</span>
        ${shop.description ? `<p style="font-size:0.8rem;margin:4px 0">${shop.description}</p>` : ''}
        <button class="popup-directions-btn" onclick="getDirections(${shop.lat}, ${shop.lon})">?? Get Directions</button>
      </div>
    `);
  state.shopMarkers.addLayer(marker);
}

// Open Google Maps with directions to coordinates
window.getDirections = (lat, lon) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  window.open(url, '_blank');
};

// Helper to update the filter button state
window.updateFilterButton = (mode) => {
  const btn = document.getElementById('filter-toggle-btn');
  if (!btn) return;

  if (mode === 'confirm') {
    btn.classList.add('confirm-mode');
    btn.innerHTML = '<span class="filter-toggle-icon">?</span><span class="filter-toggle-text">Confirm</span>';
  } else if (mode === 'sea') {
    btn.classList.remove('confirm-mode');
    btn.innerHTML = '<span class="filter-toggle-icon">???</span><span class="filter-toggle-text">Map Layers</span>';
  } else if (mode === 'freshwater') {
    btn.classList.remove('confirm-mode');
    btn.innerHTML = '<span class="filter-toggle-icon">???</span><span class="filter-toggle-text">Filters</span>';
  }
};

window.toggleFilterPanel = () => {
  const sidebar = document.getElementById('filter-sidebar');
  const overlay = document.getElementById('filter-overlay');

  if (sidebar && overlay) {
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      // If open, button acts as Apply
      applyFilters();
    } else {
      // If closed, open and change button to Confirm
      sidebar.classList.add('open');
      overlay.classList.add('active');
      updateFilterButton('confirm');
    }
  }
};

window.closeFilterPanel = () => {
  const sidebar = document.getElementById('filter-sidebar');
  const overlay = document.getElementById('filter-overlay');

  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  updateFilterButton('sea');
};

window.applyFilters = (closePanel = true) => {
  if (closePanel) {
    closeFilterPanel();
  }
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

  // Close the panel if requested
  if (closePanel) closeFilterPanel();
};

// Toggle Station List (Collapsible)
window.toggleStationList = () => {
  const list = document.getElementById('station-list');
  const icon = document.getElementById('station-collapse-icon');

  if (list && icon) {
    if (list.classList.contains('collapsed')) {
      list.classList.remove('collapsed');
      icon.textContent = '?';
    } else {
      list.classList.add('collapsed');
      icon.textContent = '?';
    }
  }
};

// Toggle Region Areas (East Coast, North West, etc.)
window.toggleRegion = (headerElement) => {
  const regionContent = headerElement.nextElementSibling;

  if (regionContent && regionContent.classList.contains('region-content')) {
    // Toggle collapsed class
    regionContent.classList.toggle('collapsed');

    // Toggle expanded class on header for chevron rotation
    headerElement.classList.toggle('expanded');
  }
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
    html: `<div class="tide-marker ${station.status === 'offline' ? 'offline' : ''}" data-station="${station.id}">??</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  const marker = L.marker([station.lat, station.lon], { icon })
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

  // Always show the card so the user knows we checked
  shopsCard.style.display = 'block';
  shopList.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>Searching for shops...</span></div>';

  // Find shops in the same region as the station
  const stationRegion = station.region || 'East Coast';
  // Use a slightly larger radius (60km) to catch more rural shops
  const nearbyShops = TACKLE_SHOPS.filter(shop => {
    // Match by region or find closest shops by distance
    const dist = getDistanceKm(station.lat, station.lon, shop.lat, shop.lng || shop.lon);
    return (shop.county && stationRegion.toLowerCase().includes(shop.county.toLowerCase().split(' ')[0])) || dist < 60;
  });

  // Sort by distance
  nearbyShops.sort((a, b) => {
    const distA = getDistanceKm(station.lat, station.lon, a.lat, a.lng || a.lon);
    const distB = getDistanceKm(station.lat, station.lon, b.lat, b.lng || b.lon);
    return distA - distB;
  });

  if (nearbyShops.length === 0) {
    shopList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">??</div>
        <p>No tackle shops found within 60km.</p>
        <button class="btn btn-sm btn-outline" onclick="loadPage('directory')">View National Directory</button>
      </div>
    `;
    return;
  }

  shopList.innerHTML = nearbyShops.slice(0, 5).map(shop => {
    const dist = getDistanceKm(station.lat, station.lon, shop.lat, shop.lng || shop.lon).toFixed(1);
    const lat = shop.lat;
    const lon = shop.lng || shop.lon;
    const name = shop.name.replace(/'/g, "\\'");
    const addr = (shop.address || '').replace(/'/g, "\\'");
    const phone = (shop.phone || '').replace(/'/g, "\\'");

    return `
    <div class="shop-item" onclick="openShopDetails(${lat}, ${lon}, '${name}', '${addr}', '', '${phone}', '')">
      <div class="shop-name">${shop.name}</div>
      <div class="shop-meta">
        <span>?? ${dist}km away</span>
        <span>${shop.phone ? '?? ' + shop.phone : ''}</span>
      </div>
    </div>
  `}).join('');
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

function findNearestLiveStation(inputStation) {
  if (inputStation.live) return inputStation;

  let nearest = null;
  let minDistance = Infinity;

  CONFIG.stations.filter(s => s.live).forEach(s => {
    const dist = getDistanceKm(inputStation.lat, inputStation.lon, s.lat, s.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = s;
    }
  });

  return nearest;
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
      <div class="region-group collapsed">
        <div class="region-header" onclick="toggleRegion(this)">
          <span class="region-title">${region}</span>
          <span class="region-chevron">?</span>
        </div>
        <div class="region-content">
          ${stations.map(station => {
      const { level, direction } = calculateTideLevel(now, station);
      const arrow = direction === 'rising' ? '?' : direction === 'falling' ? '?' : '';
      // LIVE badge will be added dynamically when API data is received
      return `
              <div class="station-item" data-station="${station.id}" data-station-index="${CONFIG.stations.indexOf(station)}">
                <div class="station-indicator ${station.status === 'offline' ? 'offline' : ''}"></div>
                <span class="station-name">${station.name}<span id="live-badge-${station.id}"></span></span>
                <span class="station-level" id="level-${station.id}">${level.toFixed(1)}m ${arrow}</span>
              </div>
            `;
    }).join('')}
        </div>
      </div >
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
  // Update non-live stations with calculated values
  CONFIG.stations.forEach(station => {
    const levelEl = document.getElementById(`level-${station.id}`);
    if (levelEl && !state.tideData[station.id]) {
      const { level, direction } = calculateTideLevel(now, station);
      const arrow = direction === 'rising' ? '?' : direction === 'falling' ? '?' : '';
      levelEl.textContent = `${level.toFixed(1)}m ${arrow}`;
    }
  });
}

// Fetch real tide data for all live stations and sync sidebar
async function fetchAllLiveStationData() {
  console.log('?? fetchAllLiveStationData() called');
  try {
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const url = `${CONFIG.apiBase}.json?station_id,time,Water_Level_LAT&time>=${past24h.toISOString()}&orderBy("time")`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();

    // Group data by station
    const stationDataMap = {};
    data.table.rows.forEach(row => {
      const stationId = row[0];
      if (!stationDataMap[stationId]) stationDataMap[stationId] = [];
      stationDataMap[stationId].push(row);
    });

    console.log('API returned station IDs:', Object.keys(stationDataMap));
    console.log('Config station IDs:', CONFIG.stations.map(s => s.id));

    // Update sidebar for live stations
    let updatedCount = 0;
    CONFIG.stations.forEach(station => {
      const sidebarLevel = document.getElementById(`level-${station.id}`);
      if (!sidebarLevel) {
        console.warn(`Element not found for station: ${station.id}`);
        return;
      }

      const stationData = stationDataMap[station.id];
      if (stationData && stationData.length > 0) {
        const latest = stationData[stationData.length - 1];
        const level = latest[2];

        // Skip if level is null or undefined
        if (level == null) {
          console.warn(`Null water level for station: ${station.id}`);
          return;
        }

        let dir = 'stable';
        if (stationData.length >= 2) {
          const prev = stationData[stationData.length - 2][2];
          if (prev != null) {
            dir = level > prev ? 'rising' : level < prev ? 'falling' : 'stable';
          }
        }
        const icon = dir === 'rising' ? '?' : dir === 'falling' ? '?' : '';
        sidebarLevel.innerHTML = `${level.toFixed(1)}m ${icon}`;
        state.tideData[station.id] = stationData;

        // Add LIVE badge since we have real API data
        const liveBadge = document.getElementById(`live-badge-${station.id}`);
        if (liveBadge && !liveBadge.innerHTML) {
          liveBadge.innerHTML = '<span class="live-badge">LIVE</span>';
        }

        updatedCount++;
      } else {
        console.warn(`No API data for station: ${station.id}`);
      }
    });

    console.log(`All live station data synced to sidebar (${updatedCount} stations updated)`);
  } catch (err) {
    console.error('Failed to fetch all station data:', err);
  }
}

function updateLocationInfo(station) {
  const container = document.getElementById('location-info');
  let maintHtml = '';

  if (station.status === 'offline') {
    const m = station.maintenance || { reason: 'Offline', duration: 'Unknown', restoration: 'TBD' };
    maintHtml = `
      <div class="maintenance-info fade-in">
        <div class="maintenance-icon">??</div>
        <div class="maintenance-text">
          <div class="maintenance-title"><span class="maintenance-dot"></span>OFFLINE</div>
          <div class="maintenance-detail"><strong>Reason:</strong> ${m.reason}</div>
          <div class="maintenance-detail"><strong>Restoration:</strong> ${m.restoration}</div>
        </div>
      </div >
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
    const url = `${CONFIG.apiBase}.json?station_id,time,Water_Level_LAT&station_id="${station.id}"&time>=${past24h.toISOString()}&orderBy("time")`;

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
    console.error(`Failed to fetch tide data for ${station.id}: `, err);
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

  const icon = dir === 'rising' ? '?' : dir === 'falling' ? '?' : '?';
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

// Inline Forecast Navigation
window.navigateForecast = (delta) => {
  const newOffset = state.forecastOffset + delta;

  // Limit: -7 days (past) to +7 days (future)
  if (newOffset < -7 || newOffset > 7) return;

  state.forecastOffset = newOffset;

  // Re-render components that depend on the day
  updateForecastHeaders();

  // Re-fetch or re-render
  // If we have daily weather data, update display
  const weatherData = state.currentWeatherDaily;
  if (weatherData) {
    // Determine index for daily data.
    const idx = newOffset;

    if (idx >= 0 && idx < weatherData.time.length) {
      // We need to render the forecast view directly as displayWeatherData is for current weather
      renderForecastView();
    } else {
      const wContainer = document.getElementById('weather-display');
      if (wContainer) wContainer.innerHTML = '<div class="empty-state"><p>No forecast data available for this day.</p></div>';
    }
  }

  // Re-render tides
  displayTideTimes([]);
};

function updateForecastHeaders() {
  const date = new Date();
  date.setDate(date.getDate() + state.forecastOffset);

  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  const dateStr = state.forecastOffset === 0 ? "Today" : date.toLocaleDateString('en-IE', options);

  const weatherTitle = document.getElementById('weather-card-title');
  const tideTitle = document.getElementById('tide-card-title');

  if (weatherTitle) weatherTitle.innerText = state.forecastOffset === 0 ? "??? Local Weather" : `??? Weather(${dateStr})`;
  if (tideTitle) tideTitle.innerText = state.forecastOffset === 0 ? "? Today's Tides" : `? Tides(${dateStr})`;
}

function renderForecastView() {
  if (!state.selectedStation || !state.currentWeatherDaily) return;

  // Update Weather Card
  const d = state.currentWeatherDaily;
  // Limit offset to 0-6 for now as API default is 7 days forward
  const idx = state.forecastOffset;

  if (idx >= 0 && idx < d.time.length) {
    const container = document.getElementById('weather-display');
    const w = mapWeatherCode(d.weather_code[idx]);

    container.innerHTML = `
      <div class="weather-main fade-in">
        <div class="weather-temp-section">
          <div class="weather-icon">${w.icon}</div>
          <div>
            <div class="weather-temp">${Math.round(d.temperature_2m_max[idx])}°C</div>
            <div class="weather-condition">${w.description}</div>
            <div class="weather-label">Low: ${Math.round(d.temperature_2m_min[idx])}°C</div>
          </div>
        </div>
      </div >
      `;
  } else {
    document.getElementById('weather-display').innerHTML = '<div class="empty-state"><p>No forecast data available for this day.</p></div>';
  }
}

// Override displayTideTimes to handle offset
function displayTideTimes(data) {
  const container = document.getElementById('tide-times');

  // We need to generate tides for the specific offset day
  // generateSevenDayTides returns an array of days.
  // We can reuse that or calculate on fly.

  if (!state.selectedStation) {
    container.innerHTML = '<div class="empty-state"><p>Select a station</p></div>';
    return;
  }

  const station = state.selectedStation;
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  dayStart.setDate(dayStart.getDate() + state.forecastOffset);

  // Calculate tides for this specific day using improved logic
  const dayExtremes = [];
  const step = 15 * 60 * 1000;
  const tStart = dayStart.getTime();
  const tEnd = tStart + 24 * 60 * 60 * 1000;

  let prevLvl = calculateTideLevel(new Date(tStart - step), station).level;
  let currLvl = calculateTideLevel(new Date(tStart), station).level;

  for (let t = tStart + step; t <= tEnd; t += step) {
    const nextLvl = calculateTideLevel(new Date(t), station).level;
    if (currLvl > prevLvl && currLvl > nextLvl) dayExtremes.push({ type: 'High', time: t, level: currLvl });
    else if (currLvl < prevLvl && currLvl < nextLvl) dayExtremes.push({ type: 'Low', time: t, level: currLvl });
    prevLvl = currLvl;
    currLvl = nextLvl;
  }

  container.innerHTML = dayExtremes.map(e => `
    <div class="tide-time-item ${e.type.toLowerCase()}">
      <div class="tide-time-label">${e.type.toUpperCase()} TIDE</div>
      <div class="tide-time-value">${new Date(e.time).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</div>
      <div class="tide-time-height">${e.level.toFixed(2)}m</div>
    </div >
      `).join('');

  // Show empty if none found (rare for semidiurnal)
  if (dayExtremes.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No highs/lows calculated.</p></div>';
  }
}



function generateSevenDayTides(station) {
  const days = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Generate for next 7 days
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = dayDate.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' });

    // Simple harmonic prediction for daily highs/lows
    // A full tidal day is approx 24h 50m. Highs shift by ~50m each day.
    // We start from current time and project forward.
    // This is improved by using the calculateTideLevel over a 24h window for each day.

    // Find highs/lows for this specific day
    const dayExtremes = [];
    const step = 15 * 60 * 1000; // 15 min steps
    const dayStart = dayDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    let prevLvl = calculateTideLevel(new Date(dayStart - step), station).level;
    let currLvl = calculateTideLevel(new Date(dayStart), station).level;

    for (let t = dayStart + step; t <= dayEnd; t += step) {
      const nextLvl = calculateTideLevel(new Date(t), station).level;

      if (currLvl > prevLvl && currLvl > nextLvl) {
        dayExtremes.push({ type: 'High', time: t, level: currLvl });
      } else if (currLvl < prevLvl && currLvl < nextLvl) {
        dayExtremes.push({ type: 'Low', time: t, level: currLvl });
      }
      prevLvl = currLvl;
      currLvl = nextLvl;
    }

    days.push({ date: dateStr, tides: dayExtremes });
  }
  return days;
}

// Keeping this for fallback/legacy display if needed
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
  // 1. Try to find a nearby live reference station
  const refStation = findNearestLiveStation(station);
  let refData = null;

  if (refStation && state.tideData[refStation.id]) {
    refData = state.tideData[refStation.id];
  }

  // 2. Base Calculation (harmonic approximation)
  const period = 12.42 * 60 * 60 * 1000;
  const mean = 2.5;
  const phase = station.lon * (period / 360);

  // If we have live reference data, use it to improve the phase and amplitude
  let t = time.getTime() + phase;
  let amp = 1.8;

  if (refData && refData.length > 0) {
    // Find the latest high tide in reference data
    const extremes = findTideExtremes(refData);
    const lastHigh = extremes.find(e => e.type === 'high');

    if (lastHigh) {
      // Align projected phase to the known real high tide nearby
      // Time difference roughly corresponds to longitude difference (approx 1h per 15 deg, but simplified here)
      // A small offset per km distance can be added if needed, typically 2-5 mins per 10km along coast
      const timeOffset = (station.lon - refStation.lon) * 4 * 60 * 1000; // 4 mins per degree roughly
      const refTime = new Date(lastHigh.time).getTime();

      // We want cos(...) to be 1 at (refTime + offset)
      // So 2*PI*t_sim/period = 0 (mod 2PI) at t_sim = time
      // This is complex to splice into the simple harmonic model perfectly without a full solver,
      // so we use the reference Amplitude directly and shift the curve.

      amp = lastHigh.level - mean; // Scale amplitude to match recent local conditions

      // Re-calculate t to align peaks
      // The peak of cos(2*PI*t/P) is at t=0. We want peak at refTime + offset.
      // So we shift time input:
      t = time.getTime() - (refTime + timeOffset);
    }
  }

  const level = mean + amp * Math.cos(2 * Math.PI * t / period);
  const prevLevel = mean + amp * Math.cos(2 * Math.PI * (t - 60000) / period); // 1 min ago

  const dir = level > prevLevel + 0.001 ? 'rising' : level < prevLevel - 0.001 ? 'falling' : 'stable';
  return { level, direction: dir };
}

function displayCalculatedTides(station) {
  const container = document.getElementById('tide-current');
  const now = new Date();
  const { level, direction } = calculateTideLevel(now, station);
  const icon = direction === 'rising' ? '?' : direction === 'falling' ? '?' : '?';

  container.innerHTML = `
    <div class="tide-level">${level.toFixed(2)}<span class="tide-unit">m</span></div>
    <div class="tide-status ${direction}">${icon} ${direction.toUpperCase()}</div>
    <div style="font-size: 0.75rem; color: var(--accent-warning); margin-top: 8px;">?? Estimated</div>
    `;

  // Sync sidebar list with calculated data
  const sidebarLevel = document.getElementById(`level-${station.id}`);
  if (sidebarLevel) {
    sidebarLevel.innerHTML = `${level.toFixed(1)}m ${icon}`;
  }

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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    displayWeatherData(data.current);

    // Store daily data for 7-day forecast
    state.currentWeatherDaily = data.daily;

    // Initial Render of Forecast View (Today)
    renderForecastView();

  } catch (err) {
    console.warn(`Weather fetch failed for ${station.id}:`, err);
    container.innerHTML = `
      <div class="error-message fade-in">
        <span>?? Weather unavailable</span>
        <button class="btn btn-sm btn-outline" onclick="fetchWeatherData(state.selectedStation)" style="margin-top:8px">Retry</button>
      </div>`;
  }
}

window.openForecastModal = () => {
  if (!state.selectedStation) return;

  const station = state.selectedStation;
  const tideDays = generateSevenDayTides(station);
  const weatherDays = state.currentWeatherDaily;

  const container = document.getElementById('forecast-list');
  if (!container) return;

  container.innerHTML = tideDays.map((day, i) => {
    // Weather for this day
    let weatherHtml = '<div class="forecast-weather">No Data</div>';
    if (weatherDays && weatherDays.weather_code && weatherDays.weather_code[i] !== undefined) {
      const w = mapWeatherCode(weatherDays.weather_code[i]);
      const maxT = Math.round(weatherDays.temperature_2m_max[i]);
      const minT = Math.round(weatherDays.temperature_2m_min[i]);
      weatherHtml = `
        <div class="forecast-weather">
          <span class="f-icon">${w.icon}</span>
          <div class="f-temps">
            <span class="f-high">${maxT}°</span>
            <span class="f-low">${minT}°</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="forecast-item">
        <div class="forecast-date">
          <span class="f-day">${day.date.split(',')[0]}</span>
          <span class="f-date-num">${day.date.split(',')[1]}</span>
        </div>
        
        <div class="forecast-tides">
          ${day.tides.map(t => `
            <div class="f-tide-row">
              <span class="f-type ${t.type.toLowerCase()}">${t.type}</span>
              <span class="f-time">${new Date(t.time).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</span>
              <span class="f-level">${t.level.toFixed(2)}m</span>
            </div>
          `).join('')}
        </div>
        
        ${weatherHtml}
      </div>
    `;
  }).join('');

  document.getElementById('forecast-station-name').innerText = station.name;
  document.getElementById('forecast-modal').classList.add('active');
};

window.closeForecastModal = () => {
  document.getElementById('forecast-modal').classList.remove('active');
};

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
        <span class="weather-value"><span style="display:inline-block; transform:rotate(${d.wind_direction_10m}deg)">?</span> ${Math.round(d.wind_speed_10m)} km/h</span>
      </div>
      <div class="weather-item">
        <span class="weather-label">Humidity</span>
        <span class="weather-value">${d.relative_humidity_2m}%</span>
      </div>
    </div>
  `;
}

function mapWeatherCode(c) {
  const map = {
    0: '?? Clear Sky',
    1: '??? Mostly Clear',
    2: '? Partly Cloudy',
    3: '?? Overcast',
    45: '??? Fog',
    48: '??? Rime Fog',
    51: '??? Light Drizzle',
    53: '??? Drizzle',
    55: '??? Heavy Drizzle',
    56: '??? Freezing Drizzle',
    57: '??? Heavy Freezing Drizzle',
    61: '??? Slight Rain',
    63: '??? Moderate Rain',
    65: '??? Heavy Rain',
    66: '??? Light Freezing Rain',
    67: '??? Heavy Freezing Rain',
    71: '?? Slight Snow',
    73: '?? Moderate Snow',
    75: '?? Heavy Snow',
    77: '?? Snow Grains',
    80: '??? Slight Showers',
    81: '??? Moderate Showers',
    82: '??? Violent Showers',
    85: '?? Snow Showers',
    86: '?? Heavy Snow Showers',
    95: '?? Thunderstorm',
    96: '?? Thunderstorm & Hail',
    99: '?? Heavy Thunderstorm & Hail'
  };
  const desc = map[c] || 'Unknown';
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
      <div class="moon-icon">??</div>
      <div class="moon-info">
        <div class="moon-name">Moon Phase</div>
        <div class="moon-detail">${Math.round(moon.fraction * 100)}% illuminated</div>
      </div>
    `;
  }
}



// [MONETIZATION] High-Revenue Triggered Ad (Throttled for Mobile & Standalone)
let adPressCounter = 0;
function triggerRevenueAd() {
  adPressCounter++;

  if (adPressCounter % 3 === 0) {
    console.log(`?? [REVENUE] CLICK #${adPressCounter}: OPENING SMARTLINK`);

    // Direct link opening is the most reliable way to force a redirect 
    // in "Add to Home Screen" standalone apps.
    const smartLink = 'https://www.effectivegatecpm.com/wt6vw2m7?key=63cbc38cc78fcf2b480fba1e6f7f3ec4';
    window.open(smartLink, '_blank');

    // Visual toast for mobile testing (Temporary)
    const toast = document.createElement('div');
    toast.style = 'position:fixed; bottom:70px; left:50%; transform:translateX(-50%); background:#ffab00; color:black; padding:10px 20px; border-radius:30px; z-index:9999; font-size:12px; font-weight:bold; box-shadow:0 4px 15px rgba(0,0,0,0.4); pointer-events:none;';
    toast.innerHTML = '?? REVENUE BOOST ACTIVE ??';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
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
  setInterval(() => {
    // Update currently selected station
    if (state.selectedStation) fetchTideData(state.selectedStation);
    // Update all station data in sidebar
    fetchAllLiveStationData();
  }, CONFIG.updateInterval);
}

// ============================================
// Community Logic
// ============================================
function initCommunityMap() {
  state.communityMap = L.map('social-map', {
    zoomSnap: 0,
    zoomDelta: 0.25,
    wheelPxPerZoomLevel: 60
  }).setView([53.5, -8], 7);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.communityMap);
  state.communityMap.on('click', e => {
    openPostModal(e.latlng);
  });
  loadCommunityCatches();
}

window.openPostModal = (latlng) => {
  if (!state.user || state.user.plan !== 'pro') return openPremiumModal();

  state.currentModalLatLng = latlng; // null if general post

  const modalTitle = document.querySelector('#catch-modal h3');
  const detailsLabel = document.querySelector('#catch-details').previousElementSibling; // Label for details
  const speciesLabel = document.querySelector('#catch-species').previousElementSibling; // Label for species

  if (latlng) {
    // Catch Report (Map Click)
    modalTitle.innerText = "?? Share Your Catch";
    if (speciesLabel) speciesLabel.innerText = "What did you catch?";
    if (detailsLabel) detailsLabel.innerText = "Details";
    document.getElementById('catch-species').placeholder = "e.g., Sea Bass, Mackerel";
    document.getElementById('catch-details').placeholder = "How was the fight? What bait did you use?";
  } else {
    // General Update (Button Click)
    modalTitle.innerText = "?? Share Update";
    if (speciesLabel) speciesLabel.innerText = "Title / Topic";
    if (detailsLabel) detailsLabel.innerText = "Message";
    document.getElementById('catch-species').placeholder = "e.g., Heading out to Howth";
    document.getElementById('catch-details').placeholder = "Share a tip, question, or update...";
  }

  document.getElementById('catch-modal').classList.add('active');
};

window.openPostModal = (latlng) => {
  if (!state.user || state.user.plan !== 'pro') return openPremiumModal();

  state.currentModalLatLng = latlng; // null if general post

  const modalTitle = document.querySelector('#catch-modal h3');
  const detailsLabel = document.querySelector('#catch-details').previousElementSibling; // Label for details
  const speciesLabel = document.querySelector('#catch-species').previousElementSibling; // Label for species

  if (latlng) {
    // Catch Report (Map Click)
    modalTitle.innerText = "?? Share Your Catch";
    if (speciesLabel) speciesLabel.innerText = "What did you catch?";
    if (detailsLabel) detailsLabel.innerText = "Details";
    document.getElementById('catch-species').placeholder = "e.g., Sea Bass, Mackerel";
    document.getElementById('catch-details').placeholder = "How was the fight? What bait did you use?";
  } else {
    // General Update (Button Click)
    modalTitle.innerText = "?? Share Update";
    if (speciesLabel) speciesLabel.innerText = "Title / Topic";
    if (detailsLabel) detailsLabel.innerText = "Message";
    document.getElementById('catch-species').placeholder = "e.g., Heading out to Howth";
    document.getElementById('catch-details').placeholder = "Share a tip, question, or update...";
  }

  document.getElementById('catch-modal').classList.add('active');
};

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

  if (!sp) return alert('Enter a title or species!');

  const processCatch = (photoData) => {
    const isGeneralPost = !state.currentModalLatLng;

    const c = {
      id: Date.now(),
      species: sp,
      details: dt,
      lat: isGeneralPost ? null : state.currentModalLatLng.lat,
      lng: isGeneralPost ? null : state.currentModalLatLng.lng,
      isGeneralPost: isGeneralPost, // flag for easier rendering
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

  // Skip general posts (no coordinates)
  if (!c.lat || !c.lng) return;

  const icon = L.divIcon({
    className: 'social-marker',
    html: '??',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const marker = L.marker([c.lat, c.lng], { icon })
    .bindPopup(`<strong>${c.species}</strong><br>${c.date}<br>${c.details}`);

  communityMarkerGroup.addLayer(marker);
}

// XSS Prevention Utility
function sanitizeHTML(str) {
  if (!str) return "";
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

function renderCatchFeed() {
  const feed = document.getElementById('catch-feed');
  if (!feed) return; // Guard against null element
  feed.innerHTML = '';

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Sort all catches: First by pinned status, then by time (id is the timestamp)
  const allSortedCatches = [...(state.catches || [])].sort((a, b) => {
    // Both pinned or both unpinned, sort by time
    if (!!a.isPinned === !!b.isPinned) {
      return (b.id || 0) - (a.id || 0);
    }
    // Pinned posts come first
    return a.isPinned ? -1 : 1;
  });

  // Filter based on archive mode - Pinned posts ALWAYS show regardless of 7-day filter
  const catchesToShow = state.showArchive
    ? allSortedCatches
    : allSortedCatches.filter(c => c.isPinned || (now - (c.id || 0)) <= sevenDaysMs);

  // Check if there are older posts available
  const hasOlderPosts = allSortedCatches.some(c => (now - (c.id || 0)) > sevenDaysMs);

  // Archive toggle button at top
  if (hasOlderPosts || state.showArchive) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-sm btn-outline archive-toggle-btn';
    toggleBtn.innerHTML = state.showArchive ? '?? Show Recent (Last 7 Days)' : '?? View Older Posts';
    toggleBtn.onclick = () => {
      triggerRevenueAd();
      state.showArchive = !state.showArchive;
      renderCatchFeed();
    };
    feed.appendChild(toggleBtn);
  }

  if (catchesToShow.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-state';
    emptyMsg.innerHTML = '<p>No catches to show. Be the first to share!</p>';
    feed.appendChild(emptyMsg);
    return;
  }

  catchesToShow.forEach((c, index) => {
    // Use c.id as timestamp since that's how submitCatch creates it
    const timeAgo = getTimeAgo(c.id);
    const isLiked = c.likedBy && state.user && c.likedBy.includes(state.user.id);
    const isAdmin = state.user && state.user.isAdmin;

    // Use correct field names from submitCatch: author, authorId, photo, details
    // [SECURITY] Sanitize all user-generated strings to prevent XSS
    const displayName = sanitizeHTML(c.author || c.userName || 'Anonymous');
    const displayDetails = sanitizeHTML(c.details || c.notes || '');
    const displayUserId = c.authorId || c.userId || ''; // IDs are internal, but still keep safe
    const displayPhoto = c.photo || c.image || ''; // Base64 or URL

    const userOnClick = `onclick="viewUserProfile('${displayUserId}')"`;
    const nameStyle = `style="cursor: pointer; font-weight: bold; color: var(--text-main);"`;

    const item = document.createElement('div');
    item.className = `feed-item catch-card ${c.isPinned ? 'pinned-post' : ''}`;
    item.innerHTML = `
      <div class="feed-header catch-header">
        <div class="header-left">
          <span class="feed-user" ${userOnClick} ${nameStyle}>${displayName}</span>
          ${c.isPinned ? '<span class="pinned-badge">?? Pinned</span>' : ''}
        </div>
        <div class="header-right">
          <span class="feed-time catch-date">${c.date || timeAgo}</span>
          ${isAdmin ? `
            <button class="pin-post-btn" onclick="togglePinCatch(${c.id})" title="${c.isPinned ? 'Unpin Post' : 'Pin Post'}">
              ${c.isPinned ? '??' : '??'}
            </button>
            <button class="delete-post-btn" onclick="deleteCatch(${c.id})" title="Delete Post">???</button>
          ` : ''}
        </div>
      </div>
      <div class="feed-content">
        <p class="catch-species"><strong>?? ${sanitizeHTML(c.species || 'Catch')}</strong></p>
        ${displayDetails ? `<p class="catch-details">${displayDetails}</p>` : ''}
        ${displayPhoto ? `<img src="${displayPhoto}" alt="Catch" class="catch-image feed-image" onclick="openImageModal('${displayPhoto}')">` : ''}
      </div>
      <div class="feed-actions catch-card-actions">
        <button class="action-btn social-btn ${isLiked ? 'active liked' : ''}" onclick="likeCatch(${c.id})">
          ${isLiked ? '??' : '??'} ${c.likes || 0}
        </button>
        <button class="action-btn social-btn" onclick="toggleComments(${c.id})">
          ?? ${c.comments ? c.comments.length : 0}
        </button>
      </div>
      <div class="comments-section" id="comments-${c.id}">
        <div class="comments-list comment-list" id="comments-list-${c.id}">
          ${(c.comments || []).map((comment, commentIndex) => `
            <div class="comment comment-item">
              <div class="comment-content">
                <span class="comment-user comment-author" onclick="viewUserProfile('${comment.authorId || ''}')" style="cursor:pointer">${sanitizeHTML(comment.author || 'User')}:</span>
                <span class="comment-text">${sanitizeHTML(comment.text)}</span>
              </div>
      <div class="comment-actions">
        ${state.user && state.user.id !== comment.authorId ? `
                  <button class="comment-report-btn" onclick="reportComment(${c.id}, ${commentIndex}, \`${sanitizeHTML(comment.text || '').replace(/`/g, '\\`')}\`, \`${sanitizeHTML(comment.author || 'User').replace(/`/g, '\\`')}\`, '${comment.authorId || ''}')" title="Report Comment">??</button>
                ` : ''}
        ${isAdmin ? `
                  <button class="comment-delete-btn" onclick="deleteComment(${c.id}, ${commentIndex})" title="Delete Comment">???</button>
                ` : ''}
      </div>
    `).join('')}
        </div>
        <div class="comment-input-area">
          <input type="text" placeholder="Add a comment..." id="input-${c.id}" class="comment-input" onkeypress="handleCommentKey(event, ${c.id})">
          <button class="btn btn-primary btn-sm" onclick="postComment(${c.id})">Post</button>
        </div>
      </div>
    `;
    feed.appendChild(item);

    // [MONETIZATION] Inject Ad Slot every 2 posts for higher volume
    if ((index + 1) % 2 === 0) {
      const adContainer = document.createElement('div');
      adContainer.className = 'catch-card feed-ad-item';
      adContainer.style.background = 'rgba(255, 255, 255, 0.02)';
      adContainer.style.textAlign = 'center';
      adContainer.style.padding = '15px 0';
      adContainer.style.minHeight = '280px';

      const adId = `ad-300-250-${index}-${Date.now()}`;
      adContainer.innerHTML = `
        <div class="card-header" style="justify-content: center; border-bottom: none; margin-bottom: 10px;">
          <span class="card-title" style="font-size: 0.7rem; color: var(--text-muted);">?? ADS TO KEEP OUR PLATFORM FREE</span>
        </div>
        <div id="${adId}" style="display:inline-block; margin:0 auto;"></div>
      `;
      feed.appendChild(adContainer);

      // Inject the Adsterra 300x250 script
      try {
        const adDiv = document.getElementById(adId);
        const scriptOptions = document.createElement('script');
        scriptOptions.innerHTML = `
          atOptions = {
            'key' : '9f4ccd6e67ab1bb552203881fb79a9cb',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        `;
        adDiv.appendChild(scriptOptions);

        const scriptInvoke = document.createElement('script');
        scriptInvoke.src = 'https://www.highperformanceformat.com/9f4ccd6e67ab1bb552203881fb79a9cb/invoke.js';
        adDiv.appendChild(scriptInvoke);
      } catch (err) {
        console.warn('Ad injection error:', err);
      }
    }
  });
}

// Admin Pin/Unpin Post Function
window.togglePinCatch = (catchId) => {
  if (!state.user || !state.user.isAdmin) {
    return alert('Only admins can pin posts.');
  }

  const post = state.catches.find(c => c.id === catchId);
  if (!post) return;

  const newPinnedState = !post.isPinned;

  // Update local state immediately for snappy UI
  post.isPinned = newPinnedState;

  // Sync to Firebase
  if (typeof firebaseDB !== 'undefined') {
    firebaseDB.ref('catches/' + catchId).update({
      isPinned: newPinnedState
    })
      .then(() => console.log(`Post ${newPinnedState ? 'pinned' : 'unpinned'} in Firebase`))
      .catch(err => console.error('Error toggling pin:', err));
  }

  // Update localStorage backup
  localStorage.setItem('fishing_catches', JSON.stringify(state.catches));

  // Re-render feed
  renderCatchFeed();
};

// Admin Delete Post Function
window.deleteCatch = (catchId) => {
  if (!state.user || !state.user.isAdmin) {
    return alert('Only admins can delete posts.');
  }

  if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
    return;
  }

  // Remove from local state
  state.catches = state.catches.filter(c => c.id !== catchId);

  // Remove from Firebase
  if (typeof firebaseDB !== 'undefined') {
    firebaseDB.ref('catches/' + catchId).remove()
      .then(() => console.log('Post deleted from Firebase'))
      .catch(err => console.error('Error deleting post:', err));
  }

  // Update localStorage backup
  localStorage.setItem('fishing_catches', JSON.stringify(state.catches));

  // Re-render feed
  renderCatchFeed();
};

// ============================================
// Public Profile Logic
// ============================================

window.viewUserProfile = (userId) => {
  if (!userId) return;

  // Find user in local state (synced from Firebase)
  let user = state.allUsers.find(u => u.id === userId);

  if (!user) {
    const userCatches = state.catches.filter(c => c.userId === userId);
    if (userCatches.length > 0) {
      user = {
        name: userCatches[0].userName,
        joinDate: null,
        plan: 'Standard'
      };
    } else {
      return alert('User profile not found.');
    }
  }

  const modal = document.getElementById('public-profile-modal');
  const avatarEl = document.getElementById('public-profile-avatar');

  document.getElementById('public-profile-name').textContent = user.name;
  document.getElementById('public-profile-badge').textContent = (user.plan === 'pro') ? 'Pro Angler' : 'Member';
  document.getElementById('public-profile-badge').style.background = (user.plan === 'pro') ? 'var(--accent-primary)' : 'var(--glass)';

  document.getElementById('public-profile-badge').style.background = (user.plan === 'pro') ? 'var(--accent-primary)' : 'var(--glass)';

  // Custom Avatar for Admin/Support
  if (user.isAdmin || user.email.includes('admin') || user.email.includes('support')) {
    avatarEl.textContent = '';
    avatarEl.style.backgroundImage = 'url("assets/logo.png")';
    avatarEl.style.backgroundSize = '80%';
    avatarEl.style.backgroundPosition = 'center';
    avatarEl.style.backgroundRepeat = 'no-repeat';
    avatarEl.style.border = '2px solid var(--accent-warning)';
  } else {
    // Default
    avatarEl.style.backgroundImage = 'none';
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
    avatarEl.style.border = '2px solid var(--accent-primary)';
  }

  const userCatches = state.catches.filter(c => c.userId === userId);
  document.getElementById('public-profile-catches').textContent = userCatches.length;

  if (user.joinDate) {
    document.getElementById('public-profile-joined').textContent = new Date(user.joinDate).toLocaleDateString();
  } else {
    document.getElementById('public-profile-joined').textContent = 'N/A';
  }

  modal.classList.add('active');
};

window.closePublicProfileModal = () => {
  document.getElementById('public-profile-modal').classList.remove('active');
};

// ============================================
// Filter UI Logic
// ============================================

window.applyAndCloseFilters = () => {
  applyFilters();
  closeFilterPanel();
};

// ============================================
// Fishing Mode Toggle Logic
// ============================================
let freshwaterMarkerGroup = null;

window.toggleFishingMode = () => {
  const toggle = document.getElementById('fishing-mode-toggle');
  const seaLabel = document.getElementById('mode-label-sea');
  const freshwaterLabel = document.getElementById('mode-label-freshwater');

  if (toggle.checked) {
    state.fishingMode = 'freshwater';
    seaLabel.classList.remove('active');
    freshwaterLabel.classList.add('active');
  } else {
    state.fishingMode = 'sea';
    seaLabel.classList.add('active');
    freshwaterLabel.classList.remove('active');
  }

  updateMapForFishingMode();
};

function updateMapForFishingMode() {
  if (!state.map) return;

  const seaFilterBtn = document.getElementById('filter-toggle-btn');
  const seaFilterSidebar = document.getElementById('filter-sidebar');
  const fwFilterSidebar = document.getElementById('freshwater-filter-sidebar');
  const sidebar = document.querySelector('.sidebar');

  if (state.fishingMode === 'sea') {
    // Show tidal stations sidebar
    if (sidebar) sidebar.style.display = '';
    // Restore grid layout with sidebar
    const appContainer = document.querySelector('.app-container');
    // Only apply desktop grid on larger screens, let CSS handle mobile
    if (appContainer) {
      if (window.innerWidth > 900) {
        appContainer.style.gridTemplateColumns = '400px 1fr';
      } else {
        appContainer.style.gridTemplateColumns = '';  // Remove inline style, use CSS
      }
    }
    // Trigger map resize after grid change
    setTimeout(() => state.map.invalidateSize(), 100);

    // Show sea fishing markers (Respect filters)
    applyFilters(false);

    // Hide freshwater markers
    if (freshwaterMarkerGroup) state.map.removeLayer(freshwaterMarkerGroup);
    if (freshwaterParksGroup) state.map.removeLayer(freshwaterParksGroup);
    if (freshwaterRampsGroup) state.map.removeLayer(freshwaterRampsGroup);
    if (freshwaterPiersGroup) state.map.removeLayer(freshwaterPiersGroup);

    // Toggle filter button to sea filters
    if (seaFilterBtn) {
      seaFilterBtn.onclick = () => toggleFilterPanel();
      updateFilterButton('sea');
    }
    if (fwFilterSidebar) fwFilterSidebar.style.display = 'none';
  } else {
    // Hide tidal stations sidebar in freshwater mode
    if (sidebar) sidebar.style.display = 'none';
    // Make map full width when sidebar is hidden
    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.gridTemplateColumns = '1fr';
    // Trigger map resize to fill new width
    setTimeout(() => state.map.invalidateSize(), 100);

    // Hide sea fishing markers
    Object.values(state.markers).forEach(m => state.map.removeLayer(m));
    if (state.pierMarkers) state.map.removeLayer(state.pierMarkers);
    if (state.rampMarkers) state.map.removeLayer(state.rampMarkers);
    if (state.harbourMarkers) state.map.removeLayer(state.harbourMarkers);

    // Show freshwater markers (Respect filters)
    applyFreshwaterFilters(false);

    // Toggle filter button to freshwater filters
    if (seaFilterBtn) {
      seaFilterBtn.onclick = () => toggleFreshwaterFilterPanel();
      updateFilterButton('freshwater');
    }
    if (fwFilterSidebar) fwFilterSidebar.style.display = '';
    if (seaFilterSidebar) seaFilterSidebar.classList.remove('open');
  }
}

function renderFreshwaterSpots() {
  if (!state.map) return;

  // Create layer group if not exists
  if (!freshwaterMarkerGroup) {
    freshwaterMarkerGroup = L.layerGroup();
  } else {
    freshwaterMarkerGroup.clearLayers();
  }

  FRESHWATER_SPOTS.forEach(spot => {
    const icon = L.divIcon({
      className: 'freshwater-marker',
      html: '??', // Standardized to match filter emoji
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const popupContent = `
      <div class="freshwater-popup">
        <h3>${spot.name}</h3>
        <p><strong>Type:</strong> ${spot.type}</p>
        <p><strong>Species:</strong> ${spot.species.join(', ')}</p>
        ${spot.notes ? `<p><em>${spot.notes}</em></p>` : ''}
        ${spot.licenseRequired
        ? `<a href="${spot.licenseUrl}" target="_blank" class="license-btn">?? ${spot.licenseType} - Get Info</a>`
        : '<span class="no-license">? No State License Required</span>'
      }
        <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" class="directions-btn">?? Get Directions</a>
      </div>
    `;

    const marker = L.marker([spot.lat, spot.lng], { icon })
      .bindPopup(popupContent);

    freshwaterMarkerGroup.addLayer(marker);
  });

  // Don't add to map yet - controlled by applyFreshwaterFilters()
}

// Layer groups for freshwater amenities
let freshwaterParksGroup = null;
let freshwaterRampsGroup = null;
let freshwaterPiersGroup = null;

function renderFreshwaterParks() {
  if (!state.map) return;

  if (!freshwaterParksGroup) {
    freshwaterParksGroup = L.layerGroup();
  } else {
    freshwaterParksGroup.clearLayers();
  }

  FRESHWATER_PARKS.forEach(park => {
    const icon = L.divIcon({
      className: 'freshwater-park-marker',
      html: '???', // Standardized to match filter emoji
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const popupContent = `
      <div class="freshwater-popup">
        <h3>??? ${park.name}</h3>
        <p><strong>County:</strong> ${park.county}</p>
        <p><strong>Species:</strong> ${park.species.join(', ')}</p>
        ${park.notes ? `<p><em>${park.notes}</em></p>` : ''}
        ${park.website ? `<a href="${park.website}" target="_blank" class="license-btn">?? Visit Website</a>` : ''}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lng}" target="_blank" class="directions-btn">?? Get Directions</a>
      </div>
    `;

    const marker = L.marker([park.lat, park.lng], { icon })
      .bindPopup(popupContent);

    freshwaterParksGroup.addLayer(marker);
  });

  // Don't add to map yet - controlled by applyFreshwaterFilters()
}

function renderFreshwaterRamps() {
  if (!state.map) return;

  if (!freshwaterRampsGroup) {
    freshwaterRampsGroup = L.layerGroup();
  } else {
    freshwaterRampsGroup.clearLayers();
  }

  FRESHWATER_RAMPS.forEach(ramp => {
    const icon = L.divIcon({
      className: 'freshwater-ramp-marker',
      html: '??',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const popupContent = `
      <div class="freshwater-popup">
        <h3>?? ${ramp.name}</h3>
        <p><strong>Waterway:</strong> ${ramp.waterway}</p>
        <p><strong>Type:</strong> ${ramp.type}</p>
        ${ramp.notes ? `<p><em>${ramp.notes}</em></p>` : ''}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${ramp.lat},${ramp.lng}" target="_blank" class="directions-btn">?? Get Directions</a>
      </div>
    `;

    const marker = L.marker([ramp.lat, ramp.lng], { icon })
      .bindPopup(popupContent);

    freshwaterRampsGroup.addLayer(marker);
  });

  // Don't add to map yet - controlled by applyFreshwaterFilters()
}

function renderFreshwaterPiers() {
  if (!state.map) return;

  if (!freshwaterPiersGroup) {
    freshwaterPiersGroup = L.layerGroup();
  } else {
    freshwaterPiersGroup.clearLayers();
  }

  FRESHWATER_PIERS.forEach(pier => {
    const icon = L.divIcon({
      className: 'freshwater-pier-marker',
      html: '??',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const accessibleBadge = pier.accessible ? '? Wheelchair Accessible' : '';
    const popupContent = `
      <div class="freshwater-popup">
        <h3>?? ${pier.name}</h3>
        <p><strong>Waterway:</strong> ${pier.waterway}</p>
        ${pier.accessible ? `<p class="accessible-badge">? Wheelchair Accessible</p>` : ''}
        ${pier.notes ? `<p><em>${pier.notes}</em></p>` : ''}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${pier.lat},${pier.lng}" target="_blank" class="directions-btn">?? Get Directions</a>
      </div>
    `;

    const marker = L.marker([pier.lat, pier.lng], { icon })
      .bindPopup(popupContent);

    freshwaterPiersGroup.addLayer(marker);
  });

  // Don't add to map yet - controlled by applyFreshwaterFilters()
}

// Freshwater filter functions
window.toggleFreshwaterFilterPanel = () => {
  const sidebar = document.getElementById('freshwater-filter-sidebar');
  const overlay = document.getElementById('freshwater-filter-overlay');
  if (sidebar && overlay) {
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      applyFreshwaterFilters();
    } else {
      sidebar.classList.add('open');
      overlay.classList.add('active');
      updateFilterButton('confirm');
    }
  }
};

window.closeFreshwaterFilterPanel = () => {
  const sidebar = document.getElementById('freshwater-filter-sidebar');
  const overlay = document.getElementById('freshwater-filter-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  updateFilterButton('freshwater');
};

window.applyFreshwaterFilters = (closePanel = true) => {
  if (closePanel) {
    closeFreshwaterFilterPanel();
  }
  const showSpots = document.getElementById('filter-fw-spots')?.checked ?? true;
  const showParks = document.getElementById('filter-fw-parks')?.checked ?? true;
  const showRamps = document.getElementById('filter-fw-ramps')?.checked ?? true;
  const showPiers = document.getElementById('filter-fw-piers')?.checked ?? true;
  const showShops = document.getElementById('filter-fw-shops')?.checked ?? true;

  // Toggle layer visibility
  if (freshwaterMarkerGroup) {
    if (showSpots) state.map.addLayer(freshwaterMarkerGroup);
    else state.map.removeLayer(freshwaterMarkerGroup);
  }
  if (freshwaterParksGroup) {
    if (showParks) state.map.addLayer(freshwaterParksGroup);
    else state.map.removeLayer(freshwaterParksGroup);
  }
  if (freshwaterRampsGroup) {
    if (showRamps) state.map.addLayer(freshwaterRampsGroup);
    else state.map.removeLayer(freshwaterRampsGroup);
  }
  if (freshwaterPiersGroup) {
    if (showPiers) state.map.addLayer(freshwaterPiersGroup);
    else state.map.removeLayer(freshwaterPiersGroup);
  }
  if (state.shopMarkers) {
    if (showShops) state.map.addLayer(state.shopMarkers);
    else state.map.removeLayer(state.shopMarkers);
  }

  if (closePanel) closeFreshwaterFilterPanel();
};

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
// Comment Moderation Functions
// ============================================

// Delete Comment (Admin Only)
window.deleteComment = (catchId, commentIndex) => {
  if (!state.user || !state.user.isAdmin) {
    return alert('Only admins can delete comments.');
  }

  if (!confirm('Delete this comment? This cannot be undone.')) {
    return;
  }

  const targetCatch = state.catches.find(c => c.id === catchId);
  if (targetCatch && targetCatch.comments) {
    // Remove comment from array
    targetCatch.comments.splice(commentIndex, 1);

    // Update Firebase
    updateCatchInFirebase(catchId, { comments: targetCatch.comments });

    // Update local storage
    localStorage.setItem('fishing_catches', JSON.stringify(state.catches));

    // Re-render feed
    renderCatchFeed();

    // Re-open comments section
    setTimeout(() => {
      const commentsSection = document.getElementById(`comments-${catchId}`);
      if (commentsSection) commentsSection.classList.add('active');
    }, 50);
  }
};

// Report Comment
let currentReportContext = null;

window.reportComment = (catchId, commentIndex, commentText, commentAuthor, commentAuthorId) => {
  if (!state.user) {
    return openAuthModal();
  }

  const targetCatch = state.catches.find(c => c.id === catchId);
  if (!targetCatch || !targetCatch.comments || !targetCatch.comments[commentIndex]) {
    return alert('Comment not found.');
  }

  // Store context for submission
  currentReportContext = {
    catchId,
    commentIndex,
    commentText,
    commentAuthor,
    commentAuthorId
  };

  // Display comment in modal
  document.getElementById('report-comment-text').textContent = `"${commentText}" - ${commentAuthor}`;

  // Reset form
  document.getElementById('report-reason').value = 'spam';
  document.getElementById('report-details').value = '';

  // Show modal
  document.getElementById('report-comment-modal').classList.add('active');
};

window.closeReportModal = () => {
  document.getElementById('report-comment-modal').classList.remove('active');
  currentReportContext = null;
};

window.submitReport = () => {
  if (!currentReportContext) return;

  const reason = document.getElementById('report-reason').value;
  const details = document.getElementById('report-details').value.trim();

  const report = {
    id: 'report_' + Date.now(),
    catchId: currentReportContext.catchId,
    commentIndex: currentReportContext.commentIndex,
    commentText: currentReportContext.commentText,
    commentAuthor: currentReportContext.commentAuthor,
    commentAuthorId: currentReportContext.commentAuthorId,
    reportedBy: state.user.name,
    reportedById: state.user.id,
    reportReason: reason,
    reportDetails: details,
    reportDate: Date.now(),
    status: 'pending'
  };

  // Save to Firebase
  if (firebaseDB) {
    firebaseDB.ref('reportedComments/' + report.id).set(report)
      .then(() => {
        alert('Comment reported. Our team will review it shortly.');
        closeReportModal();
      })
      .catch(err => {
        console.error('Error reporting comment:', err);
        alert('Failed to submit report. Please try again.');
      });
  } else {
    // Fallback to localStorage
    const reports = JSON.parse(localStorage.getItem('reported_comments') || '[]');
    reports.push(report);
    localStorage.setItem('reported_comments', JSON.stringify(reports));
    alert('Comment reported. Our team will review it shortly.');
    closeReportModal();
  }
};


// ============================================
// Admin - Reported Comments Management
// ============================================

function loadReportedComments() {
  if (!firebaseDB) {
    state.reportedComments = JSON.parse(localStorage.getItem('reported_comments') || '[]');
    renderReportedComments();
    return;
  }

  firebaseDB.ref('reportedComments').on('value', (snapshot) => {
    const reports = [];
    snapshot.forEach((childSnapshot) => {
      reports.push(childSnapshot.val());
    });
    state.reportedComments = reports.sort((a, b) => b.reportDate - a.reportDate);
    renderReportedComments();
  });
}

window.filterReports = (filter) => {
  state.reportFilter = filter;
  renderReportedComments(filter);

  // Update button states
  document.querySelectorAll('.report-filters .btn').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
  });
  event.target.classList.remove('btn-outline');
  event.target.classList.add('btn-primary');
};

function renderReportedComments(filter = 'pending') {
  const container = document.getElementById('reported-comments-list');
  if (!container) return;

  const filtered = filter === 'all'
    ? state.reportedComments
    : state.reportedComments.filter(r => r.status === filter);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No reported comments to review.</p>';
    return;
  }

  container.innerHTML = filtered.map(report => {
    const catchData = state.catches.find(c => c.id === report.catchId);
    return `
      <div class="report-card ${report.status}">
        <div class="report-header">
          <span class="report-status-badge ${report.status}">${report.status.toUpperCase()}</span>
          <span class="report-date">${new Date(report.reportDate).toLocaleDateString()}</span>
        </div>
        <div class="report-body">
          <div class="reported-comment">
            <p class="report-label">Reported Comment:</p>
            <p class="comment-content">"${sanitizeHTML(report.commentText)}"</p>
            <p class="comment-meta">By ${sanitizeHTML(report.commentAuthor)}</p>
          </div>
          
          <div class="report-details">
            ${report.reportDetails ? `<br><strong>Details:</strong> ${report.reportDetails}` : ''}
          </div>
        </div>
        
        ${report.status === 'pending' ? `
          <div class="report-actions">
            <button class="btn btn-sm btn-danger" onclick="removeReportedComment('${report.id}', ${report.catchId}, ${report.commentIndex})">
              Remove Comment
            </button>
            <button class="btn btn-sm btn-outline" onclick="dismissReport('${report.id}')">
              Dismiss Report
            </button>
            <button class="btn btn-sm btn-outline" onclick="viewReportedPost(${report.catchId})">
              View Post
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

window.removeReportedComment = (reportId, catchId, commentIndex) => {
  if (!confirm('Remove this comment and mark report as resolved?')) return;

  // Delete the comment
  const targetCatch = state.catches.find(c => c.id === catchId);
  if (targetCatch && targetCatch.comments) {
    targetCatch.comments.splice(commentIndex, 1);
    updateCatchInFirebase(catchId, { comments: targetCatch.comments });
    localStorage.setItem('fishing_catches', JSON.stringify(state.catches));
  }

  // Update report status
  const report = state.reportedComments.find(r => r.id === reportId);
  if (report) {
    report.status = 'removed';
    report.reviewedBy = state.user.name;
    report.reviewedById = state.user.id;
    report.reviewDate = Date.now();

    if (firebaseDB) {
      firebaseDB.ref('reportedComments/' + reportId).update({
        status: 'removed',
        reviewedBy: state.user.name,
        reviewedById: state.user.id,
        reviewDate: Date.now()
      });
    } else {
      localStorage.setItem('reported_comments', JSON.stringify(state.reportedComments));
    }
  }

  renderReportedComments(state.reportFilter || 'pending');
};

window.dismissReport = (reportId) => {
  if (!confirm('Dismiss this report? The comment will remain.')) return;

  const report = state.reportedComments.find(r => r.id === reportId);
  if (report) {
    report.status = 'dismissed';
    report.reviewedBy = state.user.name;
    report.reviewedById = state.user.id;
    report.reviewDate = Date.now();

    if (firebaseDB) {
      firebaseDB.ref('reportedComments/' + reportId).update({
        status: 'dismissed',
        reviewedBy: state.user.name,
        reviewedById: state.user.id,
        reviewDate: Date.now()
      });
    } else {
      localStorage.setItem('reported_comments', JSON.stringify(state.reportedComments));
    }
  }

  renderReportedComments(state.reportFilter || 'pending');
};

window.viewReportedPost = (catchId) => {
  showPage('community');
  setTimeout(() => {
    const postElement = document.querySelector(`[data-catch-id="${catchId}"]`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postElement.style.border = '2px solid var(--accent-warning)';
      setTimeout(() => {
        postElement.style.border = '';
      }, 3000);
    }
  }, 500);
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
  const isAdminEmail = CONFIG.ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
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
          return alert('Your account has been deactivated. Please contact irishfishinghub@gmail.com if you believe this is a mistake.');
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
    navAvatar.innerHTML = '??';
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
    upgradeBtn.innerText = '? Pro Features Active';
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
      alert('?? Pro features activated for FREE during beta!');
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
  // Clear real-time deactivation listener if active
  if (state.user && firebaseDB) {
    firebaseDB.ref('users/' + state.user.id).off('value');
  }

  state.user = null;
  localStorage.removeItem('fishing_user');
  sessionStorage.removeItem('fishing_user');
  updateAuthUI();
  closeProfileModal();
  showPage('home'); // Go to dashboard

  // Reset nav avatar
  const navAvatar = document.querySelector('.user-avatar');
  if (navAvatar) {
    navAvatar.innerHTML = '??';
    navAvatar.style.backgroundImage = 'none';
  }
};

window.openPremiumModal = () => document.getElementById('premium-modal').classList.add('active');
window.closePremiumModal = () => document.getElementById('premium-modal').classList.remove('active');

window.upgradeToPremium = () => {
  if (!state.user) {
    return;
  }

  // Logic to redirect to Stripe would go here
  alert('Redirecting to secure payment...');
};

// ============================================
// Mandatory Legal Consent Logic
// ============================================
window.checkLegalConsent = () => {
  const legalAccepted = localStorage.getItem('legal_accepted_v1');
  const overlay = document.getElementById('legal-consent-overlay');

  if (!legalAccepted) {
    if (overlay) {
      overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // Block scrolling
    }
  } else {
    if (overlay) overlay.classList.add('hidden');
  }
};

window.updateLegalContinueButton = () => {
  const termsChecked = document.getElementById('check-terms').checked;
  const privacyChecked = document.getElementById('check-privacy').checked;
  const btn = document.getElementById('legal-continue-btn');

  if (termsChecked && privacyChecked) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
};

window.acceptLegal = () => {
  const termsChecked = document.getElementById('check-terms').checked;
  const privacyChecked = document.getElementById('check-privacy').checked;

  if (termsChecked && privacyChecked) {
    localStorage.setItem('legal_accepted_v1', 'true');
    const overlay = document.getElementById('legal-consent-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      document.body.style.overflow = ''; // Restore scrolling
    }
  }
};

window.openPrivacyModal = () => {
  const modal = document.getElementById('privacy-modal');
  if (modal) modal.classList.add('active');
};

window.closePrivacyModal = () => {
  const modal = document.getElementById('privacy-modal');
  if (modal) modal.classList.remove('active');
  if (!state.user) {
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
    const response = await fetch(`${CONFIG.STRIPE_API_ENDPOINT}/create-checkout-session`, {
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
    const response = await fetch(`${CONFIG.STRIPE_API_ENDPOINT}/create-portal-session`, {
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
        <span class="county-chevron">?</span>
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
  document.getElementById('shop-details-address').innerHTML = `<span class="icon">??</span> ${street}${city ? ', ' + city : ''}`;

  const phoneEl = document.getElementById('shop-details-phone');
  if (phone && phone !== 'undefined') {
    phoneEl.innerHTML = `<span class="icon">??</span> ${phone}`;
    phoneEl.style.display = 'block';
  } else {
    phoneEl.style.display = 'none';
  }

  const emailEl = document.getElementById('shop-details-email');
  if (email && email !== 'undefined' && email !== '') {
    emailEl.innerHTML = `<span class="icon">??</span> <a href="mailto:${email}" style="color:var(--accent-primary); text-decoration:none">${email}</a>`;
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
    const email = tags.email || '';

    return `
      <div class="shop-item" onclick="openShopDetails(${lat}, ${lon}, \`${sanitizeHTML(name).replace(/`/g, '\\`')}\`, \`${sanitizeHTML(street).replace(/`/g, '\\`')}\`, \`${sanitizeHTML(city).replace(/`/g, '\\`')}\`, \`${sanitizeHTML(phone).replace(/`/g, '\\`')}\`, \`${sanitizeHTML(email).replace(/`/g, '\\`')}\`)">
        <div class="shop-info">
          <div class="shop-name-row">
            <span class="shop-name">${sanitizeHTML(name)}</span>
          </div>
          <div class="shop-meta">
            ${street ? `<span>?? ${sanitizeHTML(street)}</span>` : ''}
            ${city ? `<span>??? ${sanitizeHTML(city)}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-sm btn-primary">Details</button>
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
  loadReportedComments();
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
  if (!tbody) return;

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 20px;">${searchTerm ? 'No matches found' : 'No users registered yet'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredUsers.map(u => {
    const joinDate = u.joinDate ? new Date(u.joinDate).toLocaleDateString('en-GB') : 'N/A';
    const isActive = u.active !== false;
    const plan = u.plan || 'free';
    const pwd = u.password || '******';

    return `
      <tr>
        <td>${sanitizeHTML(u.name || 'Unknown')}</td>
        <td style="font-size: 0.8rem;">${sanitizeHTML(u.email)}</td>
        <td><code style="font-size: 0.8rem;">${sanitizeHTML(pwd)}</code></td>
        <td><span class="badge ${plan === 'pro' ? 'pro' : ''}">${plan.toUpperCase()}</span></td>
        <td>${joinDate}</td>
        <td><span class="badge ${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Inactive'}</span></td>
        <td class="admin-actions-cell">
          <div class="util-dropdown" id="dropdown-${u.id}">
            <button class="util-dropbtn" onclick="toggleAdminDropdown('${u.id}')">
              ?? Utilities ?
            </button>
            <div class="util-dropdown-content">
              <button onclick="openEmailCenter('${u.email}')">?? Email Member</button>
              <button onclick="openUsernameEditor('${u.id}', '${(u.name || '').replace(/'/g, "\\'")}', '${u.email}')">?? Edit Username</button>
              <button onclick="changeUserPassword('${u.id}')">?? Change Password</button>
              <button onclick="toggleUserStatus('${u.id}')">${isActive ? '?? Deactivate' : '?? Activate'}</button>
              ${plan !== 'pro' ? `<button onclick="giftProSubscription('${u.id}')">?? Gift 1mo Pro</button>` : ''}
              <button class="danger-action" onclick="deleteUserAccount('${u.id}')">??? Delete Account</button>
            </div>
          </div>
        </td>
        <td style="display: none; gap: 5px;">
          <button class="btn btn-xs btn-outline" 
                  onclick="openUsernameEditor('${u.id}', '${(u.name || '').replace(/'/g, "\\'")}', '${u.email}')" 
                  title="Edit Username">
            ?? Edit
          </button>
          <button class="btn btn-xs ${isActive ? 'btn-danger' : 'btn-success'}" 
                  onclick="toggleUserStatus('${u.id}')">
            ${isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button class="btn btn-xs btn-primary" onclick="changeUserPassword('${u.id}')" title="Change Password">
            ?? Change
          </button>
          <button class="btn btn-xs btn-danger" onclick="deleteUserAccount('${u.id}')" title="Permanently Delete Account">
            ??? Delete
          </button>
          ${plan !== 'pro' ? `
            <button class="btn btn-xs btn-primary" onclick="giftProSubscription('${u.id}')" title="Gift 1 Month Free Pro">
              ?? Gift Pro
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

window.deleteUserAccount = async (userId) => {
  const user = state.allUsers.find(u => u.id === userId);
  if (!user) return;

  if (!confirm(`?? PERMANENT DELETE\n\nAre you sure you want to permanently delete the account for ${user.email}?\n\nThis cannot be undone!`)) return;

  try {
    // Remove from Firebase
    if (firebaseDB) {
      await firebaseDB.ref('users/' + userId).remove();
    }

    // Remove from local state
    state.allUsers = state.allUsers.filter(u => u.id !== userId);
    localStorage.setItem('fishing_all_users', JSON.stringify(state.allUsers));

    alert(`Account for ${user.email} has been permanently deleted.`);
    loadUsersTable();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete account. Please try again.');
  }
};

async function verifySessionStatus() {
  if (!state.user || !firebaseDB) return;

  // Root admins are exempt from deactivation check
  if (state.user.id.includes('_main_root')) return;

  try {
    const userRef = firebaseDB.ref('users/' + state.user.id);

    // Switch to real-time listener for immediate deactivation response
    userRef.on('value', (snapshot) => {
      const userData = snapshot.val();

      if (userData && userData.active === false) {
        // Stop listening before logging out to avoid infinite loop or errors
        userRef.off('value');

        alert('Your account has been deactivated. Please contact irishfishinghub@gmail.com if you believe this is a mistake.');
        logout();
      }
    });

  } catch (err) {
    console.warn('Session verification failed:', err);
  }
}

window.changeUserPassword = (userId) => {
  const user = state.allUsers.find(u => u.id === userId);
  if (!user) return;

  const newPassword = prompt(`Enter new password for ${user.email}:`, user.password || '');
  if (newPassword === null || newPassword.trim() === '') return;

  user.password = newPassword.trim();

  // Sync changed locally and globally
  localStorage.setItem('fishing_all_users', JSON.stringify(state.allUsers));
  syncUserToFirebase(user);

  alert(`Password updated for ${user.email}`);
  loadUsersTable();
};



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
    const body = `Dear ${user.name || 'Member'},%0D%0A%0D%0AWe are writing to inform you that your account on Irish Fishing Hub has been deactivated.%0D%0A%0D%0AIf you believe this is an error or would like to appeal this decision, please reply to this email.%0D%0A%0D%0ABest regards,%0D%0ASupport Team%0D%0AIrish Fishing Hub`;
    const mailtoLink = `mailto:${user.email}?subject=${subject}&body=${body}`;

    // Open default email client
    window.open(mailtoLink, '_blank');
  }

  // Refresh UI
  loadUsersTable();

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
        <div class="message-avatar">??</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">${thread.userName}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-preview">${lastMsg.text}</div>
        </div>
        <button class="delete-thread-btn" onclick="event.stopPropagation(); deleteSupportThread('${thread.userId}')" title="Delete thread">???</button>
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
        ${sanitizeHTML(m.text)}
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

  // Sync to Firebase (Real-time listener handles UI and localStorage)
  syncMessageToFirebase(msg);

  input.value = '';
};

window.deleteSupportThread = (userId) => {
  if (!confirm('Are you sure you want to delete this entire message thread? This cannot be undone.')) return;

  const messagesToDelete = state.supportMessages.filter(m => m.userId === userId);

  messagesToDelete.forEach(m => {
    if (firebaseDB) {
      firebaseDB.ref('support_messages/' + m.id).remove()
        .catch(err => console.error('Error deleting message:', err));
    }
  });

  // Local state update (though Firebase listener will handle this too)
  state.supportMessages = state.supportMessages.filter(m => m.userId !== userId);
  localStorage.setItem('fishing_support_messages', JSON.stringify(state.supportMessages));

  // If we're currently replying to this user, close the modal
  if (state.currentReplyUserId === userId) {
    closeAdminReplyModal();
  }

  loadAdminMessages();
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
        ${sanitizeHTML(m.text)}
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

// Support Choice Modal Logic
window.openSupportChoiceModal = () => {
  document.getElementById('support-choice-modal').classList.add('active');
};

window.closeSupportChoiceModal = () => {
  document.getElementById('support-choice-modal').classList.remove('active');
};

window.handleInAppSupport = () => {
  closeSupportChoiceModal();
  openSupportModal();
};

// ============================================
// National Directory (Tackle Shops)
// ============================================

const TACKLE_SHOPS = [
  // Dublin - Verified coordinates
  { name: "Rory's Fishing Tackle", county: "Dublin", address: "17A Temple Bar, Dublin 2", phone: "01 677 2351", website: "https://www.rorys.ie", lat: 53.345697, lng: -6.2625518, rating: 4.8 },
  { name: "Southside Angling", county: "Dublin", address: "Unit D, South Gate, Cork Street, Dublin 8", phone: "01 455 9049", website: "https://www.southsideangling.ie", lat: 53.3384303, lng: -6.279546, rating: 4.6 },
  { name: "The Angling Centre", county: "Dublin", address: "Unit 1, Swords Business Park, Swords", phone: "01 813 4455", website: "", lat: 53.4610, lng: -6.2180, rating: 4.5 },

  // Cork - Verified
  { name: "T.W. Murray & Co", county: "Cork", address: "87 Patrick St, Cork City", phone: "021 427 1089", website: "", lat: 51.8985, lng: -8.4755, rating: 4.7 },
  { name: "The Tackle Shop Cork", county: "Cork", address: "4 Drawbridge St, Cork City", phone: "021 427 2842", website: "", lat: 51.8968, lng: -8.4730, rating: 4.5 },
  { name: "West Cork Angling", county: "Cork", address: "Main St, Bantry", phone: "027 50328", website: "", lat: 51.6805, lng: -9.4530, rating: 4.4 },

  // Galway - Verified (Mainguard St & High St)
  { name: "Duffy's Fishing", county: "Galway", address: "5 Mainguard St, Galway City", phone: "091 562 367", website: "https://www.duffysfishing.ie", lat: 53.2720737, lng: -9.0539299, rating: 4.9 },
  { name: "Freeney's Angling", county: "Galway", address: "19 High St, Galway", phone: "091 568 794", website: "", lat: 53.2718802, lng: -9.0533498, rating: 4.6 },

  // Kerry
  { name: "O'Neill's Fishing Tackle", county: "Kerry", address: "6 Plunkett St, Killarney", phone: "064 663 1970", website: "https://www.killarneyfishing.com", lat: 52.0599, lng: -9.5044, rating: 4.7 },
  { name: "Kerry Angling", county: "Kerry", address: "Strand St, Tralee", phone: "066 712 6644", website: "", lat: 52.2705, lng: -9.7020, rating: 4.3 },

  // Mayo
  { name: "Pat Scahill's Tackle Shop", county: "Mayo", address: "Castlebar St, Westport", phone: "098 27899", website: "", lat: 53.8015, lng: -9.5175, rating: 4.8 },
  { name: "Ballina Angling Centre", county: "Mayo", address: "Dillon Terrace, Ballina", phone: "096 21850", website: "", lat: 54.1155, lng: -9.1540, rating: 4.5 },

  // Donegal
  { name: "Donegal Angling Supplies", county: "Donegal", address: "Main St, Donegal Town", phone: "074 972 1119", website: "", lat: 54.6540, lng: -8.1100, rating: 4.6 },
  { name: "Letterkenny Tackle", county: "Donegal", address: "Port Rd, Letterkenny", phone: "074 912 4888", website: "", lat: 54.9548, lng: -7.7337, rating: 4.4 },

  // Wicklow - Verified locations
  { name: "Rod and Tackle", county: "Wicklow", address: "Wicklow Enterprise Centre, The Murrough, Wicklow", phone: "0404 61444", website: "", lat: 52.9750, lng: -6.0495, rating: 4.5 },
  { name: "Wild Ireland Outdoors", county: "Wicklow", address: "1 Upper Main Street, Arklow", phone: "087 068 9268", website: "", lat: 52.7976593, lng: -6.1590175, rating: 4.7 },
  { name: "Powersound Fishing", county: "Wicklow", address: "12a Main Street, Arklow", phone: "0402 32847", website: "", lat: 52.7981434, lng: -6.1557531, rating: 4.5 },

  // Wexford
  { name: "Wexford Tackle Shop", county: "Wexford", address: "Crescent Quay, Wexford", phone: "053 912 3055", website: "", lat: 52.3365, lng: -6.4625, rating: 4.4 },

  // Waterford
  { name: "The Waterford Angler", county: "Waterford", address: "26 The Quay, Waterford", phone: "051 874 455", website: "", lat: 52.2595, lng: -7.1105, rating: 4.5 },

  // Clare
  { name: "Ennis Tackle & Bait", county: "Clare", address: "Abbey St, Ennis", phone: "065 682 8366", website: "", lat: 52.8428, lng: -8.9820, rating: 4.3 },

  // Limerick
  { name: "Steve's Fishing Tackle", county: "Limerick", address: "23 William St, Limerick City", phone: "061 415 484", website: "", lat: 52.6642, lng: -8.6295, rating: 4.6 },

  // Sligo - Verified Hyde Bridge coords
  { name: "Barton Smith Tackle", county: "Sligo", address: "Hyde Bridge, Sligo", phone: "071 914 2356", website: "https://www.bartonsmith.ie", lat: 54.272258, lng: -8.4740566, rating: 4.7 },

  // Louth
  { name: "Drogheda Angling Centre", county: "Louth", address: "West St, Drogheda", phone: "041 983 6978", website: "", lat: 53.7180, lng: -6.3495, rating: 4.5 },

  // Meath
  { name: "Navan Tackle", county: "Meath", address: "Trimgate St, Navan", phone: "046 902 8844", website: "", lat: 53.6525, lng: -6.6820, rating: 4.4 },

  // Northern Ireland - Verified/Updated
  { name: "Belfast Angling Centre", county: "Antrim", address: "49 Northumberland St, Belfast", phone: "028 9024 5678", website: "", lat: 54.6005, lng: -5.9455, rating: 4.7 },
  { name: "McKees Angling Centre", county: "Down", address: "16 Balloo Avenue, Bangor", phone: "028 9127 1234", website: "", lat: 54.6412827, lng: -5.670344, rating: 4.6 },
  { name: "Newtownards Tackle", county: "Down", address: "Frances St, Newtownards", phone: "028 9181 2345", website: "", lat: 54.5940, lng: -5.6920, rating: 4.5 },
  { name: "Lisburn Angling Supplies", county: "Antrim", address: "Bow St, Lisburn", phone: "028 9266 3456", website: "", lat: 54.5095, lng: -6.0375, rating: 4.5 },
  { name: "Ballymena Tackle Shop", county: "Antrim", address: "Church St, Ballymena", phone: "028 2565 4567", website: "", lat: 54.8642, lng: -6.2765, rating: 4.4 },
  { name: "Flying Tackle Portrush", county: "Antrim", address: "74 Main St, Portrush", phone: "028 7082 3601", website: "", lat: 55.2074164, lng: -6.6538849, rating: 4.8 },
  { name: "Newry Angling Centre", county: "Down", address: "Hill St, Newry", phone: "028 3026 6789", website: "", lat: 54.1750, lng: -6.3392, rating: 4.5 }
];

async function loadNationalDirectory() {
  const container = document.getElementById('county-directory');
  if (!container) return;

  // Clear current list and show loading
  container.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <span>Updating directory with latest data...</span>
    </div>
  `;

  let combinedShops = [...TACKLE_SHOPS];

  // Try to load extra shops from Firebase
  try {
    const snapshot = await firebase.database().ref('locations').once('value');
    const data = snapshot.val();
    if (data) {
      const firebaseShops = [];
      if (data.sea && data.sea.shops) firebaseShops.push(...Object.values(data.sea.shops));
      if (data.freshwater && data.freshwater.shops) firebaseShops.push(...Object.values(data.freshwater.shops));

      firebaseShops.forEach(fbShop => {
        // Find if this is an edit of a static shop (match by name and county)
        const existingIdx = combinedShops.findIndex(s =>
          s.name === fbShop.name && s.county === fbShop.county
        );

        if (existingIdx !== -1) {
          // Replace with edited version
          combinedShops[existingIdx] = { ...combinedShops[existingIdx], ...fbShop };
        } else {
          // Add as new shop
          combinedShops.push(fbShop);
        }
      });
    }
  } catch (err) {
    console.warn('Directory: Failed to load Firebase shops:', err);
  }

  // Group shops by county
  const byCounty = {};
  combinedShops.forEach(shop => {
    const county = shop.county || 'Other';
    if (!byCounty[county]) byCounty[county] = [];
    byCounty[county].push(shop);
  });

  // Sort counties alphabetically
  const sortedCounties = Object.keys(byCounty).sort();

  const adminUser = isAdmin();
  let html = '<div class="directory-grid">';

  sortedCounties.forEach(county => {
    const shops = byCounty[county];
    html += `
      <div class="county-card">
        <div class="county-header">
          <h3>?? ${county}</h3>
          <span class="shop-count">${shops.length} shop${shops.length > 1 ? 's' : ''}</span>
        </div>
        <div class="shop-list">
    `;

    shops.forEach(shop => {
      const rating = shop.rating || 4.5;
      const stars = '?'.repeat(Math.round(rating));
      const lat = shop.lat;
      const lng = shop.lng || shop.lon;
      const shopData = JSON.stringify({ ...shop, lng }).replace(/"/g, '&quot;');

      html += `
        <div class="shop-item" onclick="showShopOnMap(${lat}, ${lng}, '${shop.name.replace(/'/g, "\\'")}')">
          <div class="shop-name">${shop.name}</div>
          <div class="shop-address">${shop.address || 'Address on map'}</div>
          <div class="shop-meta">
            <span class="shop-rating">${rating} ${stars}</span>
            ${shop.phone ? `<a href="tel:${shop.phone}" class="shop-phone" onclick="event.stopPropagation()">?? ${shop.phone}</a>` : ''}
          </div>
          ${shop.website ? `<a href="${shop.website}" target="_blank" class="shop-website" onclick="event.stopPropagation()">?? Visit Website</a>` : ''}
          ${adminUser ? `
            <div class="shop-admin-actions" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-outline" onclick="openShopEditor(${shopData})">?? Edit</button>
              ${shop.id ? `<button class="btn btn-sm btn-danger" onclick="deleteShopFromDirectory('${shop.id}', '${shop.mode || 'sea'}')">??? Delete</button>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    });

    html += '</div></div>';
  });

  html += '</div>';

  // Add summary stats
  const totalShops = combinedShops.length;
  const counties = sortedCounties.length;
  const avgRating = (combinedShops.reduce((acc, s) => acc + (s.rating || 4.5), 0) / totalShops).toFixed(1);

  html = `
    <div class="directory-stats">
      <div class="stat-item">
        <span class="stat-value">${totalShops}</span>
        <span class="stat-label">Total Shops</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${counties}</span>
        <span class="stat-label">Counties</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">? ${avgRating}</span>
        <span class="stat-label">Avg Rating</span>
      </div>
      ${adminUser ? `
        <div class="stat-item">
          <button class="btn btn-primary btn-sm" onclick="openShopEditor(null)">? Add New Shop</button>
        </div>
      ` : ''}
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
      html: '??',
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
// Shop Management Functions (Admin)
// ============================================
let editingShop = null;

window.openShopEditor = (shop) => {
  editingShop = shop;
  const modal = document.getElementById('shop-editor-modal');
  const title = document.getElementById('shop-editor-title');
  const deleteBtn = document.getElementById('delete-shop-btn');

  if (shop) {
    title.textContent = 'Edit Shop';
    deleteBtn.style.display = shop.id ? 'block' : 'none';
    document.getElementById('shop-id').value = shop.id || '';
    document.getElementById('shop-name').value = shop.name || '';
    document.getElementById('shop-county').value = shop.county || '';
    document.getElementById('shop-address').value = shop.address || '';
    document.getElementById('shop-phone').value = shop.phone || '';
    document.getElementById('shop-website').value = shop.website || '';
    document.getElementById('shop-lat').value = shop.lat || '';
    document.getElementById('shop-lon').value = shop.lng || shop.lon || '';
    document.getElementById('shop-rating').value = shop.rating || '';
    document.getElementById('shop-mode').value = shop.mode || 'sea';
  } else {
    title.textContent = 'Add New Shop';
    deleteBtn.style.display = 'none';
    document.getElementById('shop-id').value = '';
    document.getElementById('shop-name').value = '';
    document.getElementById('shop-county').value = '';
    document.getElementById('shop-address').value = '';
    document.getElementById('shop-phone').value = '';
    document.getElementById('shop-website').value = '';
    document.getElementById('shop-lat').value = '';
    document.getElementById('shop-lon').value = '';
    document.getElementById('shop-rating').value = '4.5';
    document.getElementById('shop-mode').value = 'sea';
  }

  modal.classList.add('active');
};

window.closeShopEditor = () => {
  document.getElementById('shop-editor-modal').classList.remove('active');
  editingShop = null;
};

window.saveShop = async (event) => {
  event.preventDefault();

  const existingId = document.getElementById('shop-id').value;
  const isNew = !existingId;

  const shopData = {
    id: isNew ? `shop_${Date.now()}` : existingId,
    name: document.getElementById('shop-name').value,
    county: document.getElementById('shop-county').value,
    address: document.getElementById('shop-address').value,
    phone: document.getElementById('shop-phone').value,
    website: document.getElementById('shop-website').value,
    lat: parseFloat(document.getElementById('shop-lat').value),
    lng: parseFloat(document.getElementById('shop-lon').value),
    rating: parseFloat(document.getElementById('shop-rating').value) || 4.5,
    mode: document.getElementById('shop-mode').value || 'sea',
    addedBy: state.user?.email || 'admin',
    addedAt: new Date().toISOString()
  };

  try {
    // Save to Firebase
    const path = `locations/${shopData.mode}/shops/${shopData.id}`;
    await firebase.database().ref(path).set(shopData);

    // Update local admin locations if admin panel is loaded
    if (adminLocations && adminLocations[shopData.mode]) {
      if (!adminLocations[shopData.mode].shops) {
        adminLocations[shopData.mode].shops = [];
      }
      const existingIdx = adminLocations[shopData.mode].shops.findIndex(s => s.id === shopData.id);
      if (existingIdx >= 0) {
        adminLocations[shopData.mode].shops[existingIdx] = shopData;
      } else {
        adminLocations[shopData.mode].shops.push(shopData);
      }
    }

    closeShopEditor();

    // Reload directory to show changes
    await loadNationalDirectory();

    // Reload admin map if it exists
    if (adminMap) {
      loadAdminLocations();
    }

    alert('Shop saved successfully!');
  } catch (err) {
    console.error('Failed to save shop:', err);
    alert('Failed to save shop. Please try again.');
  }
};

window.deleteShop = async () => {
  if (!editingShop || !editingShop.id) {
    alert('Cannot delete this shop.');
    return;
  }

  if (!confirm(`Are you sure you want to delete "${editingShop.name}"?`)) return;

  try {
    const mode = editingShop.mode || 'sea';
    const path = `locations/${mode}/shops/${editingShop.id}`;
    await firebase.database().ref(path).remove();

    // Remove from local state
    if (adminLocations && adminLocations[mode] && adminLocations[mode].shops) {
      adminLocations[mode].shops = adminLocations[mode].shops.filter(s => s.id !== editingShop.id);
    }

    closeShopEditor();

    // Reload directory
    await loadNationalDirectory();

    // Reload admin map if it exists
    if (adminMap) {
      loadAdminLocations();
    }

    alert('Shop deleted successfully!');
  } catch (err) {
    console.error('Failed to delete shop:', err);
    alert('Failed to delete shop. Please try again.');
  }
};

window.deleteShopFromDirectory = async (shopId, mode) => {
  // Find the shop to get its name for confirmation
  let shopName = 'this shop';
  try {
    const snapshot = await firebase.database().ref(`locations/${mode}/shops/${shopId}`).once('value');
    const shop = snapshot.val();
    if (shop) shopName = shop.name;
  } catch (err) {
    console.warn('Could not fetch shop name:', err);
  }

  if (!confirm(`Are you sure you want to delete "${shopName}"?`)) return;

  try {
    const path = `locations/${mode}/shops/${shopId}`;
    await firebase.database().ref(path).remove();

    // Remove from local state
    if (adminLocations && adminLocations[mode] && adminLocations[mode].shops) {
      adminLocations[mode].shops = adminLocations[mode].shops.filter(s => s.id !== shopId);
    }

    // Reload directory
    await loadNationalDirectory();

    // Reload admin map if it exists
    if (adminMap) {
      loadAdminLocations();
    }

    alert('Shop deleted successfully!');
  } catch (err) {
    console.error('Failed to delete shop:', err);
    alert('Failed to delete shop. Please try again.');
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

window.openPrivacyModal = () => {
  document.getElementById('privacy-modal').classList.add('active');
};

window.closePrivacyModal = () => {
  document.getElementById('privacy-modal').classList.remove('active');
};

window.togglePasswordVisibility = () => {
  const passwordInput = document.getElementById('auth-password');
  const toggleBtn = document.getElementById('password-toggle-btn');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = '??'; // Hide icon
    toggleBtn.title = 'Hide Password';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = '???'; // Show icon
    toggleBtn.title = 'Show Password';
  }
};

// ============================================
// Username Editor (Admin)
// ============================================
window.openUsernameEditor = (userId, currentUsername, userEmail) => {
  document.getElementById('username-edit-userid').value = userId;
  document.getElementById('username-edit-input').value = currentUsername;
  document.getElementById('username-edit-email').textContent = userEmail;
  document.getElementById('username-editor-modal').classList.add('active');
};

window.closeUsernameEditor = () => {
  document.getElementById('username-editor-modal').classList.remove('active');
};

window.saveUsername = async () => {
  const userId = document.getElementById('username-edit-userid').value;
  const newUsername = document.getElementById('username-edit-input').value.trim();

  if (!newUsername) {
    alert('Username cannot be empty');
    return;
  }

  if (newUsername.length < 3) {
    alert('Username must be at least 3 characters');
    return;
  }

  try {
    // Update username in Firebase
    await firebase.database().ref(`users/${userId}`).update({
      username: newUsername
    });

    alert('Username updated successfully!');
    closeUsernameEditor();

    // Reload the users table if there's a function for it
    // If you have a loadAdminDashboard or similar function, call it here
    // For now, just reload the page section
    if (typeof loadAdminDashboard === 'function') {
      loadAdminDashboard();
    }
  } catch (error) {
    console.error('Error updating username:', error);
    alert('Failed to update username. Please try again.');
  }
};

// ============================================
// Admin Location Manager
// ============================================
let adminMap = null;
let adminMapMode = 'sea';
let adminMarkers = L.layerGroup();
let addLocationMode = false;
let editingLocation = null;

// Admin-managed locations stored in Firebase
let adminLocations = {
  sea: { piers: [], ramps: [], harbours: [], shops: [] },
  freshwater: { spots: [], parks: [], ramps: [], piers: [], shops: [] }
};

function initAdminMap() {
  if (adminMap) {
    adminMap.invalidateSize();
    return;
  }

  const mapContainer = document.getElementById('admin-map');
  if (!mapContainer) return;

  adminMap = L.map('admin-map', {
    zoomSnap: 0,
    zoomDelta: 0.25,
    wheelPxPerZoomLevel: 60
  }).setView([53.5, -8.0], 7);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(adminMap);

  adminMarkers.addTo(adminMap);

  // Click handler for adding locations
  adminMap.on('click', (e) => {
    if (addLocationMode) {
      openLocationEditor(null, e.latlng.lat, e.latlng.lng);
      disableAddLocationMode();
    }
  });

  loadAdminLocationsFromFirebase();
  loadAdminLocations();
}

window.setAdminMapMode = (mode) => {
  adminMapMode = mode;
  document.getElementById('admin-mode-sea').classList.toggle('active', mode === 'sea');
  document.getElementById('admin-mode-freshwater').classList.toggle('active', mode === 'freshwater');

  // Update type selector based on mode
  const typeSelect = document.getElementById('admin-location-type');
  if (mode === 'sea') {
    typeSelect.innerHTML = `
      <option value="pier">?? Pier</option>
      <option value="ramp">?? Boat Ramp</option>
      <option value="harbour">??? Harbour</option>
      <option value="shop">?? Tackle Shop</option>
    `;
  } else {
    typeSelect.innerHTML = `
      <option value="spot">?? Fishing Spot</option>
      <option value="park">?? Park</option>
      <option value="ramp">?? Boat Ramp</option>
      <option value="pier">?? Pier</option>
      <option value="shop">?? Tackle Shop</option>
    `;
  }

  loadAdminLocations();
};

function loadAdminLocations() {
  adminMarkers.clearLayers();

  const typeIcons = {
    pier: '??', ramp: '??', harbour: '???',
    spot: '??', park: '??', shop: '??'
  };

  // Get source arrays based on mode
  let locations = [];
  if (adminMapMode === 'sea') {
    locations = [
      ...PIERS.map(p => ({ ...p, type: 'pier', source: 'static' })),
      ...BOAT_RAMPS.map(r => ({ ...r, type: 'ramp', source: 'static' })),
      ...HARBOURS.map(h => ({ ...h, type: 'harbour', source: 'static' })),
      ...TACKLE_SHOPS.map(s => ({ ...s, type: 'shop', source: 'static' })),
      ...(adminLocations.sea.piers || []).map(p => ({ ...p, type: 'pier', source: 'firebase' })),
      ...(adminLocations.sea.ramps || []).map(r => ({ ...r, type: 'ramp', source: 'firebase' })),
      ...(adminLocations.sea.harbours || []).map(h => ({ ...h, type: 'harbour', source: 'firebase' })),
      ...(adminLocations.sea.shops || []).map(s => ({ ...s, type: 'shop', source: 'firebase' }))
    ];
  } else {
    locations = [
      ...FRESHWATER_SPOTS.map(s => ({ ...s, type: 'spot', source: 'static' })),
      ...FRESHWATER_PARKS.map(p => ({ ...p, type: 'park', source: 'static' })),
      ...FRESHWATER_RAMPS.map(r => ({ ...r, type: 'ramp', source: 'static' })),
      ...FRESHWATER_PIERS.map(p => ({ ...p, type: 'pier', source: 'static' })),
      ...(adminLocations.freshwater.spots || []).map(s => ({ ...s, type: 'spot', source: 'firebase' })),
      ...(adminLocations.freshwater.parks || []).map(p => ({ ...p, type: 'park', source: 'firebase' })),
      ...(adminLocations.freshwater.ramps || []).map(r => ({ ...r, type: 'ramp', source: 'firebase' })),
      ...(adminLocations.freshwater.piers || []).map(p => ({ ...p, type: 'pier', source: 'firebase' })),
      ...(adminLocations.freshwater.shops || []).map(s => ({ ...s, type: 'shop', source: 'firebase' }))
    ];
  }

  // Add markers
  locations.forEach(loc => {
    const longitude = loc.lon || loc.lng; // Handle both lon and lng
    if (!loc.lat || !longitude) return; // Skip if missing coordinates

    const icon = L.divIcon({
      className: 'admin-marker',
      html: `<div class="admin-marker-icon" data-source="${loc.source}">${typeIcons[loc.type] || '??'}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([loc.lat, longitude], { icon })
      .bindPopup(`<strong>${loc.name}</strong><br><em>${loc.type}</em>`)
      .on('click', () => {
        if (!addLocationMode) {
          openLocationEditor({ ...loc, lon: longitude }); // Normalize to lon
        }
      });

    adminMarkers.addLayer(marker);
  });

  // Update location list
  renderAdminLocationList(locations);
  document.getElementById('admin-location-count').textContent = `(${locations.length})`;
}

function renderAdminLocationList(locations) {
  const container = document.getElementById('admin-location-list');
  const typeIcons = { pier: '??', ramp: '??', harbour: '???', spot: '??', park: '??', shop: '??' };

  container.innerHTML = locations.map(loc => {
    const longitude = loc.lon || loc.lng;
    const normalizedLoc = { ...loc, lon: longitude };
    return `
    <div class="location-list-item" onclick="flyToLocation(${loc.lat}, ${longitude})">
      <div class="location-info">
        <span>${typeIcons[loc.type] || '??'}</span>
        <div>
          <div class="location-name">${loc.name}</div>
          <div class="location-type">${loc.type} ${loc.source === 'firebase' ? '(custom)' : '(built-in)'}</div>
        </div>
      </div>
      <div class="location-actions">
        <button class="action-btn" onclick="event.stopPropagation(); openLocationEditor(${JSON.stringify(normalizedLoc).replace(/"/g, '&quot;')})">??</button>
      </div>
    </div>
  `;
  }).join('');
}

window.flyToLocation = (lat, lon) => {
  if (adminMap) {
    adminMap.flyTo([lat, lon], 12);
  }
};

window.enableAddLocationMode = () => {
  addLocationMode = true;
  document.getElementById('add-location-btn').classList.add('active');
  document.getElementById('admin-map-instructions').style.display = 'block';
  if (adminMap) adminMap.getContainer().style.cursor = 'crosshair';
};

function disableAddLocationMode() {
  addLocationMode = false;
  document.getElementById('add-location-btn').classList.remove('active');
  document.getElementById('admin-map-instructions').style.display = 'none';
  if (adminMap) adminMap.getContainer().style.cursor = '';
}

window.openLocationEditor = (location, lat, lon) => {
  editingLocation = location;
  const modal = document.getElementById('location-editor-modal');
  const title = document.getElementById('location-editor-title');
  const deleteBtn = document.getElementById('delete-location-btn');
  const typeSelect = document.getElementById('location-type-edit');

  // Set type options based on current mode
  if (adminMapMode === 'sea') {
    typeSelect.innerHTML = `
    < option value = "pier" >?? Pier</option >
      <option value="ramp">?? Boat Ramp</option>
      <option value="harbour">??? Harbour</option>
      <option value="shop">?? Tackle Shop</option>
  `;
  } else {
    typeSelect.innerHTML = `
    < option value = "spot" >?? Fishing Spot</option >
      <option value="park">?? Park</option>
      <option value="ramp">?? Boat Ramp</option>
      <option value="pier">?? Pier</option>
      <option value="shop">?? Tackle Shop</option>
  `;
  }

  if (location) {
    title.textContent = 'Edit Location';
    deleteBtn.style.display = 'block';
    document.getElementById('location-id').value = location.id || '';
    document.getElementById('location-name').value = location.name || '';
    document.getElementById('location-lat').value = location.lat || '';
    document.getElementById('location-lon').value = location.lon || '';
    typeSelect.value = location.type || 'pier';
    document.getElementById('location-description').value = location.description || '';
  } else {
    title.textContent = 'Add Location';
    deleteBtn.style.display = 'none';
    document.getElementById('location-id').value = '';
    document.getElementById('location-name').value = '';
    document.getElementById('location-lat').value = lat || '';
    document.getElementById('location-lon').value = lon || '';
    typeSelect.value = document.getElementById('admin-location-type').value;
    document.getElementById('location-description').value = '';
  }

  document.getElementById('location-mode').value = adminMapMode;
  modal.classList.add('active');
};

window.closeLocationEditor = () => {
  document.getElementById('location-editor-modal').classList.remove('active');
  editingLocation = null;
};

window.saveLocation = async (event) => {
  event.preventDefault();

  // Generate new ID if editing a built-in location (which has no ID) or if no ID exists
  const existingId = document.getElementById('location-id').value;
  const isNewOrBuiltIn = !existingId || (editingLocation && editingLocation.source === 'static');

  const locationData = {
    id: isNewOrBuiltIn ? `loc_${Date.now()}` : existingId,
    name: document.getElementById('location-name').value,
    lat: parseFloat(document.getElementById('location-lat').value),
    lon: parseFloat(document.getElementById('location-lon').value),
    type: document.getElementById('location-type-edit').value,
    mode: document.getElementById('location-mode').value,
    description: document.getElementById('location-description').value,
    addedBy: state.user?.email || 'admin',
    addedAt: new Date().toISOString(),
    originalName: editingLocation?.source === 'static' ? editingLocation.name : null
  };

  try {
    // Save to Firebase
    const path = `locations/${locationData.mode}/${locationData.type}s/${locationData.id}`;
    await firebaseDB.ref(path).set(locationData);

    // Update local state
    const typeKey = locationData.type + 's';
    if (!adminLocations[locationData.mode][typeKey]) {
      adminLocations[locationData.mode][typeKey] = [];
    }

    const existingIdx = adminLocations[locationData.mode][typeKey].findIndex(l => l.id === locationData.id);
    if (existingIdx >= 0) {
      adminLocations[locationData.mode][typeKey][existingIdx] = locationData;
    } else {
      adminLocations[locationData.mode][typeKey].push(locationData);
    }

    closeLocationEditor();
    loadAdminLocations();
    alert('Location saved successfully!');
  } catch (err) {
    console.error('Failed to save location:', err);
    alert('Failed to save location. Please try again.');
  }
};

window.deleteLocation = async () => {
  if (!editingLocation || !editingLocation.id) return;

  if (!confirm(`Are you sure you want to delete "${editingLocation.name}" ? `)) return;

  try {
    const path = `locations/${editingLocation.mode || adminMapMode}/${editingLocation.type}s/${editingLocation.id}`;
    await firebaseDB.ref(path).remove();

    // Remove from local state
    const typeKey = editingLocation.type + 's';
    const mode = editingLocation.mode || adminMapMode;
    adminLocations[mode][typeKey] = (adminLocations[mode][typeKey] || []).filter(l => l.id !== editingLocation.id);

    closeLocationEditor();
    loadAdminLocations();
    alert('Location deleted successfully!');
  } catch (err) {
    console.error('Failed to delete location:', err);
    alert('Failed to delete location. Please try again.');
  }
};

async function loadAdminLocationsFromFirebase() {
  try {
    const snapshot = await firebase.database().ref('locations').once('value');
    const data = snapshot.val();

    if (data) {
      // Sea locations
      if (data.sea) {
        adminLocations.sea.piers = Object.values(data.sea.piers || {});
        adminLocations.sea.ramps = Object.values(data.sea.ramps || {});
        adminLocations.sea.harbours = Object.values(data.sea.harbours || {});
        adminLocations.sea.shops = Object.values(data.sea.shops || {});
      }

      // Freshwater locations
      if (data.freshwater) {
        adminLocations.freshwater.spots = Object.values(data.freshwater.spots || {});
        adminLocations.freshwater.parks = Object.values(data.freshwater.parks || {});
        adminLocations.freshwater.ramps = Object.values(data.freshwater.ramps || {});
        adminLocations.freshwater.piers = Object.values(data.freshwater.piers || {});
        adminLocations.freshwater.shops = Object.values(data.freshwater.shops || {});
      }
    }

    loadAdminLocations();
  } catch (err) {
    console.warn('Failed to load locations from Firebase:', err);
  }
}


window.toggleAdminDropdown = (userId) => {
  document.querySelectorAll('.util-dropdown').forEach(d => {
    if (d.id !== `dropdown-${userId}`) d.classList.remove('active');
  });
  const dropdown = document.getElementById(`dropdown-${userId}`);
  if (dropdown) dropdown.classList.toggle('active');
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.util-dropdown')) {
    document.querySelectorAll('.util-dropdown').forEach(d => d.classList.remove('active'));
  }
});

window.toggleAdminSearch = () => {
  const container = document.getElementById('admin-search-container');
  const input = document.getElementById('admin-user-search');
  if (container) {
    container.classList.toggle('active');
    if (container.classList.contains('active')) {
      input.focus();
    }
  }
};

// [ADMIN] Global admin state
let emailTarget = null;

const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome to Irish Fishing Hub! ??",
    body: "Hi there,\n\nWelcome to the Irish Fishing Hub community! We're thrilled to have you on board.\n\nAs a member, you now have access to:\n- Real-time Tide Data for stations across Ireland\n- Sea & Coastal Weather Forecasts\n- Our community Catch Feed to share your success\n- A detailed Directory of local fishing shops and services\n\nYou can review our Terms & Conditions and Privacy Policy at any time via the links at the bottom of our website.\n\nTight lines!\nThe Irish Fishing Hub Team"
  },
  update: {
    subject: "Irish Fishing Hub App Update ??",
    body: "Hello Anglers,\n\nWe've just pushed a small update to improve your experience on the Hub! \n\nWhat's new:\n- Refined mobile navigation and performance\n- New \"Utilities\" dashboard for faster account management\n- Updated legal disclosures\n\nYou can check out our latest Terms and Privacy Policy at the bottom of the page. Refresh your app now to see the latest version.\n\nHappy Fishing!"
  },
  legal: {
    subject: "Important: Updates to our Privacy and Terms ??",
    body: "Dear Member,\n\nWe've recently updated our Privacy Policy and Terms & Conditions (Effective Feb 1, 2026).\n\nKey changes include:\n- Clearer disclosures regarding advertising redirects (SmartLinks) that help keep our core features free for everyone\n- Updated data protection policies\n\nYou can review the updated documents via the links in the footer at the bottom of our website.\n\nThank you for being part of our community and helping us keep the Hub running."
  },
  custom: { subject: "", body: "" }
};

window.openEmailCenter = (email = null) => {
  const center = document.getElementById('admin-email-center');
  if (center) {
    center.style.display = 'block';
    emailTarget = email;

    if (email) {
      document.getElementById('email-total-members').innerHTML = `Single Recipient: <span style="color:var(--primary-color)">${email}</span>`;
      loadEmailTemplate('welcome');
    } else {
      document.getElementById('email-total-members').textContent = `${state.allUsers.length} Members`;
      loadEmailTemplate('update');
    }

    center.scrollIntoView({ behavior: 'smooth' });
  }
};

window.closeEmailCenter = () => {
  const center = document.getElementById('admin-email-center');
  if (center) center.style.display = 'none';
};

window.loadEmailTemplate = (type) => {
  const template = EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES.custom;
  document.getElementById('email-subject').value = template.subject;
  document.getElementById('email-body').value = template.body;
  document.querySelectorAll('.template-btn').forEach(btn => {
    const isThisOne = (type === 'update' && btn.id === 'btn-temp-update') ||
      (type === 'legal' && btn.id === 'btn-temp-legal') ||
      (type === 'welcome' && btn.id === 'btn-temp-welcome') ||
      (type === 'custom' && btn.id === 'btn-temp-custom');
    btn.classList.toggle('active', isThisOne);
  });
};

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://your-production-backend-url.com';

window.broadcastEmailToAll = async () => {
  const subject = document.getElementById('email-subject').value.trim();
  const body = document.getElementById('email-body').value.trim();
  const statusEl = document.getElementById('email-status-text');

  if (!subject || !body) { alert('Please provide both a subject and a message body.'); return; }

  if (emailTarget) {
    if (!confirm(`?? SEND TO MEMBER\n\nSend this email to ${emailTarget}?`)) return;
    statusEl.textContent = '?? Sending to member...';
    console.log(`?? [MOCK EMAIL] To: ${emailTarget} | Subject: ${subject}`);
    await new Promise(r => setTimeout(r, 800));
    statusEl.textContent = `? Email sent to ${emailTarget}`;
    alert(`Success! Email sent to ${emailTarget}.`);
  } else {
    if (!confirm(`?? BROADCAST TO ALL MEMBERS\n\nAre you sure you want to send this email to all ${state.allUsers.length} registered members?`)) return;

    statusEl.textContent = '?? Preparing broadcast...';
    let successCount = 0;

    for (const user of state.allUsers) {
      console.log(`?? [MOCK EMAIL] To: ${user.email} | Subject: ${subject}`);
      successCount++;
      statusEl.textContent = `?? Sending: ${successCount} / ${state.allUsers.length}...`;
      if (successCount % 10 === 0) await new Promise(r => setTimeout(r, 50));
    }

    statusEl.textContent = `? Successfully broadcast to ${successCount} members!`;
    alert(`Broadcast Complete!\n\nSuccessfully sent to ${successCount} members.`);
  }

  document.getElementById('email-last-sent').textContent = new Date().toLocaleString('en-GB');
};

window.testEmailPreview = () => {
  const subject = document.getElementById('email-subject').value;
  const body = document.getElementById('email-body').value;
  const previewWindow = window.open('', '_blank');
  previewWindow.document.write(`
    <html><body style="font-family:sans-serif;padding:40px;background:#f4f4f4;">
      <div style="max-width:600px;margin:0 auto;background:white;padding:30px;border-radius:10px;">
        <h1 style="font-size:1.2rem;border-bottom:1px solid #eee;">${subject || '(No Subject)'}</h1>
        <div style="white-space:pre-wrap;line-height:1.6;">${body || '(No Body)'}</div>
      </div>
    </body></html>
  `);
};
