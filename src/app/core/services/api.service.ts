import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type ApiValue = string | number | boolean | null | undefined;
export type ApiQuery = Record<string, ApiValue>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, query: ApiQuery = {}): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}`, { params: this.params(query) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body);
  }

  patch<T>(path: string, id: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${path}/${id}`, body);
  }

  private params(query: ApiQuery): HttpParams {
    return Object.entries(query).reduce((params, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return params;
      }
      return params.set(key, String(value));
    }, new HttpParams());
  }
}
