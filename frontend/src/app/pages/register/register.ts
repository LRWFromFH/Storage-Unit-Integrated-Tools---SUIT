import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  private auth = inject(Auth);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  async onSubmit() {
    if (this.form.invalid) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    const { username, email, password } = this.form.value;

    try {
      await this.auth.registerEmployee(username!, email!, password!);
      this.successMessage = `Employee account for ${email} created successfully.`;
      this.form.reset();
    } catch (err: any) {
      this.errorMessage = err?.message ?? 'Registration failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
