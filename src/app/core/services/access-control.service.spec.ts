import { TestBed } from '@angular/core/testing';
import { AccessControlService } from './access-control.service';

describe('AccessControlService', () => {
  it('filtra el menu segun rol', () => {
    const service = TestBed.inject(AccessControlService);

    const recepcionMenu = service.menuForRole('RECEPCION').map((item) => item.label);
    const auditorMenu = service.menuForRole('AUDITOR').map((item) => item.label);

    expect(recepcionMenu).toContain('Pacientes');
    expect(recepcionMenu).not.toContain('Caja');
    expect(auditorMenu).toContain('Auditoria');
    expect(auditorMenu).not.toContain('Farmacia');
  });
});
