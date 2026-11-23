import { PagedResult } from '../../shared/models/paged-result.model';

// Keep these values aligned with the backend EnrollmentStatus enum.
export enum EnrollmentStatus {
  Active = 0,
  Cancelled = 1,
}

export interface EnrollmentResponse {
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseName: string;
  enrolledAt: string;
  status: number;
}

export interface CreateEnrollmentRequest {
  courseId: number;
}

export interface EnrollmentFilter {
  search?: string;
  courseId?: number | null;
  status?: number | null;
  fromDate?: string;
  toDate?: string;
}

export type EnrollmentPagedResult = PagedResult<EnrollmentResponse>;
