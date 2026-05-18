import { Injectable } from '@angular/core';
import { NavItem, Role, User } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/app/dashboard', roles: this.allRoles() },
    { label: 'Pacientes', path: '/app/patients', roles: ['ADMIN', 'RECEPCION', 'AUDITOR'] },
    {
      label: 'Citas',
      path: '/app/appointments',
      roles: ['ADMIN', 'RECEPCION', 'ENFERMERIA', 'MEDICO', 'AUDITOR']
    },
    { label: 'Triaje', path: '/app/triage', roles: ['ADMIN', 'ENFERMERIA'] },
    { label: 'Consultas', path: '/app/consultations', roles: ['ADMIN', 'MEDICO'] },
    { label: 'Laboratorio', path: '/app/lab/orders', roles: ['ADMIN', 'MEDICO', 'LABORATORIO'] },
    { label: 'Farmacia', path: '/app/pharmacy/prescriptions', roles: ['ADMIN', 'FARMACIA'] },
    { label: 'Caja', path: '/app/billing', roles: ['ADMIN', 'CAJA'] },
    { label: 'Auditoria', path: '/app/audit-log', roles: ['ADMIN', 'AUDITOR'] },
    { label: 'Perfil', path: '/app/profile', roles: this.allRoles() }
  ];

  menuForRole(role: Role): NavItem[] {
    return this.navItems.filter((item) => item.roles.includes(role));
  }

  canWrite(user: User | null): boolean {
    return !!user && user.role !== 'AUDITOR';
  }

  hasAnyRole(user: User | null, roles: Role[]): boolean {
    return !!user && roles.includes(user.role);
  }

  allRoles(): Role[] {
    return [
      'ADMIN',
      'RECEPCION',
      'ENFERMERIA',
      'MEDICO',
      'LABORATORIO',
      'FARMACIA',
      'CAJA',
      'AUDITOR'
    ];
  }
}
