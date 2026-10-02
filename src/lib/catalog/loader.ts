import { z } from 'zod';
import merchantsData from '../../../data/merchants.json';
import catalogData from '../../../data/catalog.json';
import { Category } from '../policy/types';

export const merchantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['catering', 'groceries', 'restaurant', 'office_supplies', 'software']),
  blurb: z.string(),
  previously_used: z.boolean(),
  delivery_fee_cents: z.number().int().nonnegative(),
  tax_rate_bps: z.number().int().nonnegative(),
  rating: z.number(),
  eta_minutes: z.number().int().positive(),
});

export type Merchant = z.infer<typeof merchantSchema>;

export const catalogItemSchema = z.object({
  id: z.string().min(1),
  merchant_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.enum(['catering', 'groceries', 'restaurant', 'office_supplies', 'software']),
  unit_price_cents: z.number().int().positive(),
  is_vegetarian: z.boolean(),
  max_qty: z.number().int().positive(),
  tags: z.array(z.string()),
});

export type CatalogItem = z.infer<typeof catalogItemSchema>;

const validatedMerchants: Merchant[] = z.array(merchantSchema).parse(merchantsData);
const validatedCatalog: CatalogItem[] = z.array(catalogItemSchema).parse(catalogData);

export function getAllMerchants(): Merchant[] {
  return [...validatedMerchants];
}

export function getMerchantById(id: string): Merchant | undefined {
  return validatedMerchants.find((m) => m.id === id);
}

export function getAllCatalogItems(): CatalogItem[] {
  return [...validatedCatalog];
}

export function getItemsByMerchant(merchantId: string): CatalogItem[] {
  return validatedCatalog.filter((item) => item.merchant_id === merchantId);
}

export function getCatalogItemById(id: string): CatalogItem | undefined {
  return validatedCatalog.find((item) => item.id === id);
}

export function getCatalogMaxQtyMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of validatedCatalog) {
    map[item.id] = item.max_qty;
  }
  return map;
}
