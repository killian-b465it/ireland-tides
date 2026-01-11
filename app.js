/**
 * Ireland Tides - Real-Time Fishing Tide Data
 * Main Application Logic
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
  apiBase: 'https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork',
  mapCenter: [53.5, -8.0],
  mapZoom: 7,
  updateInterval: 5 * 60 * 1000,
  stations: [
    { id: 'Dublin_Port', name: 'Dublin Port', lat: 53.3478, lon: -6.2044, region: 'East Coast' },
    { id: 'Howth', name: 'Howth Harbour', lat: 53.3897, lon: -6.0656, region: 'East Coast' },
    { id: 'Arklow', name: 'Arklow', lat: 52.7978, lon: -6.1419, region: 'East Coast' },
    { id: 'Courtown', name: 'Courtown Harbour', lat: 52.6461, lon: -6.2289, region: 'East Coast' },
    { id: 'Wexford', name: 'Wexford', lat: 52.3369, lon: -6.4572, region: 'East Coast' },
    { id: 'Rosslare', name: 'Rosslare', lat: 52.2533, lon: -6.3381, region: 'East Coast' },
    { id: 'Dunmore_East', name: 'Dunmore East', lat: 52.1489, lon: -6.9903, region: 'South Coast' },
    { id: 'Cobh', name: 'Cobh (Cork)', lat: 51.8503, lon: -8.2967, region: 'South Coast' },
    { id: 'Ballycotton', name: 'Ballycotton', lat: 51.8264, lon: -8.0089, region: 'South Coast' },
    { id: 'Kinsale', name: 'Kinsale', lat: 51.7058, lon: -8.5222, region: 'South Coast' },
    { id: 'Union_Hall', name: 'Union Hall', lat: 51.5361, lon: -9.1372, region: 'South Coast' },
    { id: 'Schull', name: 'Schull', lat: 51.5278, lon: -9.5417, region: 'South Coast' },
    { id: 'Castletownbere', name: 'Castletownbere', lat: 51.6503, lon: -9.9108, region: 'South Coast' },
    { id: 'Bantry', name: 'Bantry', lat: 51.6803, lon: -9.4528, region: 'South West' },
    { id: 'Dingle', name: 'Dingle', lat: 52.1408, lon: -10.2686, region: 'South West' },
    { id: 'Fenit', name: 'Fenit', lat: 52.2728, lon: -9.8608, region: 'South West' },
    { id: 'Tarbert', name: 'Tarbert', lat: 52.5747, lon: -9.3664, region: 'South West' },
    { id: 'Kilrush', name: 'Kilrush', lat: 52.6347, lon: -9.4872, region: 'South West' },
    { id: 'Galway', name: 'Galway', lat: 53.2707, lon: -9.0568, region: 'West Coast' },
    { id: 'Rossaveal', name: 'Rossaveal', lat: 53.2667, lon: -9.8333, region: 'West Coast' },
    { id: 'Clifden', name: 'Clifden', lat: 53.4897, lon: -10.0189, region: 'West Coast' },
    { id: 'Westport', name: 'Westport', lat: 53.8008, lon: -9.5228, region: 'West Coast' },
    { id: 'Ballyglass', name: 'Ballyglass', lat: 54.2500, lon: -9.8833, region: 'West Coast' },
    { id: 'Sligo', name: 'Sligo', lat: 54.2697, lon: -8.4761, region: 'West Coast' },
    { id: 'Killybegs', name: 'Killybegs', lat: 54.6364, lon: -8.4400, region: 'North West' },
    { id: 'Aranmore', name: 'Aranmore Island', lat: 54.9947, lon: -8.5214, region: 'North West' },
    { id: 'Buncrana', name: 'Buncrana', lat: 55.1333, lon: -7.4500, region: 'North West' },
    { id: 'Malin_Head', name: 'Malin Head', lat: 55.3717, lon: -7.3392, region: 'North West' },
    {
      id: 'Inis_Mor', name: 'Inis Mór (Aran Islands)', lat: 53.0647, lon: -9.6647, status: 'offline', region: 'West Coast', maintenance: {
        reason: 'Port development works',
        duration: 'Ongoing for 2026',
        restoration: 'TBD Late 2026'
      }
    },
    { id: 'Portrush', name: 'Portrush', lat: 55.2069, lon: -6.6556, region: 'North of Ireland' },
    { id: 'Larne', name: 'Larne', lat: 54.8531, lon: -5.7928, region: 'North of Ireland' },
    { id: 'Bangor', name: 'Bangor', lat: 54.6603, lon: -5.6689, region: 'North of Ireland' },
    { id: 'Belfast', name: 'Belfast', lat: 54.6097, lon: -5.9289, region: 'North of Ireland' },
    { id: 'Warrenpoint', name: 'Warrenpoint', lat: 54.0997, lon: -6.2519, region: 'North of Ireland' },
    { id: 'Carlingford', name: 'Carlingford', lat: 54.0442, lon: -6.1883, region: 'North of Ireland' }
  ],
  API_KEYS: {
    streetView: 'DEMO_KEY_PLACEHOLDER' // Replace with valid Google Maps API Key
  }
};

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
  tideData: {},
  isLoading: false,
  catches: JSON.parse(localStorage.getItem('fishing_catches') || '[]'),
  currentModalLatLng: null,
  user: JSON.parse(localStorage.getItem('fishing_user') || sessionStorage.getItem('fishing_user') || 'null'),
  authMode: 'login' // 'login' or 'signup'
};

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
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  initMap();
  loadStationList();
  startAutoUpdate();
  updateAuthUI();
  showPage('home');

  // Dismiss loading screen after animation
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) loader.classList.add('hidden');
  }, 6500); // 1s delay + 5s fill animation
});

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

  state.shopMarkers = L.layerGroup().addTo(state.map);

  CONFIG.stations.forEach(station => {
    addStationMarker(station);
  });
}

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
      return `
              <div class="station-item" data-station="${station.id}" data-station-index="${CONFIG.stations.indexOf(station)}">
                <div class="station-indicator ${station.status === 'offline' ? 'offline' : ''}"></div>
                <span class="station-name">${station.name}</span>
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

  try {
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const url = `${CONFIG.apiBase}.json?station_id,time,Water_Level&time>=${past24h.toISOString()}&orderBy("time")`;

    const response = await fetch(url);
    if (!response.ok) throw new Error();
    const data = await response.json();

    const stationData = data.table.rows.filter(row =>
      row[0].toLowerCase().includes(station.id.toLowerCase().replace('_', ' ')) ||
      row[0].toLowerCase().includes(station.name.toLowerCase())
    );

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
      photo: photoData,
      likes: 0,
      likedBy: [],
      comments: []
    };
    state.catches.unshift(c);
    localStorage.setItem('fishing_catches', JSON.stringify(state.catches));
    addCommunityMarker(c);
    renderCatchFeed();
    closeModal();
  };

  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => processCatch(e.target.result);
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    processCatch(null);
  }
};

function loadCommunityCatches() {
  state.catches.forEach(addCommunityMarker);
  renderCatchFeed();
}

function addCommunityMarker(c) {
  const icon = L.divIcon({ className: 'social-marker', html: '📸', iconSize: [24, 24] });
  L.marker([c.lat, c.lng], { icon }).bindPopup(`<strong>${c.species}</strong><br>${c.date}<br>${c.details}`).addTo(state.communityMap);
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
      text: text,
      date: new Date().toLocaleDateString('en-GB')
    });

    // Persist
    localStorage.setItem('fishing_catches', JSON.stringify(state.catches));
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

  if (state.authMode === 'login') {
    title.innerText = 'Welcome Back';
    sub.innerText = 'Log in to your account';
    btn.innerText = 'Log In';
    switchTarget.parentElement.innerHTML = `Don't have an account? <a href="#" onclick="toggleAuthMode()">Sign up</a>`;
  } else {
    title.innerText = 'Join the Hub';
    sub.innerText = 'Create your free account';
    btn.innerText = 'Sign Up';
    switchTarget.parentElement.innerHTML = `Already have an account? <a href="#" onclick="toggleAuthMode()">Log in</a>`;
  }
}

window.handleAuthSubmit = () => {
  const email = document.getElementById('auth-email').value;
  if (!email) return alert('Enter email');

  const remember = document.getElementById('auth-remember').checked;

  // Mock login
  const name = email.split('@')[0];
  state.user = {
    id: 'user_' + Date.now(),
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email: email,
    plan: 'free',
    remember: remember
  };

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

  if (state.user) {
    loginBtn.style.display = 'none';
    userDisplay.style.display = 'flex';
    label.innerText = state.user.name;
    // Show [PRO] if premium
    if (state.user.plan === 'pro') {
      label.innerHTML += ' <span style="font-size:0.65rem; color:#ffab00">[PRO]</span>';
    }
  } else {
    loginBtn.style.display = 'block';
    userDisplay.style.display = 'none';
  }

  // Update avatar in navbar if it exists
  const navAvatar = document.querySelector('.user-avatar');
  if (state.user && state.user.avatar) {
    navAvatar.innerHTML = '';
    navAvatar.style.backgroundImage = `url(${state.user.avatar})`;
    navAvatar.style.backgroundSize = 'cover';
  } else {
    navAvatar.innerHTML = '👤';
    navAvatar.style.backgroundImage = 'none';
  }
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
    upgradeBtn.style.display = 'none';
  } else {
    badge.classList.remove('pro');
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
  // Check if it's not the SVG placeholder which is usually long, but let's just save src logic
  if (imgSrc.startsWith('data:image')) {
    state.user.avatar = imgSrc;
  }

  // Persist
  if (state.user.remember || localStorage.getItem('fishing_user')) {
    localStorage.setItem('fishing_user', JSON.stringify(state.user));
  } else {
    sessionStorage.setItem('fishing_user', JSON.stringify(state.user));
  }

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

  // Mock upgrade
  state.user.plan = 'pro';

  if (state.user.remember || localStorage.getItem('fishing_user')) {
    localStorage.setItem('fishing_user', JSON.stringify(state.user));
  } else {
    sessionStorage.setItem('fishing_user', JSON.stringify(state.user));
  }

  updateAuthUI();
  closePremiumModal();
  showPage('community');
  alert('Welcome to Pro! You now have full access to the Community Hub.');
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
