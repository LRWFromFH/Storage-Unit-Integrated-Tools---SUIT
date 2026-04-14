import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Customer, LedgerEntry } from './tenants.model';
import { Unit } from '../units/unit.model';
import { TenantsService } from './tenants.service';

export interface BillingDialogData {
  customer: Customer;
  units: Unit[];
}

@Component({
  selector: 'app-billing-dialog',
  standalone: true,
  templateUrl: './billing-dialog.html',
  styleUrl: './billing-dialog.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class BillingDialog implements OnInit {

  customer: Customer;
  units: Unit[];

  balance: number | null = null;
  balanceLoading = true;
  balanceError = false;

  transactions: LedgerEntry[] = [];
  transactionsLoading = true;
  transactionsError = false;

  chargeForm: FormGroup;
  chargingSubmitting = false;

  paymentForm: FormGroup;
  paymentSubmitting = false;

  get hasUnits(): boolean { return this.units.length > 0; }
  get hasOutstandingBalance(): boolean { return this.balance !== null && this.balance < 0; }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BillingDialog>,
    private tenantsService: TenantsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: BillingDialogData
  ) {
    this.customer = data.customer;
    this.units = data.units;

    this.chargeForm = this.fb.group({
      unit_id:     [this.units[0]?.ID ?? null, Validators.required],
      amount:      [this.units[0]?.Price ?? null, [Validators.required, Validators.min(0.01)]],
      description: ['Monthly rent']
    });

    this.paymentForm = this.fb.group({
      unit_id:     [this.units[0]?.ID ?? null, Validators.required],
      amount:      [null, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadBalance();
    this.loadTransactions();
  }

  onChargeUnitChange(unitId: number) {
    const unit = this.units.find(u => u.ID === unitId);
    if (unit) {
      this.chargeForm.patchValue({ amount: unit.Price });
    }
  }

  loadBalance() {
    this.balanceLoading = true;
    this.balanceError = false;
    this.tenantsService.getCustomerBalance(this.customer.ID).subscribe({
      next: (bal) => {
        this.balance = bal ?? 0;
        this.balanceLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.balanceError = true;
        this.balanceLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTransactions() {
    this.transactionsLoading = true;
    this.transactionsError = false;
    this.tenantsService.getCustomerTransactions(this.customer.ID).subscribe({
      next: (txns) => {
        this.transactions = txns ?? [];
        this.transactionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.transactionsError = true;
        this.transactionsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitCharge() {
    if (this.chargeForm.invalid || this.chargingSubmitting) return;
    this.chargingSubmitting = true;
    const v = this.chargeForm.value;

    this.tenantsService.postCharge({
      customer_id: this.customer.ID,
      unit_id:     v.unit_id,
      amount:      v.amount,
      description: v.description || ''
    }).subscribe({
      next: () => {
        this.snackBar.open('Charge created successfully', 'Close', { duration: 3000 });
        this.chargeForm.patchValue({ description: 'Monthly rent' });
        this.chargingSubmitting = false;
        this.loadBalance();
        this.loadTransactions();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to create charge';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.chargingSubmitting = false;
      }
    });
  }

  submitPayment() {
    if (this.paymentForm.invalid || this.paymentSubmitting) return;
    this.paymentSubmitting = true;
    const v = this.paymentForm.value;

    this.tenantsService.postPayment({
      customer_id: this.customer.ID,
      unit_id:     v.unit_id,
      amount:      v.amount,
      description: v.description || ''
    }).subscribe({
      next: () => {
        this.snackBar.open('Payment recorded successfully', 'Close', { duration: 3000 });
        this.paymentForm.reset({ unit_id: this.units[0]?.ID ?? null });
        this.paymentSubmitting = false;
        this.loadBalance();
        this.loadTransactions();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to record payment';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.paymentSubmitting = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
