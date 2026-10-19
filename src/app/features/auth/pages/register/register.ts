import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../services/auth.service';


@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})



export class Register {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  readonly eps = [
    { id: 1, nombre: 'SURA' },
    { id: 2, nombre: 'Sanitas' },
    { id: 3, nombre: 'Nueva EPS' },
    { id: 4, nombre: 'Salud Total' },
    { id: 5, nombre: 'Coosalud' },
    { id: 6, nombre: 'Savia Salud' },
    { id: 7, nombre: 'Compensar' },
    { id: 8, nombre: 'Famisanar' }
  ];

  form = this.fb.group({
    document_number: ['', Validators.required],
    names: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    DOB: ['', Validators.required],
    id_eps: [null, Validators.required],
    sex: ['', Validators.required],
    nueva_contraseña: ['', Validators.required],
    confirmar_contraseña: ['', Validators.required],
    terminos: [false, Validators.requiredTrue]
  });

  // ...


  goBack() {
    this.router.navigate(['/begin']);
  }

  checkTerms() {
    window.open('docs/Urgentia_Terminos_Condiciones.pdf');
  }

  checkPrivacy() {
    window.open('/docs/Urgentia_Politica_Privacidad.pdf');
  }

  submit() {

  if (this.form.invalid) {
    alert('Por favor, complete todos los campos correctamente.');
    return;
  }

  const password = this.form.value.nueva_contraseña;
  const confirmPassword = this.form.value.confirmar_contraseña;

  if (password !== confirmPassword) {
    alert('Las contraseñas no coinciden.');
    return;
  }

  if (!this.form.get('terminos')?.value) {
    return;
  }

  const data = {
    document_number: this.form.value.document_number!,
    first_names: this.form.value.names!,
    last_names: this.form.value.lastname!,
    email: this.form.value.email!,
    phone: this.form.value.phoneNumber!,
    birth_date: this.form.value.DOB!,
    sex: this.form.value.sex!,
    id_eps: this.form.value.id_eps!,
    password: password!
  };

  console.log('Enviando registro:', data);

  this.authService.register(data).subscribe({

    next: (response) => {

      console.log('Usuario creado:', response);

      alert('Cuenta creada correctamente.');

      this.router.navigate(['/login']);
    },

    error: (error) => {

      console.error('Error al registrar:', error);

      alert(
        error.error?.message ||
        'No se pudo crear la cuenta.'
      );
    }

  });
}}