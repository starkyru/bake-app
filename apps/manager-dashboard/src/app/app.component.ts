import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'bake-app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        background-color: #faf3e8;
      }
    `,
  ],
})
export class AppComponent {
  title = 'manager-dashboard';
}
