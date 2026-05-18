import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Doctor, Specialty } from '../models/domain.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly api = inject(ApiService);

  doctors(): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('doctors').pipe(
      map((doctors) => doctors.filter((doctor) => doctor.active))
    );
  }

  specialties(): Observable<Specialty[]> {
    return this.api.get<Specialty[]>('specialties').pipe(
      map((specialties) => specialties.filter((specialty) => specialty.active))
    );
  }

  doctorByUser(userId: string): Observable<Doctor | undefined> {
    return this.doctors().pipe(map((doctors) => doctors.find((doctor) => doctor.userId === userId)));
  }
}
