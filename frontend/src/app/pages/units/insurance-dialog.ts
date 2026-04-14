import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { Unit, InsuranceRecord } from './unit.model';
import { UnitsService } from './units.service';

@Component({
  selector: 'app-insurance-dialog',
  standalone: true,
  templateUrl: './insurance-dialog.html',
  styleUrl: './insurance-dialog.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class InsuranceDialog implements OnInit {

  unit: Unit;
  existing: InsuranceRecord | null = null;
  loading = true;
  submitting = false;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InsuranceDialog>,
    private unitsService: UnitsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { unit: Unit }
  ) {
    this.unit = data.unit;
    this.form = this.fb.group({
      provider_name:  ['', Validators.required],
      policy_number:  ['', Validators.required],
      coverage_limit: [null, [Validators.required, Validators.min(0.01)]],
      expiry_date:    ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadInsurance();
  }

  loadInsurance() {
    this.loading = true;
    this.unitsService.getInsurance(this.unit.UnitNumber).subscribe({
      next: (ins) => {
        this.existing = ins;
        if (ins) {
          // Pre-fill form with existing data
          const expiryDate = ins.ExpiryDate ? ins.ExpiryDate.substring(0, 10) : '';
          this.form.patchValue({
            provider_name:  ins.ProviderName,
            policy_number:  ins.PolicyNumber,
            coverage_limit: ins.CoverageLimit,
            expiry_date:    expiryDate
          });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.existing = null; // No insurance yet — valid state
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  save() {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    const v = this.form.value;

    // Ensure expiry_date is in ISO 8601 format
    const expiryISO = new Date(v.expiry_date + 'T00:00:00Z').toISOString();

    this.unitsService.postInsurance(this.unit.UnitNumber, {
      provider_name:  v.provider_name,
      policy_number:  v.policy_number,
      coverage_limit: v.coverage_limit,
      expiry_date:    expiryISO
    }).subscribe({
      next: (ins) => {
        this.existing = ins;
        this.snackBar.open(
          this.existing ? 'Insurance updated successfully' : 'Insurance saved successfully',
          'Close', { duration: 3000 }
        );
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Failed to save insurance', 'Close', { duration: 5000 });
        this.submitting = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
