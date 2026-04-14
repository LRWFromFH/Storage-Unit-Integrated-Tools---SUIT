import { Component, Inject, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { Customer, Note } from './tenants.model';
import { TenantsService } from './tenants.service';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-notes-dialog',
  standalone: true,
  templateUrl: './notes-dialog.html',
  styleUrl: './notes-dialog.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ]
})
export class NotesDialog implements OnInit {

  auth = inject(Auth);

  customer: Customer;
  notes: Note[] = [];
  loading = true;
  loadError = false;

  form: FormGroup;
  submitting = false;
  deletingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<NotesDialog>,
    private tenantsService: TenantsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { customer: Customer }
  ) {
    this.customer = data.customer;
    this.form = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes() {
    this.loading = true;
    this.loadError = false;
    this.tenantsService.getNotes(this.customer.ID).subscribe({
      next: (notes) => {
        this.notes = notes ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  canDelete(note: Note): boolean {
    return this.auth.isManager() || note.AuthorID === this.auth.employeeId();
  }

  addNote() {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    this.tenantsService.postNote(this.customer.ID, this.form.value.content).subscribe({
      next: () => {
        this.snackBar.open('Note added', 'Close', { duration: 2000 });
        this.form.reset();
        this.submitting = false;
        this.loadNotes();
      },
      error: () => {
        this.snackBar.open('Failed to add note', 'Close', { duration: 5000 });
        this.submitting = false;
      }
    });
  }

  deleteNote(note: Note) {
    this.deletingId = note.ID;
    this.tenantsService.deleteNote(this.customer.ID, note.ID).subscribe({
      next: () => {
        this.snackBar.open('Note deleted', 'Close', { duration: 2000 });
        this.deletingId = null;
        this.loadNotes();
      },
      error: (err) => {
        const msg = err.status === 403 ? 'You can only delete your own notes' : 'Failed to delete note';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.deletingId = null;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
