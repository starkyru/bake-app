import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'bake-app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>Admin Dashboard</h1>
      </header>
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .app-header {
      padding: 16px;
      background-color: #f0f0f0;
      border-bottom: 1px solid #ddd;
    }
    .app-content {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }
  `],
})
export class AppComponent {
  title = 'admin-dashboard';
}
