import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './employees.html',
  styleUrls: ['./employees.scss']
})
export class Employees implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  employees: any[] = [];
  isLoading = true;
  updatingId: number | null = null;

  async ngOnInit() {
    await this.loadEmployees();
  }

  async loadEmployees() {
    try {
      this.isLoading = true;
      this.employees = await this.api.getEmployees();
    } catch (e) {
      this.snackBar.open('Failed to load employees', 'Dismiss', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  async updateRole(employee: any) {
    try {
      this.updatingId = employee.ID;
      await this.api.updateEmployeeRole(employee.ID, employee.Role);
      this.snackBar.open(`Role updated for ${employee.SMID}`, 'OK', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Failed to update role', 'Dismiss', { duration: 3000 });
    } finally {
      this.updatingId = null;
    }
  }

  getRoleColor(role: string): string {
    return role === 'manager' ? '#8b5cf6' : '#6b7280';
  }
}
