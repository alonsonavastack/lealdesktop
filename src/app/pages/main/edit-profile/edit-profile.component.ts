import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html'
})
export class EditProfileComponent {
  user = signal({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    address: '123 Main St',
    city: 'Example City',
    profileImage: ''
  });

  constructor(private router: Router) {}

  updateProfile() {
    // Here you would implement the profile update logic
    console.log('Updating profile:', this.user());
    this.router.navigate(['/profile']);
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Here you would implement the image upload logic
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.update(current => ({
          ...current,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  cancelEdit() {
    this.router.navigate(['/profile']);
  }
}
