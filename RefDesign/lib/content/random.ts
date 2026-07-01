export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Picks items without repeating until the pool is exhausted, then reshuffles. */
export class SessionPool<T> {
  private bag: T[] = [];
  private readonly source: readonly T[];

  constructor(source: readonly T[]) {
    this.source = source;
    this.refill();
  }

  next(): T {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop() as T;
  }

  take(count: number): T[] {
    const out: T[] = [];
    for (let i = 0; i < count; i++) out.push(this.next());
    return out;
  }

  private refill() {
    this.bag = shuffle([...this.source]);
  }
}

export function uniqueId(parts: unknown[]): string {
  return parts.map(String).join('|');
}
