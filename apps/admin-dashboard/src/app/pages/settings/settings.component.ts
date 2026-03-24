import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { BakePageContainerComponent } from '@bake-app/ui-components';
import { AuthService } from '@bake-app/auth';
import { SettingsPanelComponent } from './settings-panel.component';
import { GeneralSettingsComponent } from './general-settings.component';
import { TaxSettingsComponent } from './tax-settings.component';
import { PosSettingsComponent } from './pos-settings.component';
import { MenuCategoriesComponent } from './menu-categories.component';
import { IngredientCategoriesComponent } from './ingredient-categories.component';
import { LocationsSettingsComponent } from './locations-settings.component';

@Component({
  selector: 'bake-app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    BakePageContainerComponent,
    SettingsPanelComponent,
    GeneralSettingsComponent,
    TaxSettingsComponent,
    PosSettingsComponent,
    MenuCategoriesComponent,
    IngredientCategoriesComponent,
    LocationsSettingsComponent,
  ],
  template: `
    <bake-page-container title="Settings" subtitle="Configure your bakery system">
      <mat-accordion class="settings-accordion" multi>
        <bake-settings-panel
          *ngIf="isAdmin"
          icon="store"
          title="General Settings"
          description="Bakery name, address, and contact info"
          [expanded]="true"
        >
          <bake-general-settings></bake-general-settings>
        </bake-settings-panel>

        <bake-settings-panel
          *ngIf="isAdmin"
          icon="receipt"
          title="Tax Configuration"
          description="Tax rates and calculation settings"
        >
          <bake-tax-settings></bake-tax-settings>
        </bake-settings-panel>

        <bake-settings-panel
          *ngIf="isAdmin"
          icon="point_of_sale"
          title="POS Settings"
          description="Receipt and point-of-sale configuration"
        >
          <bake-pos-settings></bake-pos-settings>
        </bake-settings-panel>

        <bake-settings-panel
          icon="restaurant_menu"
          title="Menu Categories"
          description="Categories for products and recipes"
          [expanded]="!isAdmin"
        >
          <bake-menu-categories></bake-menu-categories>
        </bake-settings-panel>

        <bake-settings-panel
          icon="grain"
          title="Ingredient Categories"
          description="Categories for inventory and ingredients"
        >
          <bake-ingredient-categories></bake-ingredient-categories>
        </bake-settings-panel>

        <bake-settings-panel
          *ngIf="isAdmin"
          icon="location_on"
          title="Locations"
          description="Bakery, store, and warehouse locations"
        >
          <bake-locations-settings></bake-locations-settings>
        </bake-settings-panel>
      </mat-accordion>
    </bake-page-container>
  `,
  styles: [
    `
      .settings-accordion {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      ::ng-deep .settings-accordion .mat-expansion-panel {
        border-radius: 12px !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  isAdmin = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const role = this.authService.getUserRole()?.toLowerCase();
    this.isAdmin = role === 'owner';
  }
}
