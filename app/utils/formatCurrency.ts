export default function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
