import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, FormsModule, Validators} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { User } from '../../models/user.model';
import { UtilsService } from '../../services/utils.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-auth',
  imports: [CommonModule,FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {

  utilsService = inject(UtilsService);
  firebaseService = inject(FirebaseService);
  toast = inject(HotToastService);
  form = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.required]),
    password: new FormControl('', [Validators.minLength(6), Validators.required])
  })

  async loginWithRole(user: User) {
    try {
      const userData = await this.firebaseService.loginWithCredentials(
        user.email,
        user.password
      );
      
      // Store user data
      this.utilsService.saveLocalStorage('user', userData);
      
      // Navigate based on role
      if (userData.role === 'client') {
        await this.utilsService.routerLink('/main');
      } else {
        await this.utilsService.routerLink('/dashboard/users');
      }
      
      return userData;
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.message === 'Usuario no encontrado') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.message === 'Contraseña incorrecta') {
        errorMessage = 'Contraseña incorrecta';
      }

      this.toast.error(errorMessage, {
        duration: 2000,
        position: 'top-right',
        icon: '😔',
      });
      
      throw error;
    }
  }

  submit() {
    if (this.form.valid) {
      const credentials = {
        ...this.form.value,
        email: this.form.value.email?.trim().toLowerCase(),
      } as User;

      this.loginWithRole(credentials)
        .then(userData => {
          this.utilsService.saveLocalStorage('user', userData);
          this.form.reset();
          this.toast.success('Bienvenido!', {
            duration: 2000,
            position: 'top-right',
            icon: '👏',
          });
        })
        .catch(error => {
          console.log('Login error:', error);
          // Error message is now handled in loginWithRole
        });
    }
  }

  async getUserInfo(uid: string) {
    if(this.form.valid){
     let path = `users/${uid}`;

     this.firebaseService.getDocument(path).then((user: User) => {
      this.utilsService.saveLocalStorage('user', user);
      this.utilsService.routerLink('/dashboard');
      this.form.reset();
      this.toast.success('Bienvenido!', {
        duration: 2000,
        position: 'top-right',
        icon: '👏',
      });
     }).catch(error => {
      console.log(error);
      this.toast.error('Error al iniciar sesión', {
        duration: 2000,
        position: 'top-right',
        icon: '😔',
      });
     }).finally(() => {
      
     });
    }
  }
}
