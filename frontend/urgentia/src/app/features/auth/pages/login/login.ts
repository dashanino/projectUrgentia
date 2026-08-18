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
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    
  });

  submit() {
  if (this.form.invalid) {
    alert('Por favor, complete todos los campos correctamente.');
    return;
  }

  const password = this.form.value.password;
  const email = this.form.value.email;

  if (password !== this.passwordTest || email !== this.emailTest) {
    alert('El correo electrónico y/o la contraseña no corresponden a una cuenta registrada..');
    return;
  }

  console.log('Datos correctos');
  this.router.navigate(['home']);
}
}
