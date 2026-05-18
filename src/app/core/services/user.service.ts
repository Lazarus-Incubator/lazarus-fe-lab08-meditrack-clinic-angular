import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/domain.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  list(): Observable<User[]> {
    return this.api.get<User[]>('users');
  }
}
