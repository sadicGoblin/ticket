# 🚀 Proyecto Base de Angular

Proyecto base de Angular 17.3 con todas las dependencias y configuraciones necesarias, listo para desarrollar aplicaciones modernas.

## 🍽️ Sistema de Casino Incluido

Este proyecto incluye un **sistema completo de verificación de RUT e impresión de tickets de casino** listo para usar. Ver [CASINO-SYSTEM.md](CASINO-SYSTEM.md) para documentación completa.

## 📋 Características

- ✅ **Angular 17.3** - Última versión con standalone components
- 🎨 **SCSS** - Sistema de estilos preconfigurado
- 🌐 **HttpClient** - Configurado para consumir APIs REST
- 🛣️ **Router** - Sistema de rutas con lazy loading
- 📦 **RxJS** - Programación reactiva
- 🧪 **Testing** - Karma y Jasmine configurados
- 🔧 **TypeScript 5.4** - Strict mode habilitado
- 📱 **Responsive** - Diseño adaptable por defecto
- 🖨️ **Sistema de Impresión** - Plugin Python para impresoras térmicas
- 🍽️ **Verificación de RUT** - Sistema de casino completo

## 📦 Dependencias Incluidas

### Producción
- `@angular/animations` ^17.3.0
- `@angular/common` ^17.3.0
- `@angular/compiler` ^17.3.0
- `@angular/core` ^17.3.0
- `@angular/forms` ^17.3.0
- `@angular/platform-browser` ^17.3.0
- `@angular/platform-browser-dynamic` ^17.3.0
- `@angular/router` ^17.3.0
- `rxjs` ~7.8.0
- `tslib` ^2.3.0
- `zone.js` ~0.14.3

### Desarrollo
- `@angular-devkit/build-angular` ^17.3.16
- `@angular/cli` ^17.3.16
- `@angular/compiler-cli` ^17.3.0
- `@types/jasmine` ~5.1.0
- `jasmine-core` ~5.1.0
- `karma` ~6.4.0
- `karma-chrome-launcher` ~3.2.0
- `karma-coverage` ~2.2.0
- `karma-jasmine` ~5.1.0
- `karma-jasmine-html-reporter` ~2.1.0
- `typescript` ~5.4.2

## 🚀 Instalación

### Frontend (Angular)

```bash
# Navegar a la carpeta del proyecto
cd angular-base-project

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

### Backend (Plugin de Impresión - Opcional)

```bash
# Instalar dependencias de Python
pip install -r requirements.txt

# Iniciar servidor de impresión
python plugin_impresion.py
```

La aplicación estará disponible en: **http://localhost:4200**  
El plugin de impresión en: **http://127.0.0.1:8000**

## 💻 Comandos Disponibles

```bash
# Iniciar servidor de desarrollo (http://localhost:4200)
npm start

# Build de producción
npm run build

# Build en modo watch (desarrollo)
npm run watch

# Ejecutar tests
npm test

