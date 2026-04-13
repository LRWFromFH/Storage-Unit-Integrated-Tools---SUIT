import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';

import { ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  private auth = inject(Auth);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    // if (this.auth.isAuthenticated()) {
    //   this.router.navigate(['/dashboard']);
    // }
  }

  async onSubmit() {
    if (this.form.invalid || this.isLoading) return;

    this.errorMessage = '';
    this.isLoading = true;

    const { email, password } = this.form.getRawValue();

    try {
      await this.auth.login(email!, password!);
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    } catch (err: any) {
      this.errorMessage = err.message || 'Something went wrong';
      // this.showErrorToast(this.errorMessage);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }

  }


  private showErrorToast(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['suit-snackbar-error']
    });
  }

}