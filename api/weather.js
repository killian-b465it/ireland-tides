// Vercel serverless function — proxies wttr.in weather server-side
// Transforms wttr.in JSON to Open-Meteo format so the front-end needs no changes.
export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        return res.status(200).end();
    }

    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon query params are required' });
    }

    try {
        const url = `https://wttr.in/${lat},${lon}?format=j1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'IrishFishingHub/3.0' } });
        if (!response.ok) throw new Error(`wttr.in responded ${response.status}`);
        const wttr = await response.json();

        // Map wttr.in weather codes to Open-Meteo WMO codes
        const wttrToWmo = {
            113:0, 116:2, 119:3, 122:3, 143:45, 176:61, 179:71, 182:66,
            185:56, 200:95, 227:75, 230:75, 248:45, 260:48, 263:51, 266:51,
            281:56, 284:57, 293:61, 296:61, 299:63, 302:63, 305:65, 308:65,
            311:66, 314:67, 317:66, 320:67, 323:71, 326:71, 329:73, 332:73,
            335:75, 338:75, 350:77, 353:80, 356:81, 359:82, 362:85, 365:85,
            368:85, 371:86, 374:85, 377:86, 386:95, 389:95, 392:95, 395:95
        };
        const mapCode = c => wttrToWmo[parseInt(c)] ?? 0;

        const parseTime = (dateStr, timeStr) => {
            const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return `${dateStr}T06:00`;
            let h = parseInt(match[1]), m = parseInt(match[2]);
            const pm = match[3].toUpperCase() === 'PM';
            if (pm && h !== 12) h += 12;
            if (!pm && h === 12) h = 0;
            return `${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        };

        const cur = wttr.current_condition[0];
        const days = wttr.weather;

        const data = {
            current: {
                temperature_2m:       parseFloat(cur.temp_C),
                apparent_temperature: parseFloat(cur.FeelsLikeC),
                weather_code:         mapCode(cur.weatherCode),
                wind_speed_10m:       parseFloat(cur.windspeedKmph),
                wind_direction_10m:   parseFloat(cur.winddirDegree),
                relative_humidity_2m: parseFloat(cur.humidity)
            },
            daily: {
                time:               days.map(d => d.date),
                weather_code:       days.map(d => mapCode(d.hourly[4]?.weatherCode ?? 113)),
                temperature_2m_max: days.map(d => parseFloat(d.maxtempC)),
                temperature_2m_min: days.map(d => parseFloat(d.mintempC)),
                sunrise:            days.map(d => parseTime(d.date, d.astronomy[0].sunrise)),
                sunset:             days.map(d => parseTime(d.date, d.astronomy[0].sunset))
            }
        };

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json(data);
    } catch (error) {
        console.error('Weather proxy error:', error.message);
        return res.status(502).json({ error: 'Weather data unavailable' });
    }
}
