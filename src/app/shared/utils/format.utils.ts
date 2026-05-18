export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function currency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}
