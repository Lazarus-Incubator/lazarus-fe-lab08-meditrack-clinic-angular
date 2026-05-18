# meditrack-angular-lab

MediTrack Clinic es una aplicacion Angular academica para simular la gestion operativa de una clinica ambulatoria ficticia. No es un sistema medico real, no diagnostica pacientes y no debe usarse con datos reales.

El objetivo del laboratorio es analizar el comportamiento del sistema, documentar hallazgos y proponer correcciones en un escenario empresarial con reglas de negocio cruzadas. Se recomienda probar con distintos roles, recorridos no felices, recargas del navegador, filtros persistidos y acciones criticas repetidas.

## Stack

- Angular moderno con standalone components
- TypeScript
- Angular Router con guards funcionales
- Reactive Forms y FormArray
- HttpClient y RxJS
- JSON Server como fake API
- CSS propio responsive
- Pruebas unitarias basicas

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm run api
npm start
```

- Frontend: http://localhost:4200
- Fake API: http://localhost:3000

Tambien puedes levantar ambos procesos con:

```bash
npm run dev
```

## Credenciales

Todas las cuentas usan la contrasena `Admin123*`.

| Rol | Email |
| --- | --- |
| ADMIN | admin@meditrack.pe |
| RECEPCION | recepcion@meditrack.pe |
| ENFERMERIA | enfermeria@meditrack.pe |
| MEDICO | dra.valeria@meditrack.pe |
| MEDICO | dr.rios@meditrack.pe |
| LABORATORIO | laboratorio@meditrack.pe |
| FARMACIA | farmacia@meditrack.pe |
| CAJA | caja@meditrack.pe |
| AUDITOR | auditor@meditrack.pe |

## Roles

- ADMIN: acceso transversal.
- RECEPCION: pacientes, citas y check-in.
- ENFERMERIA: triaje.
- MEDICO: consultas, ordenes de laboratorio y recetas.
- LABORATORIO: resultados de laboratorio.
- FARMACIA: despacho de recetas.
- CAJA: cobros y cierre de atenciones pagadas.
- AUDITOR: lectura de auditoria y vistas limitadas.

## Rutas principales

- `/login`
- `/app/dashboard`
- `/app/appointments`
- `/app/appointments/new`
- `/app/appointments/:id`
- `/app/patients`
- `/app/patients/new`
- `/app/patients/:id`
- `/app/triage`
- `/app/triage/:appointmentId`
- `/app/consultations`
- `/app/consultations/:appointmentId`
- `/app/lab/orders`
- `/app/lab/orders/:id`
- `/app/pharmacy/prescriptions`
- `/app/pharmacy/prescriptions/:id`
- `/app/billing`
- `/app/billing/:appointmentId`
- `/app/audit-log`
- `/app/profile`

## Flujo recomendado

1. Inicia sesion como `recepcion@meditrack.pe`.
2. Crea un paciente.
3. Crea una cita futura.
4. Haz check-in de la cita.
5. Inicia sesion como `enfermeria@meditrack.pe` y registra triaje.
6. Inicia sesion como `dra.valeria@meditrack.pe` o `dr.rios@meditrack.pe` y finaliza consulta.
7. Crea ordenes de laboratorio y una receta desde la consulta.
8. Inicia sesion como `laboratorio@meditrack.pe` y completa el resultado.
9. Inicia sesion como `farmacia@meditrack.pe` y despacha la receta.
10. Inicia sesion como `caja@meditrack.pe`, registra pago y cierra la atencion.
11. Inicia sesion como `auditor@meditrack.pe` y revisa auditoria en modo lectura.

## Comandos utiles

```bash
npm run api
npm start
npm run build
npm test
```

## Nota academica

Este repositorio queda preparado para una segunda fase de laboratorio en la que se podran sembrar bugs de forma controlada. Esta primera version busca ser funcional, coherente y limpia.
