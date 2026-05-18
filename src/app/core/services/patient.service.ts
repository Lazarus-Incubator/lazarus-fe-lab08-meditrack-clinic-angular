import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Patient } from '../models/domain.models';
import { nowIso } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';
import { IdService } from './id.service';

export interface PatientFilters {
  q?: string;
  active?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly api = inject(ApiService);
  private readonly ids = inject(IdService);

  list(filters: PatientFilters = {}): Observable<Patient[]> {
    const term = filters.q?.trim().toLowerCase() ?? '';
    return this.api.get<Patient[]>('patients').pipe(
      map((patients) =>
        patients
          .filter((patient) =>
            term
              ? patient.fullName.toLowerCase().includes(term) ||
                patient.documentNumber.includes(term)
              : true
          )
          .filter((patient) =>
            filters.active === 'active'
              ? patient.active
              : filters.active === 'inactive'
                ? !patient.active
                : true
          )
          .sort((a, b) => a.fullName.localeCompare(b.fullName))
      )
    );
  }

  get(id: string): Observable<Patient> {
    return this.api.get<Patient>(`patients/${id}`);
  }

  create(input: Omit<Patient, 'id' | 'createdAt' | 'active'>): Observable<Patient> {
    const patient: Patient = {
      ...input,
      id: this.ids.next('pat'),
      active: true,
      createdAt: nowIso()
    };
    return this.api.post<Patient>('patients', patient);
  }
}
