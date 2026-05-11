const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'assets', 'species');

// Final batch - remaining missing species with researched filenames
const speciesList = [
  { id: 'atlantic_salmon', file: 'Salmo_salar.jpg' },
  { id: 'blue_mussel', file: 'Blue_mussel_Mytilus_edulis.jpg' },
  { id: 'brown_crab', file: 'Cancerpagurus1.jpg' },
  { id: 'common_shrimp', file: 'Crangon_crangon_(Pijnacker,_Netherlands).jpg' },
  { id: 'flounder', file: 'Platichthys_flesus.jpg' },
  { id: 'lobster', file: 'Homarus_gammarus_Brussel.jpg' },
  { id: 'native_oyster', file: 'Ostrea_edulis.jpg' },
  { id: 'rudd', file: 'Scardinius_erythrophthalmus.jpg' },
  { id: 'ray_thornback', file: 'Thornback_ray.jpg' },
];

function getThumbUrl(fileName, width = 400) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(fileName);
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encoded}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json`;
    const req = https.get(url, { headers: { 'User-Agent': 'IrelandTidesApp/1.0 (irishfishinghub@gmail.com)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const page = Object.values(pages)[0];
          if (page && page.imageinfo && page.imageinfo[0]) {
            resolve({ thumb: page.imageinfo[0].thumburl, full: page.imageinfo[0].url });
          } else { resolve(null); }
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
  });
}

function downloadUrl(url, dest) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'IrelandTidesApp/1.0', 'Referer': 'https://en.wikipedia.org/' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return downloadUrl(res.headers.location, dest).then(resolve);
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(fs.statSync(dest).size); });
    });
    req.on('error', () => resolve(0));
  });
}

async function run() {
  for (const species of speciesList) {
    const dest = path.join(targetDir, `${species.id}.jpg`);
    const urls = await getThumbUrl(species.file);
    if (!urls) { console.log(`No URL for ${species.id}`); continue; }
    const urlToUse = urls.thumb || urls.full;
    const size = await downloadUrl(urlToUse, dest);
    if (size > 5000) { console.log(`OK (${size}b) ${species.id}`); }
    else { console.log(`SMALL (${size}b) ${species.id} - thumb:${urls.thumb}`); }
  }
  console.log('Done!');
}
run();
