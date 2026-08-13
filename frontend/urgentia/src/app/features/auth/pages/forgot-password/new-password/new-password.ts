import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-password',
  imports: [ReactiveFormsModule],
  templateUrl: './new-password.html',
  styleUrl: './new-password.scss',
})
export class NewPassword {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  passwordTest = '123456'


  form = this.fb.group({
    nueva_contraseña: ['', Validators.required],
    confirmar_contraseña:['', Validators.required],
  });


  submit() {
  if (this.form.valid) {
    console.log('Form submitted', this.form.value);
    this.router.navigate(['/recuperar-contraseña/exito']);
  }
}

}
