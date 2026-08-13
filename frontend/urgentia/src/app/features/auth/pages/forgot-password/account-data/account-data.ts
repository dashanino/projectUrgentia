import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-account-data',
  imports: [ReactiveFormsModule],
  templateUrl: './account-data.html',
  styleUrl: './account-data.scss',
})
export class AccountData {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  cedulaTest = '123456';
  emailTest = 'urgentia@gmail.com';

  form = this.fb.group({
    cedula: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });


  submit() {
  if (this.form.valid) {
    console.log('Form submitted', this.form.value);
    this.router.navigate(['/recuperar-contraseña/codigo']);
  }
}
}
