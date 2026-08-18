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

  form = this.fb.group({
    nueva_contraseña: ['', Validators.required],
    confirmar_contraseña: ['', Validators.required],
  });

  submit() {

    if (this.form.invalid) {
      alert('Por favor, complete ambos campos.');
      return;
    }

    const password = this.form.value.nueva_contraseña;
    const confirmPassword = this.form.value.confirmar_contraseña;

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    console.log('Contraseña actualizada');

    this.router.navigate(['/recuperar-contraseña/exito']);
  }
}
