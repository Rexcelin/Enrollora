import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EnrollmentResponse, EnrollmentStatus } from '../../enrollments/enrollment.models';
import { EnrollmentService } from '../../enrollments/enrollment.service';

import { CancellationResponse, CancellationStatus } from '../cancellation.models';
import { CancellationService } from '../cancellation.service';

@Component({
  selector: 'app-student-cancellations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-cancellations.html',
  styleUrl: './student-cancellations.css',
})
export class StudentCancellations implements OnInit {
  readonly CancellationStatus = CancellationStatus;
  readonly EnrollmentStatus = EnrollmentStatus;

  private readonly enrollmentService = inject(EnrollmentService);
  private readonly cancellationService = inject(CancellationService);

  enrollments = signal<EnrollmentResponse[]>([]);
  requests = signal<CancellationResponse[]>([]);

  selectedEnrollmentId: number | null = null;
  reason = '';

  isLoading = signal(false);
  isSubmitting = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = 10;
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadRequests();
  }

  loadEnrollments(): void {
    this.enrollmentService.getMyEnrollments(1, 100).subscribe({
      next: (response) => {
        this.enrollments.set(
          response.items.filter((item) => item.status === EnrollmentStatus.Active),
        );
      },
      error: (error: HttpErrorResponse) => {
        console.error('Unable to load enrollments:', error);
        this.errorMessage.set('Unable to load your active enrollments.');
      },
    });
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.cancellationService.getMyRequests(this.pageNumber(), this.pageSize).subscribe({
      next: (response) => {
        this.requests.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.getErrorMessage(error));
        this.isLoading.set(false);
      },
    });
  }

  submitRequest(): void {
    if (!this.selectedEnrollmentId || !this.reason.trim() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.cancellationService
      .createRequest(this.selectedEnrollmentId, {
        reason: this.reason.trim(),
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Your cancellation request has been submitted successfully.');

          this.selectedEnrollmentId = null;
          this.reason = '';

          this.isSubmitting.set(false);
          this.pageNumber.set(1);

          this.loadRequests();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.getErrorMessage(error));
          this.isSubmitting.set(false);
        },
      });
  }

  statusLabel(status: number): string {
    switch (status) {
      case CancellationStatus.Pending:
        return 'Pending';
      case CancellationStatus.Approved:
        return 'Approved';
      case CancellationStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadRequests();
    }
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const body = error.error;

    return (
      body?.detail ||
      body?.message ||
      body?.title ||
      (error.status === 0
        ? 'Cannot connect to the server.'
        : 'Something went wrong. Please try again.')
    );
  }
}
