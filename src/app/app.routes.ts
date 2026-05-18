import { Routes } from '@angular/router';
import { authGuard, loginGuard, roleGuard } from './core/guards/auth.guard';
import { PrivateLayoutComponent } from './core/layout/private-layout.component';
import { LoginComponent } from './features/auth/login.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  {
    path: 'app',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'appointments',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'RECEPCION', 'ENFERMERIA', 'MEDICO', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/appointments/appointments-list.component').then(
            (m) => m.AppointmentsListComponent
          )
      },
      {
        path: 'appointments/new',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'RECEPCION'] },
        loadComponent: () =>
          import('./features/appointments/appointment-form.component').then(
            (m) => m.AppointmentFormComponent
          )
      },
      {
        path: 'appointments/:id',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'RECEPCION', 'ENFERMERIA', 'MEDICO', 'CAJA', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/appointments/appointment-detail.component').then(
            (m) => m.AppointmentDetailComponent
          )
      },
      {
        path: 'patients',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'RECEPCION', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/patients/patients-list.component').then((m) => m.PatientsListComponent)
      },
      {
        path: 'patients/new',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'RECEPCION'] },
        loadComponent: () =>
          import('./features/patients/patient-form.component').then((m) => m.PatientFormComponent)
      },
      {
        path: 'patients/:id',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'RECEPCION', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/patients/patient-detail.component').then(
            (m) => m.PatientDetailComponent
          )
      },
      {
        path: 'triage',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'ENFERMERIA'] },
        loadComponent: () =>
          import('./features/triage/triage-list.component').then((m) => m.TriageListComponent)
      },
      {
        path: 'triage/:appointmentId',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'ENFERMERIA'] },
        loadComponent: () =>
          import('./features/triage/triage-form.component').then((m) => m.TriageFormComponent)
      },
      {
        path: 'consultations',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MEDICO'] },
        loadComponent: () =>
          import('./features/consultations/consultations-list.component').then(
            (m) => m.ConsultationsListComponent
          )
      },
      {
        path: 'consultations/:appointmentId',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MEDICO', 'ENFERMERIA'] },
        loadComponent: () =>
          import('./features/consultations/consultation-form.component').then(
            (m) => m.ConsultationFormComponent
          )
      },
      {
        path: 'lab/orders',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MEDICO', 'LABORATORIO'] },
        loadComponent: () =>
          import('./features/lab/lab-orders-list.component').then((m) => m.LabOrdersListComponent)
      },
      {
        path: 'lab/orders/:id',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MEDICO', 'LABORATORIO'] },
        loadComponent: () =>
          import('./features/lab/lab-order-detail.component').then((m) => m.LabOrderDetailComponent)
      },
      {
        path: 'pharmacy/prescriptions',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'FARMACIA'] },
        loadComponent: () =>
          import('./features/pharmacy/prescriptions-list.component').then(
            (m) => m.PrescriptionsListComponent
          )
      },
      {
        path: 'pharmacy/prescriptions/:id',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'FARMACIA'] },
        loadComponent: () =>
          import('./features/pharmacy/prescription-detail.component').then(
            (m) => m.PrescriptionDetailComponent
          )
      },
      {
        path: 'billing',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'CAJA'] },
        loadComponent: () =>
          import('./features/billing/billing-list.component').then((m) => m.BillingListComponent)
      },
      {
        path: 'billing/:appointmentId',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'CAJA'] },
        loadComponent: () =>
          import('./features/billing/billing-detail.component').then((m) => m.BillingDetailComponent)
      },
      {
        path: 'audit-log',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/audit/audit-log.component').then((m) => m.AuditLogComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent)
      },
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./features/auth/access-denied.component').then((m) => m.AccessDeniedComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
