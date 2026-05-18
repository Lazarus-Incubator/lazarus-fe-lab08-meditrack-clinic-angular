import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuditLog, User } from '../models/domain.models';
import { nowIso } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';
import { IdService } from './id.service';

export interface AuditFilters {
  entityType?: string;
  action?: string;
  userId?: string;
  date?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly api = inject(ApiService);
  private readonly ids = inject(IdService);

  list(filters: AuditFilters = {}): Observable<AuditLog[]> {
    return this.api.get<AuditLog[]>('auditLogs').pipe(
      map((logs) =>
        logs
          .filter((log) => !filters.entityType || log.entityType === filters.entityType)
          .filter((log) => !filters.action || log.action === filters.action)
          .filter((log) => !filters.userId || log.userId === filters.userId)
          .filter((log) => !filters.date || log.createdAt.startsWith(filters.date))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      )
    );
  }

  create(
    entityType: string,
    entityId: string,
    action: string,
    description: string,
    user: User | null
  ): Observable<AuditLog> {
    const log: AuditLog = {
      id: this.ids.next('aud'),
      entityType,
      entityId,
      action,
      description,
      userId: user?.id ?? 'system',
      createdAt: nowIso()
    };
    return this.api.post<AuditLog>('auditLogs', log);
  }
}
