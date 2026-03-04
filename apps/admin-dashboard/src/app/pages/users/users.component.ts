import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { User, UserRole } from '@bake-app/shared-types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  status: string;
  actions: string;
}

interface UserDialogData {
  mode: 'create' | 'edit';
  user?: UserData;
}

@Component({
  selector: 'bake-app-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Change Password</h2>
    <mat-dialog-content class="dialog-content">
      <p class="user-info">Setting new password for <strong>{{ data.name }}</strong></p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>New Password</mat-label>
        <input
          matInput
          [type]="hidePassword ? 'password' : 'text'"
          [(ngModel)]="password"
          placeholder="Enter new password"
        />
        <mat-icon matPrefix>lock</mat-icon>
        <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
          <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Confirm Password</mat-label>
        <input
          matInput
          [type]="hideConfirm ? 'password' : 'text'"
          [(ngModel)]="confirmPassword"
          placeholder="Confirm new password"
        />
        <mat-icon matPrefix>lock</mat-icon>
        <button mat-icon-button matSuffix type="button" (click)="hideConfirm = !hideConfirm">
          <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
      <p class="error" *ngIf="error">{{ error }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button class="save-btn" (click)="onSave()">Change Password</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content { display: flex; flex-direction: column; gap: 4px; min-width: 400px; padding-top: 8px; }
      .full-width { width: 100%; }
      .user-info { color: #6d4c41; margin: 0 0 8px; }
      .error { color: #c62828; font-size: 13px; margin: 0; }
      .save-btn { background-color: #8b4513 !important; color: #ffffff !important; }
    `,
  ],
})
export class PasswordDialogComponent {
  password = '';
  confirmPassword = '';
  hidePassword = true;
  hideConfirm = true;
  error = '';

  constructor(
    public dialogRef: MatDialogRef<PasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string; name: string }
  ) {}

  onSave(): void {
    if (!this.password || this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    this.dialogRef.close(this.password);
  }
}

@Component({
  selector: 'bake-app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add User' : 'Edit User' }}</h2>
    <mat-dialog-content class="dialog-content">
      <div class="form-row">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>First Name</mat-label>
          <input matInput [(ngModel)]="firstName" placeholder="First name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Last Name</mat-label>
          <input matInput [(ngModel)]="lastName" placeholder="Last name" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput [(ngModel)]="email" type="email" placeholder="user@bakery.com" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Role</mat-label>
        <mat-select [(ngModel)]="role">
          <mat-option *ngFor="let r of roles" [value]="r">{{ r | titlecase }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-slide-toggle [(ngModel)]="isActive" color="primary">
        {{ isActive ? 'Active' : 'Inactive' }}
      </mat-slide-toggle>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()" class="save-btn">
        {{ data.mode === 'create' ? 'Create' : 'Save Changes' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 420px;
        padding-top: 8px;
      }
      .form-row {
        display: flex;
        gap: 12px;
      }
      .half-width {
        flex: 1;
      }
      .full-width {
        width: 100%;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class UserDialogComponent {
  firstName = '';
  lastName = '';
  email = '';
  role = UserRole.CASHIER;
  isActive = true;
  roles = Object.values(UserRole);

  constructor(
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
  ) {
    if (data.user) {
      const parts = data.user.name.split(' ');
      this.firstName = parts[0] || '';
      this.lastName = parts.slice(1).join(' ') || '';
      this.email = data.user.email;
      this.role = data.user.role.toLowerCase() as UserRole;
      this.isActive = data.user.status === 'Active';
    }
  }

  onSave(): void {
    this.dialogRef.close({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
    });
  }
}

@Component({
  selector: 'bake-app-users',
  standalone: true,
  imports: [
    CommonModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <bake-page-container title="Users" subtitle="Manage staff accounts and roles">
      <div class="page-actions">
        <button mat-flat-button class="add-btn" (click)="openCreateDialog()">
          <mat-icon>person_add</mat-icon>
          Add User
        </button>
      </div>

      <bake-data-table
        [columns]="columns"
        [data]="users"
        (rowAction)="onRowAction($event)"
      ></bake-data-table>
    </bake-page-container>
  `,
  styles: [
    `
      .page-actions {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;
      }
      .add-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class UsersComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', type: 'badge', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true },
    {
      key: 'actions', label: 'Actions', type: 'actions', width: '160px',
      actions: [
        { action: 'password', icon: 'key', tooltip: 'Change password' },
        { action: 'edit', icon: 'edit', tooltip: 'Edit user' },
        { action: 'delete', icon: 'delete', color: 'warn', tooltip: 'Delete user' },
      ],
    },
  ];

  users: UserData[] = [];

  constructor(
    private dialog: MatDialog,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.apiClient
      .get<PaginatedResponse<User>>('/v1/users?limit=100')
      .subscribe({
        next: (response) => {
          this.users = response.data.map((u) => this.mapUser(u));
        },
        error: () => {
          this.toastService.error('Failed to load users');
        },
      });
  }

  private mapUser(u: User): UserData {
    return {
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      role: u.role?.name || '',
      roleId: u.role?.id || '',
      status: u.isActive ? 'Active' : 'Inactive',
      actions: '',
    };
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '520px',
      data: { mode: 'create' } as UserDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const dto = {
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          password: 'changeme123',
          roleId: result.role,
        };
        this.apiClient.post<User>('/v1/users', dto).subscribe({
          next: (created) => {
            this.users = [...this.users, this.mapUser(created)];
            this.toastService.success('User created successfully');
          },
          error: () => {
            this.toastService.error('Failed to create user');
          },
        });
      }
    });
  }

  openEditDialog(user: UserData): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '520px',
      data: { mode: 'edit', user } as UserDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const dto = {
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          isActive: result.isActive,
        };
        this.apiClient.put<User>(`/v1/users/${user.id}`, dto).subscribe({
          next: (updated) => {
            this.users = this.users.map((u) =>
              u.id === user.id ? this.mapUser(updated) : u,
            );
            this.toastService.success('User updated successfully');
          },
          error: () => {
            this.toastService.error('Failed to update user');
          },
        });
      }
    });
  }

  openPasswordDialog(user: UserData): void {
    const dialogRef = this.dialog.open(PasswordDialogComponent, {
      width: '460px',
      data: { id: user.id, name: user.name },
    });

    dialogRef.afterClosed().subscribe((newPassword) => {
      if (newPassword) {
        this.apiClient
          .put(`/v1/users/${user.id}`, { password: newPassword })
          .subscribe({
            next: () => {
              this.toastService.success(`Password changed for ${user.name}`);
            },
            error: () => {
              this.toastService.error('Failed to change password');
            },
          });
      }
    });
  }

  onRowAction(event: { action: string; row: UserData }): void {
    if (event.action === 'password') {
      this.openPasswordDialog(event.row);
    } else if (event.action === 'edit') {
      this.openEditDialog(event.row);
    } else if (event.action === 'delete') {
      this.confirmService
        .confirm({
          title: 'Delete User',
          message: `Are you sure you want to delete "${event.row.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          confirmColor: 'warn',
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.apiClient.delete(`/v1/users/${event.row.id}`).subscribe({
              next: () => {
                this.users = this.users.filter((u) => u.id !== event.row.id);
                this.toastService.success('User deleted successfully');
              },
              error: () => {
                this.toastService.error('Failed to delete user');
              },
            });
          }
        });
    }
  }
}
