import { Component, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Unit } from '../units/unit.model';
import { Customer } from './tenants.model';

export interface AssignUnitDialogData {
  customer: Customer;
  availableUnits: Unit[];
}

@Component({
  selector: 'app-assign-unit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Assign Unit to {{ data.customer.FirstName }} {{ data.customer.LastName }}</h2>
    <mat-dialog-content>
      @if (data.availableUnits.length === 0) {
        <p style="color: var(--suit-text-muted);">No available units to assign.</p>
      } @else {
        <form [formGroup]="form" style="display: flex; flex-direction: column; gap: 16px; padding-top: 8px;">
          <mat-form-field appearance="outline">
            <mat-label>Select a unit</mat-label>
            <mat-select formControlName="unitNumber">
              @for (unit of data.availableUnits; track unit.ID) {
                <mat-option [value]="unit.UnitNumber">
                  {{ unit.UnitNumber }} — {{ unit.SizeType }}
                  ({{ unit.Length }}×{{ unit.Width }}×{{ unit.Height }} ft)
                  — {{ unit.Price | currency }}/mo
                </mat-option>
              }
            </mat-select>
            @if (form.get('unitNumber')?.hasError('required') && form.get('unitNumber')?.touched) {
              <mat-error>Please select a unit</mat-error>
            }
          </mat-form-field>
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      @if (data.availableUnits.length > 0) {
        <button mat-raised-button color="primary"
                [disabled]="form.invalid"
                (click)="save()">
          Assign Unit
        </button>
      }
    </mat-dialog-actions>
  `
})
export class AssignUnitDialog {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignUnitDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AssignUnitDialogData
  ) {
    this.form = this.fb.group({
      unitNumber: ['', Validators.required]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.unitNumber);
  }

  cancel() {
    this.dialogRef.close();
  }
}
