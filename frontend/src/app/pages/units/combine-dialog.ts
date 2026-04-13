import { Component, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Unit } from './unit.model';

export interface CombineDialogData {
  units: Unit[];
}

@Component({
  selector: 'app-combine-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>Combine Units</h2>
    <mat-dialog-content>
      <p style="color: var(--suit-text-muted); margin-bottom: 16px;">
        Select at least 2 units to combine. The dimensions will be merged and a new combined unit will be created.
      </p>

      <div style="margin-bottom: 16px;">
        <strong>Select units to combine:</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px; max-height: 240px; overflow-y: auto;">
          @for (unit of data.units; track unit.ID) {
            <label style="display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; cursor: pointer;">
              <input type="checkbox" [value]="unit.ID" (change)="onUnitToggle(unit.ID, $event)">
              <span>
                <strong>{{ unit.UnitNumber }}</strong> — {{ unit.SizeType }}
                ({{ unit.Length }}×{{ unit.Width }}×{{ unit.Height }} ft, {{ unit.Price | currency }}/mo)
              </span>
            </label>
          }
        </div>
        @if (selectedIds.length > 0 && selectedIds.length < 2) {
          <p style="color: #d32f2f; font-size: 12px; margin-top: 6px;">Select at least 2 units.</p>
        }
      </div>

      <form [formGroup]="form" style="display: flex; flex-direction: column; gap: 12px;">
        <mat-form-field appearance="outline">
          <mat-label>Price for combined unit ($/mo)</mat-label>
          <input matInput type="number" formControlName="price" step="0.01">
          @if (form.get('price')?.hasError('required') && form.get('price')?.touched) {
            <mat-error>Price is required</mat-error>
          }
        </mat-form-field>
      </form>

      @if (selectedIds.length >= 2) {
        <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; font-size: 13px;">
          <strong>Combined unit number:</strong> {{ previewUnitNumbers }}
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="selectedIds.length < 2 || form.invalid"
              (click)="save()">
        Combine Units
      </button>
    </mat-dialog-actions>
  `
})
export class CombineDialog {

  form: FormGroup;
  selectedIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CombineDialog>,
    @Inject(MAT_DIALOG_DATA) public data: CombineDialogData
  ) {
    this.form = this.fb.group({
      price: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  get selectedUnits(): Unit[] {
    return this.data.units.filter(u => this.selectedIds.includes(u.ID));
  }

  get previewUnitNumbers(): string {
    return this.selectedUnits.map(u => u.UnitNumber).join('-');
  }

  onUnitToggle(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds = [...this.selectedIds, id];
    } else {
      this.selectedIds = this.selectedIds.filter(i => i !== id);
    }
  }

  save() {
    if (this.selectedIds.length < 2 || this.form.invalid) return;
    this.dialogRef.close({
      unit_ids: this.selectedIds,
      price: Number(this.form.value.price)
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
