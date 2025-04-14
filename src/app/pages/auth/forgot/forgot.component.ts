import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, FormsModule, Validators} from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot',
  imports: [CommonModule,FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot.component.html',
  styleUrl: './forgot.component.css'
})


export class ForgotComponent {
  
  form = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.required]),
  })

  submit(){
    if(this.form.valid){
      console.log(this.form.value);
    }
  }
}
