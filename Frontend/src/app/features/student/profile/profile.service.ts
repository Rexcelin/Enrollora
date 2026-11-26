import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { StudentResponse, UpdateStudentRequest } from '../../admin/students/student.models';

@Injectable({
  providedIn: 'root',
})
export class StudentProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/students/me`;

  getMyProfile(): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(this.apiUrl);
  }

  updateMyProfile(request: UpdateStudentRequest): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(this.apiUrl, request);
  }
}
