import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  showPasswordValue = false;
  loginError = false;

  form = this.fb.group({
    document_number: ['', [Validators.required]],
    password: ['', Validators.required],
  });

  goBack() {
    this.router.navigate(['/begin']);
  }

  showPassword() {
    this.showPasswordValue = !this.showPasswordValue;
  }

  submit() {

    if (this.form.invalid) {
      alert('Por favor, complete todos los campos correctamente.');
      return;
    }

    const document_number = this.form.value.document_number!;
    const password = this.form.value.password!;

    this.authService.login({
      document_number,
      password
    }).subscribe({

      next: (response) => {

        console.log('Login correcto');
        console.log(response);

        this.loginError = false;

        // Guardamos el token
        sessionStorage.setItem(
          'access_token',
          response.access_token
        );

        // Guardamos los datos del usuario
        sessionStorage.setItem(
          'user',
          JSON.stringify(response.user)
        );

        this.router.navigate(['/app/home']);
      },

      error: (error) => {

        console.error('Error en login:', error);

        this.loginError = true;
      }

    });
  }
}