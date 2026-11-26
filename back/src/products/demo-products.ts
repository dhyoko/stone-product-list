import { createHash } from 'node:crypto';
import { type Product, productIdSchema, type ProductId } from './product';

const FIRST_CREATED_AT = Date.UTC(2026, 0, 1);
const HOUR_IN_MS = 3_600_000;

const MATERIALS = ['Ceramic', 'Steel', 'Bamboo', 'Glass', 'Cotton'] as const;
const ITEMS = [
  'mug',
  'water bottle',
  'notebook',
  'desk lamp',
  'backpack',
  'phone stand',
  'cutting board',
  'tote bag',
  'plant pot',
  'coaster set',
] as const;

function demoProductId(index: number): ProductId {
  const hex = createHash('sha256').update(`demo-product-${index}`).digest('hex');
  const variant = ((Number.parseInt(hex.charAt(16), 16) & 0x3) | 0x8).toString(16);
  return productIdSchema.parse(
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`,
  );
}

export function buildDemoProducts(): readonly Product[] {
  return MATERIALS.flatMap((material, materialIndex) =>
    ITEMS.map((item, itemIndex) => {
      const index = materialIndex * ITEMS.length + itemIndex;
      return {
        id: demoProductId(index),
        name: `${material} ${item}`,
        description: `A ${material.toLowerCase()} ${item} for everyday use.`,
        priceInCents: 1_990 + ((index * 737) % 18_000),
        currency: 'BRL',
        createdAt: new Date(FIRST_CREATED_AT + index * HOUR_IN_MS),
      };
    }),
  );
}
