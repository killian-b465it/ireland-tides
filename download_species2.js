const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'assets', 'species');

// Direct Wikimedia Commons image URLs for each species
const speciesImages = [
  { id: 'atlantic_salmon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Atlantic_salmon_Atlantic_Salmon_Fly_Fishing_Salmon_Leaping.jpg/400px-Atlantic_salmon_Atlantic_Salmon_Fly_Fishing_Salmon_Leaping.jpg' },
  { id: 'blue_mussel', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Mussel_2013-07-25.jpg/400px-Mussel_2013-07-25.jpg' },
  { id: 'blue_shark', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Prionace_glauca_1.jpg/400px-Prionace_glauca_1.jpg' },
  { id: 'bream', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Abramis_brama_Prague_Vltava_1.jpg/400px-Abramis_brama_Prague_Vltava_1.jpg' },
  { id: 'brown_crab', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Cancer_pagurus_in_rock_pool.jpg/400px-Cancer_pagurus_in_rock_pool.jpg' },
  { id: 'brown_trout', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Salmo_trutta_Ozean.jpg/400px-Salmo_trutta_Ozean.jpg' },
  { id: 'common_shrimp', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Crangon_crangon_Borkum_1.jpg/400px-Crangon_crangon_Borkum_1.jpg' },
  { id: 'dublin_bay_prawn', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Nephrops_norvegicus.jpg/400px-Nephrops_norvegicus.jpg' },
  { id: 'flounder', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Platichthys_flesus.jpg/400px-Platichthys_flesus.jpg' },
  { id: 'garfish', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Belone_belone1.jpg/400px-Belone_belone1.jpg' },
  { id: 'lobster', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Homarus_gammarus_from_the_front.jpg/400px-Homarus_gammarus_from_the_front.jpg' },
  { id: 'native_oyster', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/OstreaMontagu_wb.jpg/400px-OstreaMontagu_wb.jpg' },
  { id: 'perch', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Perca_fluviatilis_Prague_Vltava.jpg/400px-Perca_fluviatilis_Prague_Vltava.jpg' },
  { id: 'pike', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Esox_lucius.jpg/400px-Esox_lucius.jpg' },
  { id: 'roach', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Rutilus_rutilus_Prague_Vltava.jpg/400px-Rutilus_rutilus_Prague_Vltava.jpg' },
  { id: 'rudd', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Scardinius_erythrophthalmus_Prague_Vltava_2.jpg/400px-Scardinius_erythrophthalmus_Prague_Vltava_2.jpg' },
  { id: 'spurdog', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Squalus_acanthias.jpg/400px-Squalus_acanthias.jpg' },
  { id: 'tench', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Tinca_tinca_Prague_Divoká_Šárka.jpg/400px-Tinca_tinca_Prague_Divoká_Šárka.jpg' },
  { id: 'velvet_crab', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Velvet_crab_on_rocks.jpg/400px-Velvet_crab_on_rocks.jpg' },
  { id: 'whiting', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Merlangius_merlangus.jpg/400px-Merlangius_merlangus.jpg' },
  { id: 'wrasse_ballan', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Labrus_bergylta.jpg/400px-Labrus_bergylta.jpg' },
  { id: 'ray_thornback', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Raja_clavata_aquarium.jpg/400px-Raja_clavata_aquarium.jpg' },
];

function downloadImage(id, url) {
  return new Promise((resolve) => {
    const dest = path.join(targetDir, `${id}.jpg`);
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { headers: { 'User-Agent': 'IrelandTidesBot/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(id, res.headers.location).then(resolve);
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const stat = fs.statSync(dest);
        if (stat.size < 5000) {
          console.log(`SMALL (${stat.size}b) ${id} - may be broken`);
        } else {
          console.log(`OK (${stat.size}b) ${id}`);
        }
        resolve();
      });
    });
    req.on('error', (err) => {
      console.log(`ERROR ${id}: ${err.message}`);
      resolve();
    });
  });
}

async function run() {
  for (const item of speciesImages) {
    await downloadImage(item.id, item.url);
  }
  console.log('Done!');
}

run();
