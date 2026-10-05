import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { EmergencyService } from '../../../../services/emergency.service';

interface ResultadoIA {
  prioridad: 'alta' | 'media_alta' | 'media_baja' | 'baja';
  justificacion: string;
  incertidumbre: boolean;
  detalle_incertidumbre: string | null;
}


interface ResultadoTriage {
  ok: boolean;
  id_pretriage: number;
  origen: 'reglas' | 'ia';
  alta_prioridad: boolean;
  accion: 'alerta' | 'resultado_ia';
  resultado: any;
}

@Component({
  selector: 'app-sub-banderas',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './sub-banderas.html',
  styleUrl: './sub-banderas.scss',
})

export class SubBanderas {

  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  // Aquí continúa el resto de tu código...
}