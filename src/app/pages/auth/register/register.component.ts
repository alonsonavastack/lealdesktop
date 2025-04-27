import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  firebaseService = inject(FirebaseService);
  private toast = inject(HotToastService);
  private utilsService = inject(UtilsService);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required]],
    address: ['', [Validators.required]],
    isActive: [true],
    role: ['client'],
    img: ['https://icon-library.com/images/avatar-icon-images/avatar-icon-images-4.jpg'],
    createdAt: [new Date()],
    updatedAt: [null],
    lastLogin: [null]
  });

  async submit() {
    if (this.form.valid) {
      try {
        const auth = getAuth();
        const formData = this.form.value;
        
        // Generar un ID numérico único
        const numericId = Date.now().toString();
        
        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Preparar datos para Firestore
        const userData = {
          ...formData,
          uid: numericId, // Usar ID numérico en lugar del uid de Firebase
          password: this.utilsService.encrypt(formData.password),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          img: 'https://icon-library.com/images/avatar-icon-images/avatar-icon-images-4.jpg',
          isActive: true,
          role: 'client'
        };

        // Guardar en Firestore usando el ID numérico
        await this.firebaseService.setDocument(`users/${numericId}`, userData);
        
        this.toast.success('¡Usuario creado con éxito!', {
          duration: 2000,
          position: 'top-right',
          icon: '👏'
        });

        // Resetear formulario y navegar a login
        this.form.reset({
          role: 'client',
          isActive: true,
          img: 'https://icon-library.com/images/avatar-icon-images/avatar-icon-images-4.jpg'
        });
        
        this.router.navigate(['/login']);
      } catch (error: any) {
        console.error('Error en registro:', error);
        this.toast.error(error.message || 'Error al crear usuario', {
          duration: 2000,
          position: 'top-right',
          icon: '😢'
        });
      }
    } else {
      this.toast.error('Por favor, completa todos los campos correctamente');
    }
  }
}
