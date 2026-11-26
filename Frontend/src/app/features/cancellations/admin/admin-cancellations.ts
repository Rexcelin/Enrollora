import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CancellationResponse, CancellationStatus } from '../cancellation.models';
import { CancellationService } from '../cancellation.service';

@Component({
  selector: 'app-admin-cancellations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cancellations.html',
  styleUrl: './admin-cancellations.css',
})
export class AdminCancellations implements OnInit {
  readonly CancellationStatus = CancellationStatus;

  private readonly cancellationService = inject(CancellationService);

  requests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  isReviewing = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  searchText = '';
  selectedStatus: number | null = null;
  adminRemarks = '';

  selectedRequest: CancellationResponse | null = null;

  pageNumber = signal(1);
  pageSize = 10;
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.cancellationService
      .getAllRequests(this.pageNumber(), this.pageSize, {
        search: this.searchText.trim() || undefined,
        status: this.selectedStatus,
      })
      .subscribe({
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

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadRequests();
  }

  openReview(request: CancellationResponse): void {
    this.selectedRequest = request;
    this.adminRemarks = '';
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeReview(): void {
    if (this.isReviewing()) return;

    this.selectedRequest = null;
    this.adminRemarks = '';
  }

  approveRequest(): void {
    this.reviewRequest(true);
  }

  rejectRequest(): void {
    this.reviewRequest(false);
  }

  private reviewRequest(approve: boolean): void {
    if (!this.selectedRequest || this.isReviewing()) {
      return;
    }

    const requestId = this.selectedRequest.cancellationRequestId;

    this.isReviewing.set(true);
    this.errorMessage.set('');

    const body = {
      adminRemarks: this.adminRemarks.trim() || null,
    };

    const action = approve
      ? this.cancellationService.approveRequest(requestId, body)
      : this.cancellationService.rejectRequest(requestId, body);

    action.subscribe({
      next: () => {
        this.successMessage.set(
          approve
            ? 'Cancellation request approved successfully.'
            : 'Cancellation request rejected successfully.',
        );

        this.selectedRequest = null;
        this.adminRemarks = '';
        this.isReviewing.set(false);

        this.loadRequests();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.getErrorMessage(error));
        this.isReviewing.set(false);
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
