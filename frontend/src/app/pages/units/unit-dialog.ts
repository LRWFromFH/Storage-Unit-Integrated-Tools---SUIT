import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

import { Unit } from './unit.model';

@Component({
  selector: 'app-unit-dialog',
  standalone: true,
  templateUrl: './unit-dialog.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule
  ]
})
export class UnitDialog {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UnitDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Unit | null
  ) {

    this.form = this.fb.group({
      unitNumber: [data?.unitNumber ?? '', Validators.required],
      unitType: [data?.unitType ?? '', Validators.required],
      sizeSqFt: [data?.sizeSqFt ?? 0, [Validators.required, Validators.min(1)]],
      floor: [data?.floor ?? 1, Validators.required],
      climateControlled: [data?.climateControlled ?? false],
      pricePerMonth: [data?.pricePerMonth ?? 0, [Validators.required, Validators.min(0)]],
      status: [data?.status ?? 'Available', Validators.required],
      insuranceRequired: [data?.insuranceRequired ?? true]
    });
  }

  save() {
    if (this.form.invalid) return;

    this.dialogRef.close({
      ...this.data,
      ...this.form.value,
      lastUpdated: new Date()
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}