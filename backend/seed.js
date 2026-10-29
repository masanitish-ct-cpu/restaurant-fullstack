import 'dotenv/config';
import { connectDB } from './config/db.js';
import { User, MenuItem, Category } from './models/index.js';

const categories = ['Starters', 'Main Course', 'Pizza', 'Pasta', 'Burgers', 'Desserts', 'Beverages'];
const dishes = [
  ['Paneer Tikka', 'Charcoal-kissed cottage cheese, marinated overnight in hung curd and warming spices.', 'Starters', 'Veg', 14, 'paneer-tikka.jpg', true],
  ['Butter Chicken', 'Tandoor-finished chicken in a slow-simmered tomato, butter and fenugreek sauce.', 'Main Course', 'Non-Veg', 24, 'butter-chicken.jpg', true],
  ['Margherita Pizza', 'San Marzano tomato, fior di latte, basil and a whisper of extra virgin olive oil.', 'Pizza', 'Veg', 19, 'margherita-pizza.jpg', true],
  ['Truffle Pasta', 'Silky tagliatelle, wild mushroom, aged parmesan and shaved black truffle.', 'Pasta', 'Veg', 26, 'truffle-pasta.jpg', true],
  ['Classic Burger', 'Dry-aged beef, sharp cheddar, house pickles and ember sauce on a brioche bun.', 'Burgers', 'Non-Veg', 21, 'classic-burger.jpg', false],
  ['Grilled Salmon', 'Line-caught salmon, crisp skin, lemon beurre blanc and garden herbs.', 'Main Course', 'Non-Veg', 29, 'grilled-salmon.jpg', true],
  ['Chocolate Lava Cake', 'Warm Valrhona chocolate, molten centre and vanilla bean gelato.', 'Desserts', 'Veg', 12, 'chocolate-lava-cake.jpg', false],
  ['Tiramisu', 'Espresso-soaked savoiardi, mascarpone cloud and a delicate cocoa finish.', 'Desserts', 'Veg', 11, 'tiramisu.jpg', false],
  ['Fresh Lime Soda', 'Freshly squeezed lime, sparkling soda and a touch of wildflower honey.', 'Beverages', 'Veg', 7, 'fresh-lime-soda.jpg', false],
];

try {
  await connectDB();
  await Category.bulkWrite(categories.map((name) => ({ updateOne: { filter: { name }, update: { $setOnInsert: { name } }, upsert: true } })));
  await Promise.all(dishes.map(([name, description, category, dietary, price, photo, featured], index) => MenuItem.updateOne(
    { name },
    {
      $set: { image: `/images/dishes/${photo}` },
      $setOnInsert: { name, description, ingredients: ['Seasonal produce', 'House-made seasoning'], category, dietary, price, rating: 4.7 + (index % 3) * 0.1, featured, available: true },
    },
    { upsert: true },
  )));
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
    if (!admin) await User.create({ name: process.env.ADMIN_NAME || 'Ember Admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' });
  }
  console.log(`Seeded ${dishes.length} dishes and ${categories.length} categories.`);
  process.exit(0);
} catch (error) {
  console.error('Seeding failed:', error);
  process.exit(1);
}
