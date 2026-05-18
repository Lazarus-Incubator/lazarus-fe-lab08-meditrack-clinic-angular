import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="badgeClass">{{ label || value }}</span>`
})
export class StatusBadgeComponent {
  @Input({ required: true }) value = '';
  @Input() label = '';

  get badgeClass(): string {
    const normalized = this.value.toLowerCase().replaceAll('_', '-');
    return `badge ${normalized}`;
  }
}
