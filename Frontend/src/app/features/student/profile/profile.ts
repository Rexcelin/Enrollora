import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { StudentResponse, UpdateStudentRequest } from '../../admin/students/student.models';
import { StudentProfileService } from './profile.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly profileService = inject(StudentProfileService);
  private readonly cdr = inject(ChangeDetectorRef);

  profile: StudentResponse | null = null;

  formData: UpdateStudentRequest = {
    name: '',
    email: '',
    department: '',
    age: 17,
    cgpa: 0,
  };

  isLoading = false;
  isSaving = false;
  isEditing = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.profileService.getMyProfile().subscribe({
      next: (response) => {
        console.log('Profile API response:', response);

        this.profile = response;
        this.copyProfileToForm(response);
        this.isLoading = false;

        this.cdr.markForCheck();

        console.log('Profile loaded successfully:', this.profile);
      },

      error: (error: HttpErrorResponse) => {
        console.error('Profile API error:', error);

        this.errorMessage = this.getErrorMessage(error, 'Unable to load your profile.');

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  startEditing(): void {
    if (!this.profile) return;

    this.copyProfileToForm(this.profile);
    this.successMessage = '';
    this.errorMessage = '';
    this.isEditing = true;
  }

  cancelEditing(): void {
    if (this.profile) {
      this.copyProfileToForm(this.profile);
    }

    this.isEditing = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveProfile(form: NgForm): void {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    const request: UpdateStudentRequest = {
      name: this.formData.name.trim(),
      email: this.formData.email.trim(),
      department: this.formData.department.trim(),
      age: Number(this.formData.age),
      cgpa: Number(this.formData.cgpa),
    };

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.profileService.updateMyProfile(request).subscribe({
      next: (response) => {
        this.profile = response;
        this.copyProfileToForm(response);
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = 'Your profile has been updated successfully.';

        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to update your profile.');

        this.isSaving = false;
        this.cdr.markForCheck();
      },
    });
  }

  private copyProfileToForm(profile: StudentResponse): void {
    this.formData = {
      name: profile.name,
      email: profile.email,
      department: profile.department,
      age: profile.age,
      cgpa: profile.cgpa,
    };
  }

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error;

    return (
      body?.detail ||
      body?.message ||
      body?.title ||
      (error.status === 0
        ? 'Cannot connect to the server. Check whether the backend is running.'
        : fallback)
    );
  }
}