# Comando ng directo
npm run ng -- [comando]
```

## 📁 Estructura del Proyecto

```
angular-base-project/
├── src/
│   ├── app/
│   │   ├── components/          # Componentes reutilizables
│   │   ├── pages/               # Páginas/vistas
│   │   │   ├── home/            # Página de inicio
│   │   │   └── rut-verification/ # Verificación de RUT (Casino)
│   │   ├── services/            # Servicios
│   │   │   ├── printer.service.ts    # Impresión de tickets
│   │   │   └── casino.service.ts     # Verificación de casino
│   │   ├── models/              # Interfaces y tipos
│   │   ├── app.component.ts     # Componente raíz
│   │   ├── app.config.ts        # Configuración de la app
│   │   └── app.routes.ts        # Rutas de la aplicación
│   ├── assets/                  # Recursos estáticos
│   ├── environments/            # Variables de entorno
│   ├── index.html               # HTML principal
│   ├── main.ts                  # Punto de entrada
│   └── styles.scss              # Estilos globales
├── plugin_impresion.py          # Servidor Python para impresión
├── requirements.txt             # Dependencias Python
├── angular.json                 # Configuración de Angular CLI
├── package.json                 # Dependencias del proyecto
├── tsconfig.json                # Configuración de TypeScript
├── CASINO-SYSTEM.md             # Documentación del sistema de casino
└── README.md                    # Este archivo
```

## 🎨 Sistema de Estilos

El proyecto incluye variables CSS personalizables en `src/styles.scss`:

```scss
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
}
```

### Fuentes
- **Poppins** - Fuente principal del proyecto (Google Fonts)

## 🔧 Configuración de TypeScript

El proyecto está configurado con TypeScript en modo estricto:
- ✅ `strict: true`
- ✅ `noImplicitOverride: true`
- ✅ `noImplicitReturns: true`
- ✅ `noFallthroughCasesInSwitch: true`

## 🌐 Consumir APIs

Ejemplo de servicio para consumir APIs:

```typescript
// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/data`);
  }
}
```

## 🛣️ Crear Nuevas Rutas

1. Crear el componente:
```bash
npm run ng -- generate component pages/mi-pagina
```

2. Agregar ruta en `app.routes.ts`:
```typescript
{
  path: 'mi-pagina',
  loadComponent: () => import('./pages/mi-pagina/mi-pagina.component')
    .then(m => m.MiPaginaComponent)
}
```

## 🧩 Crear Componentes

```bash
# Componente standalone
npm run ng -- generate component components/mi-componente --standalone

# Servicio
npm run ng -- generate service services/mi-servicio

# Interface/Modelo
npm run ng -- generate interface models/mi-modelo
```

## 📝 Buenas Prácticas Incluidas

1. **Standalone Components** - Arquitectura moderna sin módulos
2. **Lazy Loading** - Carga perezosa de rutas
3. **HttpClient** - Ya configurado para APIs REST
4. **Environments** - Separación de entornos (dev/prod)
5. **SCSS** - Variables CSS y estilos organizados
6. **TypeScript Strict** - Código más seguro y mantenible
7. **Git** - `.gitignore` configurado

## 🍽️ Sistema de Casino

El proyecto incluye un sistema completo de verificación de RUT y tickets de casino:

### Características:
- ✅ Verificación de RUT con validación de dígito verificador
- ✅ Formateo automático de RUT mientras se escribe
- ✅ Impresión automática de tickets en impresoras térmicas
- ✅ Base de datos simulada con RUTs de prueba
- ✅ Estado en tiempo real de la conexión con impresora
- ✅ Plugin Python compatible con Windows/Linux/Mac

### RUTs de Prueba:
- **12345678-9** - Juan Pérez García (Almuerzo) ✅
- **98765432-1** - María González López (Cena) ✅
- **11111111-1** - Pedro Rodríguez (Colación) ✅
- **22222222-2** - Ana Martínez (Sin ticket) ❌

Ver [CASINO-SYSTEM.md](CASINO-SYSTEM.md) para documentación completa.

## 🌟 Próximos Pasos

1. **Probar sistema de casino** → Ir a http://localhost:4200
2. **Iniciar plugin de impresión** → `python plugin_impresion.py`
3. **Personalizar estilos** en `src/styles.scss`
4. **Configurar API URL** en `src/environments/environment.ts`
5. **Crear servicios** en `src/app/services/`
6. **Crear componentes** en `src/app/components/`
7. **Agregar páginas** en `src/app/pages/`

## 📚 Recursos

- [Documentación de Angular](https://angular.io/docs)
- [Angular CLI](https://angular.io/cli)
- [RxJS](https://rxjs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## 🤝 Basado en

Este proyecto base fue creado tomando como referencia el proyecto **totem** con todas sus configuraciones y mejores prácticas.

---

**¡Feliz desarrollo! 🚀**
