import { CATEGORIES, type Category, type Order, type Product, type User } from '../api/contract';

/** Small seeded PRNG so the catalog is identical on every load and in every test. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEMPLATES: Record<Category, { names: string[]; basePrice: number; spread: number }> = {
  keyboards: {
    names: [
      'Clicky 65% Dev Keyboard',
      'Tactile 75% Keyboard',
      'Split Ortho Ergo Board',
      'Low-Profile Wireless Keeb',
      'Macro Pad Debugger',
    ],
    basePrice: 6900,
    spread: 15000,
  },
  ducks: {
    names: [
      'Classic Rubber Debug Duck',
      'Neon Cyberpunk Duck',
      'Barista Espresso Duck',
      'Bow-Tie Code Review Duck',
      'Night-Owl On-Call Duck',
    ],
    basePrice: 900,
    spread: 2400,
  },
  coffee: {
    names: [
      'Segfault Dark Roast Beans',
      'Zero-Downtime Espresso',
      'Kernel Panic Cold Brew',
      'Async Pour-Over Blend',
      'Midnight Commit Mug',
    ],
    basePrice: 1200,
    spread: 2800,
  },
  stickers: {
    names: [
      'Works On My Machine Sticker',
      'Strict Mode Sticker',
      'No Any Hex Sticker',
      'Git Push Force Sticker',
      'Rubber Duck Badge Sticker',
    ],
    basePrice: 300,
    spread: 900,
  },
};

const EDITIONS = [
  'Classic',
  'Mint',
  'Coral',
  'Midnight',
  'Sunrise',
  'Graphite',
  'Lavender',
  'Ocean',
];

export const PRODUCT_COUNT = 5000;

function imageFor(category: Category, variant: number): string {
  // Absolute path under the deploy base, e.g. /BugBounty/images/products/ducks-2.svg
  return `${import.meta.env.BASE_URL}images/products/${category}-${variant}.svg`;
}

export function seedProducts(count = PRODUCT_COUNT): Product[] {
  const random = mulberry32(42);
  const products: Product[] = [];
  for (let i = 1; i <= count; i += 1) {
    const category = CATEGORIES[(i - 1) % CATEGORIES.length] as Category;
    const template = TEMPLATES[category];
    const variant = Math.floor(random() * template.names.length);
    const edition = EDITIONS[Math.floor(random() * EDITIONS.length)];
    const id = `prod-${String(i).padStart(4, '0')}`;
    // Prices end in 99 so they look like real prices; still integer cents.
    const price = Math.round((template.basePrice + random() * template.spread) / 100) * 100 - 1;
    // Roughly 1 in 12 products is sold out so the "in stock" filter matters.
    const stock = random() < 0.08 ? 0 : 1 + Math.floor(random() * 24);
    const rating = Math.round((3 + random() * 2) * 10) / 10;
    products.push({
      id,
      name: `${template.names[variant]} – ${edition}`,
      price,
      category,
      stock,
      rating,
      imageUrl: imageFor(category, variant + 1),
    });
  }
  return products;
}

export const DEMO_USER: User = {
  id: 'usr-101',
  name: 'Demo Developer',
  email: 'demo@bugbazaar.dev',
};
export const DEMO_PASSWORD = 'duck1234';

type Db = {
  products: Product[];
  productsById: Map<string, Product>;
  /** Pre-lowercased "name id" strings, built once instead of on every search. */
  searchIndex: Map<string, string>;
  tokens: Map<string, string>;
  orders: Map<string, Order & { userId: string; createdAtMs: number }>;
  idempotency: Map<string, string>;
  orderCounter: number;
};

function createDb(): Db {
  const products = seedProducts();
  return {
    products,
    productsById: new Map(products.map((p) => [p.id, p])),
    searchIndex: new Map(products.map((p) => [p.id, `${p.name} ${p.id}`.toLowerCase()])),
    tokens: new Map(),
    orders: new Map(),
    idempotency: new Map(),
    orderCounter: 1000,
  };
}

export let db: Db = createDb();

/** Used by tests to start each case from a clean, known state. */
export function resetDb(): void {
  db = createDb();
}

export function setStock(productId: string, stock: number): Product | undefined {
  const product = db.productsById.get(productId);
  if (!product) return undefined;
  const updated = { ...product, stock: Math.max(0, stock) };
  db.productsById.set(productId, updated);
  const index = db.products.findIndex((p) => p.id === productId);
  db.products[index] = updated;
  return updated;
}
