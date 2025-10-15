import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductoTicket {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface DatosTicket {
  productos: ProductoTicket[];
  total?: number;
  nombreImpresora?: string;
  numeroPedido?: string;
  rut?: string;
  nombreCliente?: string;
}

export interface RespuestaImpresion {
  resultado: 'ok' | 'error';
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrinterService {
  private readonly PRINTER_URL = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  /**
   * Envía los datos del pedido al plugin de impresión
   * @param productos Lista de productos del carrito
   * @param nombreImpresora Nombre de la impresora (opcional, usa la por defecto si no se especifica)
   * @param numeroPedido Número del pedido (opcional)
   * @param rut RUT del cliente (opcional)
   * @param nombreCliente Nombre del cliente (opcional)
   * @returns Observable con la respuesta del servidor de impresión
   */
  imprimirTicket(
    productos: ProductoTicket[], 
    nombreImpresora?: string, 
    numeroPedido?: string,
    rut?: string,
    nombreCliente?: string
  ): Observable<RespuestaImpresion> {
    const datosTicket: DatosTicket = {
      productos: productos,
      nombreImpresora: nombreImpresora,
      numeroPedido: numeroPedido,
      rut: rut,
      nombreCliente: nombreCliente
    };

    return this.http.post<RespuestaImpresion>(`${this.PRINTER_URL}/imprimir`, datosTicket);
  }

  /**
   * Verifica si el servicio de impresión está disponible
   * @returns Observable<any>
   */
  verificarConexion(): Observable<any> {
    return this.http.get(`${this.PRINTER_URL}/status`);
  }

  /**
   * Imprime un ticket de casino para comida
   * @param rut RUT del empleado
   * @param nombreCliente Nombre del empleado
   * @param tipoComida Tipo de comida (almuerzo, cena, etc.)
   * @returns Observable con la respuesta del servidor de impresión
   */
  imprimirTicketCasino(rut: string, nombreCliente: string, tipoComida: string): Observable<RespuestaImpresion> {
    const datosTicket: DatosTicket = {
      productos: [{
        nombre: `Ticket de ${tipoComida}`,
        cantidad: 1,
        precio: 0
      }],
      rut: rut,
      nombreCliente: nombreCliente,
      numeroPedido: new Date().getTime().toString()
    };

    return this.http.post<RespuestaImpresion>(`${this.PRINTER_URL}/imprimir-casino`, datosTicket);
  }
}
