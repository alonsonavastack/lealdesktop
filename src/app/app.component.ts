import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  deferredPrompt: any;
  showInstallModal = signal(false);

  constructor() {
    this.initializePWA();
  }

  private initializePWA(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.showInstallModal.set(true);
    });
  }

  async installPWA(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        console.log('Usuario instaló la PWA');
      }
      this.deferredPrompt = null;
      this.showInstallModal.set(false);
    }
  }

  closeInstallModal(): void {
    this.showInstallModal.set(false);
  }
}
