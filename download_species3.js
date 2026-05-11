const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'assets', 'species');

// Using Wikimedia image info API to get actual direct thumb URLs
const speciesList = [
  { id: 'atlantic_salmon', file: 'Salmo_salar_flyfishing.jpg' },
  { id: 'blue_mussel', file: 'Mussel_2013-07-25.jpg' },
  { id: 'blue_shark', file: 'Prionace_glauca_1.jpg' },
  { id: 'bream', file: 'Abramis_brama_Prague_Vltava_1.jpg' },
  { id: 'brown_crab', file: 'Cancer_pagurus_in_rock_pool.jpg' },
  { id: 'brown_trout', file: 'Salmo_trutta_Ozean.jpg' },
  { id: 'common_shrimp', file: 'Crangon_crangon_Borkum_1.jpg' },
  { id: 'dublin_bay_prawn', file: 'Nephrops_norvegicus.jpg' },
  { id: 'flounder', file: 'Platichthys_flesus.jpg' },
  { id: 'garfish', file: 'Belone_belone1.jpg' },
  { id: 'lobster', file: 'Homarus_gammarus_from_the_front.jpg' },
  { id: 'native_oyster', file: 'OstreaMontagu_wb.jpg' },
  { id: 'perch', file: 'Perca_fluviatilis_Prague_Vltava.jpg' },
  { id: 'pike', file: 'Esox_lucius.jpg' },
  { id: 'roach', file: 'Rutilus_rutilus_Prague_Vltava.jpg' },
  { id: 'rudd', file: 'Scardinius_erythrophthalmus_Prague_Vltava_2.jpg' },
  { id: 'spurdog', file: 'Squalus_acanthias.jpg' },
  { id: 'tench', file: 'Tinca_tinca.jpg' },
  { id: 'velvet_crab', file: 'Velvet_crab.jpg' },
  { id: 'whiting', file: 'Merlangius_merlangus.jpg' },
  { id: 'wrasse_ballan', file: 'Labrus_bergylta.jpg' },
  { id: 'ray_thornback', file: 'Raja_clavata_aquarium.jpg' },
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
      file.on('finish', () => {
        file.close();
        const stat = fs.statSync(dest);
        resolve(stat.size);
      });
    });
    req.on('error', () => resolve(0));
  });
}

async function run() {
  for (const species of speciesList) {
    const dest = path.join(targetDir, `${species.id}.jpg`);
    const thumbUrl = await getThumbUrl(species.file);
    if (!thumbUrl) {
      console.log(`No URL found for ${species.id}`);
      continue;
    }
    const size = await downloadUrl(thumbUrl, dest);
    if (size > 5000) {
      console.log(`OK (${size}b) ${species.id}`);
    } else {
      console.log(`SMALL (${size}b) ${species.id} - url: ${thumbUrl}`);
    }
  }
  console.log('Done!');
}

run();
