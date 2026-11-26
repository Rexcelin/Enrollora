import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../../shared/models/paged-result.model';

import {
  CancellationFilter,
  CancellationResponse,
  CreateCancellationRequest,
  ReviewCancellationRequest,
} from './cancellation.models';

@Injectable({
  providedIn: 'root',
})
export class CancellationService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/cancellation-requests`;

  getMyRequests(pageNumber = 1, pageSize = 10): Observable<PagedResult<CancellationResponse>> {
    const params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);

    return this.http.get<PagedResult<CancellationResponse>>(`${this.apiUrl}/my`, { params });
  }

  getAllRequests(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationFilter,
  ): Observable<PagedResult<CancellationResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.courseId != null) {
      params = params.set('courseId', filters.courseId);
    }

    if (filters?.status != null) {
      params = params.set('status', filters.status);
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return this.http.get<PagedResult<CancellationResponse>>(this.apiUrl, { params });
  }

  createRequest(
    enrollmentId: number,
    request: CreateCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(
      `${environment.apiUrl}/enrollments/${enrollmentId}/cancellation-request`,
      request,
    );
  }

  approveRequest(id: number, request: ReviewCancellationRequest): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(`${this.apiUrl}/${id}/approve`, request);
  }

  rejectRequest(id: number, request: ReviewCancellationRequest): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(`${this.apiUrl}/${id}/reject`, request);
  }
}
