import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';



@Component({
  selector: 'app-verify-code',
  imports: [ReactiveFormsModule],
  templateUrl:'./verify-code.html',
  styleUrl: './verify-code.scss',
})
export class VerifyCode {

  private fb = inject(FormBuilder);
  private router = inject(Router);

  codigoTest = 'ASD123'

  form = this.fb.group({
    codigo: ['', Validators.required],
  });


  submit() {
  if (this.form.valid) {
    console.log('Form submitted', this.form.value);
    this.router.navigate(['/recuperar-contraseña/exito']);
  }
}
}
