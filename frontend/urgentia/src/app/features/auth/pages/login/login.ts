import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component,inject } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {private fb = inject(FormBuilder);
  private router = inject(Router);

  emailTest = 'urgentia@gmail.com';
  passwordTest = '123456'

  form = this.fb.group({
    cedula: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });


  submit() {
  if (this.form.valid) {
    console.log('Form submitted', this.form.value);
    this.router.navigate(['/recuperar-contraseña/home']);
  }
}
}
