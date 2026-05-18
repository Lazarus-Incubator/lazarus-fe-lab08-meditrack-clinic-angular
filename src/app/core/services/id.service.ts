import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IdService {
  next(prefix: string): string {
    const random =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    return `${prefix}-${random}`;
  }
}
