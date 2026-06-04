const mongoose = require('mongoose');
const Business = require('./models/Business');

mongoose.connect('mongodb://localhost:27017/hubify').then(async () => {
  const result = await Business.insertMany([
    { name: 'Picasso Anoumabo', category: 'Restaurant', description: 'Cuisine italienne', location: { type: 'Point', coordinates: [-4.001, 5.348] } },
    { name: 'Restaurant KMP GFCI', category: 'Restaurant', description: 'Av. de Marcory - 24h/24', location: { type: 'Point', coordinates: [-4.005, 5.352] } },
    { name: 'Le Charbon Chez Jeanine', category: 'Restaurant', description: 'Plats africains', location: { type: 'Point', coordinates: [-4.010, 5.360] } },
    { name: 'Restaurant La Reference', category: 'Restaurant', description: 'Marcory - 24h/24', location: { type: 'Point', coordinates: [-4.012, 5.365] } },
    { name: 'Azuretti Food', category: 'Restaurant', description: 'Tres bon menu', location: { type: 'Point', coordinates: [-4.007, 5.355] } },
    { name: 'GASPARD', category: 'Restaurant', description: 'Bd Loraine', location: { type: 'Point', coordinates: [-4.015, 5.350] } },
    { name: 'Chez Tantie Alice', category: 'Restaurant', description: 'Plats ivoiriens', location: { type: 'Point', coordinates: [-4.008, 5.358] } },
    { name: 'Sensazioni', category: 'Restaurant', description: 'Italienne', location: { type: 'Point', coordinates: [-4.018, 5.362] } },
    { name: 'Espace LA DALLE', category: 'Restaurant', description: 'Marcory Potopoto', location: { type: 'Point', coordinates: [-4.011, 5.361] } },
    { name: 'Restaurant La Balancoire', category: 'Restaurant', description: 'Restaurant', location: { type: 'Point', coordinates: [-4.009, 5.359] } },
    { name: 'Le Kalliste', category: 'Restaurant', description: 'Restaurant', location: { type: 'Point', coordinates: [-4.016, 5.355] } },
    { name: 'BALADY ZONE 4', category: 'Restaurant', description: 'Plats familiaux', location: { type: 'Point', coordinates: [-4.013, 5.365] } },
    { name: 'Marrouche', category: 'Restaurant', description: 'Libanaise', location: { type: 'Point', coordinates: [-4.014, 5.356] } },
    { name: 'Agha Restaurant', category: 'Restaurant', description: 'Rue du 7 Decembre', location: { type: 'Point', coordinates: [-4.006, 5.351] } },
    { name: 'Street Food Zone 4', category: 'Restaurant', description: 'Excellent burger', location: { type: 'Point', coordinates: [-4.010, 5.354] } },
    { name: 'Pinocchio Restaurant', category: 'Restaurant', description: 'Pizza', location: { type: 'Point', coordinates: [-4.020, 5.345] } },
    { name: 'EDEN Abidjan Food Sky Bar', category: 'Restaurant', description: 'Rooftop - +20k FCFA', location: { type: 'Point', coordinates: [-4.017, 5.365] } },
    { name: 'Sept Tables', category: 'Restaurant', description: 'Bd du 7 Decembre', location: { type: 'Point', coordinates: [-4.009, 5.353] } },
    { name: 'Le Comptoir Bar Restaurant', category: 'Restaurant', description: 'ITC Ivoire Trade Center', location: { type: 'Point', coordinates: [-4.002, 5.349] } },
    { name: 'Restaurant YOTA Paris Village', category: 'Restaurant', description: 'Marcory Potopoto', location: { type: 'Point', coordinates: [-4.011, 5.362] } }
  ]);
  console.log('Inseres:', result.length, 'restaurants');
  process.exit();
}).catch(e => { console.error(e.message); process.exit(1); });