import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChangeDetectorRef } from '@angular/core';
import { finalize } from 'rxjs';

interface Antecedente { id: number; name: string; }
interface PerfilMedico {
  first_names: string; last_names: string; document_number: string; email: string;
  sex: string | null; birth_date: string | null; eps: string | null;
  antecedentes: Antecedente[]; medications: string[]; allergies: string[];
  hospitalizations: string[]; surgeries: string[];
  weight_kg: number | null; height_cm: number | null;
}

@Component({
  selector: 'app-perfil', standalone: true,
  imports: [MatIconModule, FormsModule],
  templateUrl: './perfil.html', styleUrl: './perfil.scss',
})
export class Perfil implements OnInit, OnDestroy {
  
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private api = 'http://127.0.0.1:3000/api/medical-profile';
  perfil: PerfilMedico | null = null;
  fotoUrl: string | null = null;
  subiendoFoto = false;
  eliminandoFoto = false;
  catalogo: Antecedente[] = [];
  seleccionados: number[] = [];
  editando = false;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';
  medications = '';
  allergies = '';
  hospitalizations = '';
  surgeries = '';
  weight_kg: number | null = null;
  height_cm: number | null = null;

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${sessionStorage.getItem('access_token') || ''}` });
  }

  ngOnInit(): void {
    if (!sessionStorage.getItem('access_token')) {
      this.router.navigate(['/login']);
      return;
    }
  
    this.cargando = true;
    this.error = '';
  
    this.http.get<PerfilMedico>(
      `${this.api}/me`,
      { headers: this.headers() }
    ).subscribe({
      next: (p) => {
        console.log('PERFIL RECIBIDO:', p);
  
        this.perfil = p;
        this.reiniciarFormulario();
        this.cargarFoto();
        this.cargando = false;
  
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR PERFIL:', err);
  
        this.error = 'No se pudo cargar el perfil médico.';
        this.cargando = false;
  
        this.cdr.detectChanges();
      }
    });
  
    this.http.get<Antecedente[]>(
      `${this.api}/antecedentes`,
      { headers: this.headers() }
    ).subscribe({
      next: (items) => {
        this.catalogo = items;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR ANTECEDENTES:', err);
        this.error = 'No se pudo cargar el catálogo de antecedentes.';
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.liberarFoto();
  }

  private liberarFoto(): void {
    if (this.fotoUrl) URL.revokeObjectURL(this.fotoUrl);
    this.fotoUrl = null;
  }

  cargarFoto(): void {
    this.http.get(`${this.api}/me/photo`, {
      headers: this.headers(), responseType: 'blob'
    }).subscribe({
      next: blob => {
        this.liberarFoto();
        this.fotoUrl = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      },
      error: err => {
        this.liberarFoto();
        if (err.status !== 404) this.error = 'No se pudo cargar la foto.';
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
  
    if (!archivo) return;
  
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.error = 'Selecciona una imagen JPG, PNG o WEBP.';
      input.value = '';
      return;
    }
  
    if (archivo.size > 3 * 1024 * 1024) {
      this.error = 'La imagen no puede superar los 3 MB.';
      input.value = '';
      return;
    }
  
    this.error = '';
    this.mensaje = '';
    this.subiendoFoto = true;
  
    const formData = new FormData();
    formData.append('photo', archivo);
  
    this.http.post(
      `${this.api}/me/photo`,
      formData,
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.subiendoFoto = false;
        this.mensaje = 'Foto actualizada correctamente.';
        input.value = '';
  
        // Obtener la foto actualizada desde el backend
        this.cargarFoto();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR SUBIENDO FOTO:', err);
        this.subiendoFoto = false;
        this.error = 'No se pudo subir la foto.';
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }
  
  eliminarFoto(): void {
    this.eliminandoFoto = true;
    this.error = '';
    this.mensaje = '';
  
    this.http.delete(
      `${this.api}/me/photo`,
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.liberarFoto();
        this.eliminandoFoto = false;
        this.mensaje = 'Foto eliminada correctamente.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR ELIMINANDO FOTO:', err);
        this.eliminandoFoto = false;
        this.error = 'No se pudo eliminar la foto.';
        this.cdr.detectChanges();
      }
    });
  }

  get edad(): string {
    if (!this.perfil?.birth_date) return 'Sin registrar';
    const [y, m, d] = this.perfil.birth_date.split('-').map(Number);
    const hoy = new Date();
    let anos = hoy.getFullYear() - y;
    if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) anos--;
    return `${anos} años`;
  }

  private reiniciarFormulario(): void {
    if (!this.perfil) return;
    this.seleccionados = this.perfil.antecedentes.map(a => a.id);
    this.medications = this.perfil.medications.join('\n');
    this.allergies = this.perfil.allergies.join('\n');
    this.hospitalizations = this.perfil.hospitalizations.join('\n');
    this.surgeries = this.perfil.surgeries.join('\n');
    this.weight_kg = this.perfil.weight_kg;
    this.height_cm = this.perfil.height_cm;
  }

  mostrarAntecedentes(): string { return this.perfil?.antecedentes.map(a => a.name).join(', ') || 'Sin información registrada'; }
  tieneAntecedente(id: number): boolean { return this.seleccionados.includes(id); }
  marcarAntecedente(id: number, checked: boolean): void {
    this.seleccionados = checked ? [...this.seleccionados, id] : this.seleccionados.filter(x => x !== id);
  }
  lista(texto: string): string[] { return texto.split('\n').map(s => s.trim()).filter(Boolean); }
  mostrar(lista: string[]): string { return lista.length ? lista.join(', ') : 'Sin información registrada'; }
  editar(): void { this.mensaje = ''; this.editando = true; }
  cancelar(): void { this.reiniciarFormulario(); this.editando = false; this.error = ''; }
  goBack(): void { this.router.navigate(['/app/home']); }

  guardar(): void {
    if (this.guardando) return;
  
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
  
    this.cdr.detectChanges();
  
    const body = {
      antecedente_ids: this.seleccionados,
      medications: this.lista(this.medications),
      allergies: this.lista(this.allergies),
      hospitalizations: this.lista(this.hospitalizations),
      surgeries: this.lista(this.surgeries),
      weight_kg: this.weight_kg,
      height_cm: this.height_cm
    };
  
    this.http.put<PerfilMedico>(
      `${this.api}/me`,
      body,
      { headers: this.headers() }
    )
    .pipe(
      finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (perfilActualizado) => {
        this.perfil = perfilActualizado;
        this.reiniciarFormulario();
  
        this.editando = false;
        this.mensaje = 'Información médica actualizada correctamente.';
  
        this.cdr.detectChanges();
      },
  
      error: (error) => {
        console.error('Error al guardar perfil médico:', error);
  
        this.error =
          error.error?.error ||
          'No se pudieron guardar los cambios. Inténtalo nuevamente.';
  
        this.cdr.detectChanges();
      }
    });
  }
}
