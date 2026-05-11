const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'assets', 'species');

// Corrected filenames for still-missing species
const speciesList = [
  { id: 'atlantic_salmon', file: 'Atlantic_salmon_Salmo_salar_female.jpg' },
  { id: 'blue_mussel', file: 'Blue_mussel_(Mytilus_edulis).jpg' },
  { id: 'brown_crab', file: 'Cancerpagurus.jpg' },
  { id: 'brown_trout', file: 'Salmo_trutta.jpg' },
  { id: 'common_shrimp', file: 'Crangon_crangon2.jpg' },
  { id: 'flounder', file: 'Platichthys_flesus_(Plie_flet).jpg' },
  { id: 'lobster', file: 'Homarus_gammarus_1.jpg' },
  { id: 'native_oyster', file: 'Ostrea_edulis_MHNT.jpg' },
  { id: 'perch', file: 'Perca_fluviatilis1.jpg' },
  { id: 'roach', file: 'Rutilus_rutilus.jpg' },
  { id: 'rudd', file: 'Scardinius_erythrophthalmus_Prague_Divoká_Šárka.jpg' },
  { id: 'velvet_crab', file: 'Necora_puber.jpg' },
  { id: 'ray_thornback', file: 'Thornback_ray_Raja_clavata.jpg' },
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
          if (page.imageinfo && page.imageinfo[0]) {
            resolve(page.imageinfo[0].thumburl || page.imageinfo[0].url);
          } else {
            resolve(null);
          }
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
  });
}

function downloadUrl(url, dest) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'IrelandTidesApp/1.0 (irishfishinghub@gmail.com)', 'Referer': 'https://en.wikipedia.org/' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadUrl(res.headers.location, dest).then(resolve);
      }
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
    const thumbUrl = await getThumbUrl(species.file);
    if (!thumbUrl) { console.log(`No URL for ${species.id} (${species.file})`); continue; }
    const size = await downloadUrl(thumbUrl, dest);
    if (size > 5000) { console.log(`OK (${size}b) ${species.id}`); }
    else { console.log(`SMALL (${size}b) ${species.id}`); }
  }
  console.log('Done!');
}
run();
