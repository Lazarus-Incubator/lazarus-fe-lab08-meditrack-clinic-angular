import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `<div class="empty-state"><strong>{{ title }}</strong><span>{{ message }}</span></div>`
})
export class EmptyStateComponent {
  @Input() title = 'Sin datos';
  @Input() message = 'No hay registros para mostrar.';
}
