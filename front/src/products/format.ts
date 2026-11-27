export function formatPrice(priceInCents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
    priceInCents / 100,
  );
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(isoDate));
}
