import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbItem } from '../models';

@Component({
  selector: 'bake-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li *ngFor="let item of items; let last = last" class="breadcrumb-item">
          <ng-container *ngIf="!last && item.route; else plainText">
            <a [routerLink]="item.route" class="breadcrumb-link">
              <mat-icon *ngIf="item.icon" class="breadcrumb-icon">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          </ng-container>
          <ng-template #plainText>
            <span class="breadcrumb-current">
              <mat-icon *ngIf="item.icon" class="breadcrumb-icon">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </span>
          </ng-template>
          <span *ngIf="!last" class="breadcrumb-separator">/</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [
    `
      .breadcrumb-list {
        display: flex;
        align-items: center;
        list-style: none;
        margin: 0;
        padding: 0;
        flex-wrap: wrap;
      }

      .breadcrumb-item {
        display: flex;
        align-items: center;
      }

      .breadcrumb-link {
        display: flex;
        align-items: center;
        color: #1976d2;
        text-decoration: none;
        font-size: 14px;
      }

      .breadcrumb-link:hover {
        text-decoration: underline;
      }

      .breadcrumb-current {
        display: flex;
        align-items: center;
        color: #607d8b;
        font-size: 14px;
      }

      .breadcrumb-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-right: 4px;
      }

      .breadcrumb-separator {
        margin: 0 8px;
        color: #b0bec5;
      }
    `,
  ],
})
export class BakeBreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
}
