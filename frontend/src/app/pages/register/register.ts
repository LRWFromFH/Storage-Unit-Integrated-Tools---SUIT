import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../core/services/auth';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  private auth = inject(Auth);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api';

  // Register new employee
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  // Update employee role
  roleLoading = false;
  roleError = '';
  roleSuccess = '';

  roleForm = this.fb.group({
    employeeId: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    role:       ['employee', Validators.required]
  });

  async onSubmit() {
    if (this.form.invalid) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    const { username, email, password } = this.form.value;
    try {
      const newId = await this.auth.registerEmployee(username!, email!, password!);
      this.successMessage = `Employee account for ${email} created successfully. Their DB ID is ${newId} — use this in "Update Employee Role".`;
      this.form.reset();
    } catch (err: any) {
      this.errorMessage = err?.message ?? 'Registration failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async onUpdateRole() {
    if (this.roleForm.invalid) return;
    this.roleError = '';
    this.roleSuccess = '';
    this.roleLoading = true;
    const { employeeId, role } = this.roleForm.value;
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/employees/${employeeId}/role`, { role }, { withCredentials: true })
      );
      this.roleSuccess = `Role updated to "${role}" for employee ID ${employeeId}.`;
      this.roleForm.patchValue({ employeeId: '' });
    } catch (err: any) {
      if (err?.status === 404) {
        this.roleError = `Employee ID ${employeeId} not found.`;
      } else if (err?.status === 403) {
        this.roleError = 'Only managers can update roles.';
      } else {
        this.roleError = 'Failed to update role. Please try again.';
      }
    } finally {
      this.roleLoading = false;
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
