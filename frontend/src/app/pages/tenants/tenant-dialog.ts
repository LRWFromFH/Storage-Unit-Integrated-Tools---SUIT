// tenant-dialog.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Customer } from './tenants.model';

@Component({
  selector: 'app-tenant-dialog',
  standalone: true,
  templateUrl: './tenant-dialog.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class TenantDialog {

  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TenantDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Customer | null
  ) {
    this.isEdit = !!data;

    this.form = this.fb.group({
      first_name: [data?.FirstName ?? '', Validators.required],
      last_name:  [data?.LastName ?? '', Validators.required],
      phone:      [data?.Phone ?? '', Validators.required],
      address:    [data?.Address ?? '', Validators.required],
      email:      [data?.Email ?? '', [Validators.required, Validators.email]]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }

  cancel() {
    this.dialogRef.close();
  }
}