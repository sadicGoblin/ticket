import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrinterService } from '../../services/printer.service';

@Component({
  selector: 'app-printer-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './printer-status.component.html',
  styleUrl: './printer-status.component.scss',
})
export class PrinterStatusComponent implements OnInit, OnDestroy {
  printerStatus: 'unknown' | 'online' | 'offline' = 'unknown';
  showPopup = false;
  retryCountdown = 0;

  @Output() statusChange = new EventEmitter<'unknown' | 'online' | 'offline'>();

  private retryCountdownInterval: any = null;
  private readonly POLL_INTERVAL_S = 10;

  constructor(private printerService: PrinterService) {}

  ngOnInit(): void {
    this.verificarImpresora();
    this.startPollCycle();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private startPollCycle(): void {
    this.clearTimers();
    this.retryCountdown = this.POLL_INTERVAL_S;
    this.retryCountdownInterval = setInterval(() => {
      this.retryCountdown--;
      if (this.retryCountdown <= 0) {
        this.verificarImpresora();
        this.retryCountdown = this.POLL_INTERVAL_S;
      }
    }, 1000);
  }

  private clearTimers(): void {
    if (this.retryCountdownInterval) {
      clearInterval(this.retryCountdownInterval);
      this.retryCountdownInterval = null;
    }
  }

  private verificarImpresora(): void {
    this.printerService.verificarConexion().subscribe({
      next: () => {
        this.printerStatus = 'online';
        this.statusChange.emit(this.printerStatus);
      },
      error: () => {
        this.printerStatus = 'offline';
        this.statusChange.emit(this.printerStatus);
      },
    });
  }

  togglePopup(): void {
    this.showPopup = !this.showPopup;
  }

  closePopup(): void {
    this.showPopup = false;
  }

  conectarAhora(): void {
    this.verificarImpresora();
    this.retryCountdown = this.POLL_INTERVAL_S;
  }
}
