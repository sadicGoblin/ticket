import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class SetupComponent implements OnInit {
  code: string = '';
  loading: boolean = false;
  error: string = '';
  success: boolean = false;
  orgName: string = '';

  /** true cuando viene desde "Cambiar Configuración" y puede cancelar */
  canCancel: boolean = false;

  // On-screen keyboard
  keyboardMode: 'alpha' | 'num' = 'alpha';
  readonly alphaRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];
  readonly numRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  constructor(
    private configService: ConfigService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.canCancel = this.route.snapshot.queryParamMap.get('reconfig') === '1';
  }

  // ── On-screen keyboard ──

  onKey(key: string): void {
    this.code += key;
    this.error = '';
  }

  onBackspace(): void {
    this.code = this.code.slice(0, -1);
  }

  onClear(): void {
    this.code = '';
  }

  toggleKeyboard(): void {
    this.keyboardMode = this.keyboardMode === 'alpha' ? 'num' : 'alpha';
  }

  // ── Actions ──

  cancelar(): void {
    this.router.navigate(['/home']);
  }

  async configurar(): Promise<void> {
    const trimmed = this.code.trim().toUpperCase();
    if (!trimmed) {
      this.error = 'Ingrese un código de organización';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await lastValueFrom(this.configService.loadConfig(trimmed));

      const name = this.configService.orgName;
      if (!name) {
        this.error = 'No se encontró la organización con ese código';
        this.loading = false;
        return;
      }

      this.configService.saveOrgCode(trimmed);
      this.orgName = name;
      this.success = true;
      this.loading = false;

      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    } catch (err: any) {
      const status = err?.status;
      if (status === 404) {
        this.error = 'No se encontró una organización con el código ingresado.';
      } else if (status === 0 || !status) {
        this.error = 'No se pudo conectar con el servidor. Verifique la red.';
      } else {
        this.error = `Error del servidor (${status}). Intente nuevamente.`;
      }
      this.loading = false;
    }
  }
}
