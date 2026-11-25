import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseFilter, CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);

  courses = signal<CourseResponse[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  showForm = signal(false);
  editingCourseId = signal<number | null>(null);

  searchTerm = '';
  activeFilter = 'all';
  availabilityFilter = 'all';

  courseForm = this.fb.nonNullable.group({
    courseName: ['', [Validators.required, Validators.maxLength(150)]],
    duration: ['', [Validators.required, Validators.maxLength(80)]],
    fees: [0, [Validators.required, Validators.min(0)]],
    capacity: [1, [Validators.required, Validators.min(1), Validators.max(100000)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const filters: CourseFilter = {
      search: this.searchTerm.trim() || undefined,
      isActive: this.activeFilter === 'all' ? null : this.activeFilter === 'active',
      availability: this.availabilityFilter === 'all' ? undefined : this.availabilityFilter,
    };

    this.courseService.getCourses(this.pageNumber(), this.pageSize(), filters).subscribe({
      next: (response) => {
        this.courses.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage.set(error.error?.message || 'Unable to load courses. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadCourses();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeFilter = 'all';
    this.availabilityFilter = 'all';
    this.pageNumber.set(1);
    this.loadCourses();
  }

  openCreateForm(): void {
    this.editingCourseId.set(null);
    this.courseForm.reset({
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    });
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showForm.set(true);
  }

  openEditForm(course: CourseResponse): void {
    this.editingCourseId.set(course.courseId);

    this.courseForm.reset({
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: course.isActive,
    });

    this.errorMessage.set('');
    this.successMessage.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    if (this.isSaving()) {
      return;
    }

    this.showForm.set(false);
    this.courseForm.reset();
  }

  saveCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    const values = this.courseForm.getRawValue();

    const request: SaveCourseRequest = {
      courseName: values.courseName.trim(),
      duration: values.duration.trim(),
      fees: Number(values.fees),
      capacity: Number(values.capacity),
      isActive: values.isActive,
    };

    if (!request.courseName || !request.duration) {
      this.errorMessage.set('Course name and duration cannot be blank.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const courseId = this.editingCourseId();

    const operation =
      courseId === null
        ? this.courseService.createCourse(request)
        : this.courseService.updateCourse(courseId, request);

    operation.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showForm.set(false);
        this.successMessage.set(
          courseId === null ? 'Course created successfully.' : 'Course updated successfully.',
        );
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error saving course:', error);
        this.isSaving.set(false);
        this.errorMessage.set(
          error.error?.message ||
            error.error?.title ||
            'Unable to save the course. Please check the details and try again.',
        );
      },
    });
  }

  deactivateCourse(course: CourseResponse): void {
    if (!course.isActive) {
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to deactivate "${course.courseName}"?`);

    if (!confirmed) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.successMessage.set(`"${course.courseName}" was deactivated successfully.`);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error deactivating course:', error);
        this.errorMessage.set(error.error?.message || 'Unable to deactivate this course.');
      },
    });
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCourses();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCourses();
    }
  }

  getFieldError(field: 'courseName' | 'duration' | 'fees' | 'capacity'): string {
    const control = this.courseForm.controls[field];

    if (!control.touched || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    if (control.hasError('min')) {
      return field === 'fees' ? 'Fees cannot be negative.' : 'Capacity must be at least 1.';
    }

    if (control.hasError('max')) {
      return 'Capacity cannot exceed 100000.';
    }

    return 'Please enter a valid value.';
  }
}
