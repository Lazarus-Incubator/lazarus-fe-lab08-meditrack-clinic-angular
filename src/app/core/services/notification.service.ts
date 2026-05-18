import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../models/domain.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  byUser(userId: string): Observable<Notification[]> {
    return this.api.get<Notification[]>('notifications', { userId });
  }
}
