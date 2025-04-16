import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../../models/user.model';
import * as CryptoJS from 'crypto-js';
import { HotToastService } from '@ngxpert/hot-toast';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html'
})
export class EditProfileComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private firebaseSvc = inject(FirebaseService);
  toast = inject(HotToastService);

  isLoading = signal<boolean>(false);
  currentUser = signal<User | null>(null);
  changePassword = signal<boolean>(false);
  
  profileForm = signal<FormGroup>(this.fb.group({
    uid: [''],
    name: ['', Validators.required],
    password: [''],
    newPassword: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    address: ['', Validators.required],
    img: ['', Validators.required]
  }));

  formErrors = computed(() => ({
    name: this.profileForm().get('name')?.errors?.['required'] && 
          this.profileForm().get('name')?.touched,
    newPassword: {
      required: this.changePassword() && 
                !this.profileForm().get('newPassword')?.value,
      minLength: this.changePassword() && 
                 this.profileForm().get('newPassword')?.value?.length < 6
    },
    email: {
      required: this.profileForm().get('email')?.errors?.['required'] && 
                this.profileForm().get('email')?.touched,
      invalid: this.profileForm().get('email')?.errors?.['email'] && 
               this.profileForm().get('email')?.touched
    },
    phone: {
      required: this.profileForm().get('phone')?.errors?.['required'] && 
                this.profileForm().get('phone')?.touched,
      invalid: this.profileForm().get('phone')?.errors?.['pattern'] && 
               this.profileForm().get('phone')?.touched
    },
    address: this.profileForm().get('address')?.errors?.['required'] && 
             this.profileForm().get('address')?.touched,
    img: this.profileForm().get('img')?.errors?.['required'] && 
         this.profileForm().get('img')?.touched
  }));

  constructor() {
    this.loadUserData();
  }

  loadUserData() {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user: User = JSON.parse(userData);
      this.currentUser.set(user);
      this.profileForm().patchValue({
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        img: user.img,
        password: user.password // Encrypted password
      });
    }
  }

  toggleChangePassword() {
    this.changePassword.update(value => !value);
    if (!this.changePassword()) {
      this.profileForm().patchValue({ newPassword: '' });
    }
  }

  private encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, 'your-secret-key').toString();
  }

  updateProfile() {
    if (this.profileForm().valid) {
      this.isLoading.set(true);
      
      const formData = this.profileForm().value;
      const updatedUser: User = {
        ...this.currentUser()!,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        img: formData.img
      };

      if (this.changePassword() && formData.newPassword) {
        updatedUser.password = formData.newPassword; // Will be encrypted in service
      }

      this.firebaseSvc.updateUserProfile(updatedUser, this.changePassword())
        .then(() => {
          this.toast.success('Perfil actualizado con éxito!', {
            duration: 2000,
            position: 'top-right',
            icon: '👏',
          });
          this.router.navigate(['/profile']);
        })
        .catch(error => {
          this.toast.error('Error al actualizar el perfil', {
            duration: 2000,
            position: 'top-right',
            icon: '❌',
          });
        })
        .finally(() => this.isLoading.set(false));
    } else {
      Object.keys(this.profileForm().controls).forEach(key => {
        const control = this.profileForm().get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  cancelEdit() {
    this.router.navigate(['/profile']);
  }
}