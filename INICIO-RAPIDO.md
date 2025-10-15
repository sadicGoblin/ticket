# ⚡ Inicio Rápido - Sistema de Casino

Guía rápida para poner en funcionamiento el sistema de verificación de RUT y tickets de casino.

## 🚀 Pasos para Iniciar

### 1️⃣ Instalar Dependencias de Angular

```bash
cd angular-base-project
npm install
```

### 2️⃣ Instalar Dependencias de Python (Opcional para impresión)

#### En Windows:
```bash
pip install Flask flask-cors pywin32 Pillow
```

#### En Linux/Mac:
```bash
pip3 install Flask flask-cors python-escpos
```

O usar el archivo requirements.txt:
```bash
pip install -r requirements.txt
```

### 3️⃣ Iniciar el Frontend

```bash
npm start
```

✅ **Angular corriendo en:** http://localhost:4200

### 4️⃣ Iniciar el Plugin de Impresión (Opcional)

En una **nueva terminal**:

```bash
python plugin_impresion.py
```

✅ **Plugin corriendo en:** http://127.0.0.1:8000

## 🧪 Probar el Sistema

1. **Abrir navegador:** http://localhost:4200
2. **Ingresar un RUT de prueba:**
   - `12345678-9` → Juan Pérez (Almuerzo)
   - `98765432-1` → María González (Cena)
   - `11111111-1` → Pedro Rodríguez (Colación)
3. **Presionar Enter o "Verificar Ticket"**
4. **Ver resultado e impresión automática**

## 🔧 Verificar Estado de Impresora

Abrir en navegador: http://127.0.0.1:8000/status

Respuesta esperada:
```json
{
  "status": "online",
  "sistema": "Windows",
  "impresoras_disponibles": ["..."],
  "timestamp": "..."
}
```

## 📋 Checklist de Inicio

- [ ] Node.js instalado (v18 o superior)
- [ ] Python 3.8+ instalado (para impresión)
- [ ] Dependencias de npm instaladas
- [ ] Dependencias de Python instaladas (opcional)
- [ ] Puerto 4200 disponible (Angular)
- [ ] Puerto 8000 disponible (Plugin Python)
- [ ] Navegador actualizado

## ❓ Problemas Comunes

### Angular no inicia
```bash
# Limpiar cache de Angular
rm -rf node_modules .angular
npm install
```

### Plugin Python no conecta
```bash
# Verificar que el puerto 8000 esté libre
# En Windows:
netstat -ano | findstr :8000

# En Linux/Mac:
lsof -i :8000
```

### Error de CORS
- ✅ El plugin ya tiene CORS habilitado
- ✅ Verificar que ambos servicios estén corriendo
- ✅ Usar http://localhost:4200 (no 127.0.0.1)

## 🎯 Siguientes Pasos

1. ✅ **Sistema funcionando** → Ver [CASINO-SYSTEM.md](CASINO-SYSTEM.md)
2. 🔧 **Configurar impresora real** → Editar `plugin_impresion.py`
3. 🌐 **Conectar con API real** → Editar `casino.service.ts`
4. 🎨 **Personalizar diseño** → Modificar archivos `.scss`

## 📞 Soporte

- Ver documentación completa: [README.md](README.md)
- Sistema de casino: [CASINO-SYSTEM.md](CASINO-SYSTEM.md)
- Documentación Angular: https://angular.io/docs
- Flask docs: https://flask.palletsprojects.com/

---

**¡Listo para usar!** 🎉
