import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Unit } from './unit.model';

@Component({
  selector: 'app-unit-dialog',
  standalone: true,
  templateUrl: './unit-dialog.html',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule
  ]
})
export class UnitDialog {

  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UnitDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Unit | null
  ) {
    this.isEdit = !!data;

    this.form = this.fb.group({
      unit_number: [data?.UnitNumber ?? '', [Validators.required, Validators.minLength(1)]],
      size_type:   [data?.SizeType ?? '', Validators.required],
      price:       [data?.Price ?? 0, [Validators.required, Validators.min(0)]],
      length:      [data?.Length ?? 5, [Validators.required, Validators.min(1)]],
      width:       [data?.Width ?? 5, [Validators.required, Validators.min(1)]],
      height:      [data?.Height ?? 10, [Validators.required, Validators.min(1)]]
    });
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.dialogRef.close({
      unit_number: v.unit_number,
      size_type:   v.size_type,
      price:       Number(v.price),
      length:      Number(v.length),
      width:       Number(v.width),
      height:      Number(v.height)
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}