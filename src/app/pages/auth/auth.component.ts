import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, FormsModule, Validators} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-auth',
  imports: [CommonModule,FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {

  router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.required]),
    password: new FormControl('', [Validators.minLength(6), Validators.required])
  })

  submit(){
    if(this.form.valid){
      console.log(this.form.value);
      this.router.navigate(['/dashboard']);
    }

  }
}
