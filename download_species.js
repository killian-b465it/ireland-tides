const https = require('https');
const fs = require('fs');
const path = require('path');

const speciesList = [
  { id: 'atlantic_mackerel', title: 'Scomber_scombrus' },
  { id: 'european_bass', title: 'European_bass' },
  { id: 'cod', title: 'Atlantic_cod' },
  { id: 'pollock', title: 'Pollack' },
  { id: 'coalfish', title: 'Coalfish' },
  { id: 'wrasse_ballan', title: 'Ballan_wrasse' },
  { id: 'conger_eel', title: 'European_conger' },
  { id: 'ray_thornback', title: 'Thornback_ray' },
  { id: 'plaice', title: 'European_plaice' },
  { id: 'dogfish_lesser', title: 'Small-spotted_catshark' },
  { id: 'flounder', title: 'European_flounder' },
  { id: 'whiting', title: 'Merlangius' },
  { id: 'spurdog', title: 'Spiny_dogfish' },
  { id: 'blue_shark', title: 'Blue_shark' },
  { id: 'garfish', title: 'Garfish' },
  { id: 'brown_trout', title: 'Brown_trout' },
  { id: 'atlantic_salmon', title: 'Atlantic_salmon' },
  { id: 'pike', title: 'Northern_pike' },
  { id: 'perch', title: 'European_perch' },
  { id: 'bream', title: 'Common_bream' },
  { id: 'roach', title: 'Common_roach' },
  { id: 'rudd', title: 'Common_rudd' },
  { id: 'tench', title: 'Tench' },
  { id: 'sea_trout', title: 'Sea_trout' },
  { id: 'brown_crab', title: 'Cancer_pagurus' },
  { id: 'lobster', title: 'European_lobster' },
  { id: 'dublin_bay_prawn', title: 'Nephrops_norvegicus' },
  { id: 'velvet_crab', title: 'Velvet_crab' },
  { id: 'common_shrimp', title: 'Crangon_crangon' },
  { id: 'native_oyster', title: 'Ostrea_edulis' },
  { id: 'blue_mussel', title: 'Blue_mussel' }
];

const targetDir = path.join(__dirname, 'assets', 'species');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function fetchImage(id, title) {
  return new Promise((resolve, reject) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${title}&prop=pageimages&format=json&pithumbsize=400`;
    https.get(url, { headers: { 'User-Agent': 'IrelandTidesBot/1.0 (irishfishinghub@gmail.com)' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pageId === '-1' || !pages[pageId].thumbnail) {
            console.log(`No image for ${title}`);
            resolve(false);
            return;
          }
          const imageUrl = pages[pageId].thumbnail.source;
          const dest = path.join(targetDir, `${id}.jpg`);
          
          https.get(imageUrl, { headers: { 'User-Agent': 'IrelandTidesBot/1.0' } }, imgRes => {
            const file = fs.createWriteStream(dest);
            imgRes.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`Downloaded ${id}`);
              resolve(true);
            });
          }).on('error', err => resolve(false));
          
        } catch(e) {
          console.error(`Error parsing ${title}`, e.message);
          resolve(false);
        }
      });
    }).on('error', err => resolve(false));
  });
}

async function run() {
  for (const species of speciesList) {
    await fetchImage(species.id, species.title);
  }
}

run();
