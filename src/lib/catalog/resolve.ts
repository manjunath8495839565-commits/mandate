import { ProposedCheckout, ResolvedBasket, ResolvedLine } from '../policy/types';
import { getMerchantById, getCatalogItemById } from './loader';
import { addCents, mulCents, toCents } from '../money';

/**
 * Recomputes and resolves an agent's proposed checkout basket against the verified catalog.
 * Discards any model-supplied prices and recomputes everything from the ground truth catalog.
 */
export function resolveBasket(proposed: ProposedCheckout): ResolvedBasket {
  const merchant = getMerchantById(proposed.merchant_id);
  if (!merchant) {
    throw new Error(`Merchant not found in catalog: ${proposed.merchant_id}`);
  }

  const resolvedLines: ResolvedLine[] = [];
  let subtotalCents = toCents(0);

  for (const line of proposed.lines) {
    const item = getCatalogItemById(line.item_id);
    if (!item) {
      throw new Error(`Item not found in catalog: ${line.item_id}`);
    }
    if (item.merchant_id !== merchant.id) {
      throw new Error(`Item ${line.item_id} does not belong to merchant ${merchant.id}`);
    }

    const unitPrice = toCents(item.unit_price_cents);
    const lineTotal = mulCents(unitPrice, line.qty);
    subtotalCents = addCents(subtotalCents, lineTotal);

    resolvedLines.push({
      item_id: item.id,
      name: item.name,
      qty: line.qty,
      unit_price_cents: item.unit_price_cents,
      line_total_cents: lineTotal,
      is_vegetarian: item.is_vegetarian,
      category: item.category,
    });
  }

  const deliveryCents = toCents(merchant.delivery_fee_cents);
  // Tax basis points calculation with integer floor
  const taxCentsRaw = Math.floor((subtotalCents * merchant.tax_rate_bps) / 10000);
  const taxCents = toCents(taxCentsRaw);

  const totalCents = addCents(subtotalCents, deliveryCents, taxCents);

  return {
    merchant_id: merchant.id,
    merchant_name: merchant.name,
    merchant_category: merchant.category,
    merchant_previously_used: merchant.previously_used,
    lines: resolvedLines,
    subtotal_cents: subtotalCents,
    tax_cents: taxCents,
    delivery_cents: deliveryCents,
    total_cents: totalCents,
  };
}
