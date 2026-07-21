# Documentación de Despliegue del Aplicativo

**Proyecto:** Sweet Medical  
**Objetivo:** Explicar de manera detallada el procedimiento técnico y arquitectónico para desplegar la aplicación por primera vez, así como el proceso que debe seguirse para publicar nuevas versiones en los entornos de producción.

## Índice
1. [Introducción](#1-introducción)
2. [Arquitectura de la solución](#2-arquitectura-de-la-solución)
3. [Herramientas utilizadas](#3-herramientas-utilizadas)
4. [Despliegue inicial](#4-despliegue-inicial)
   - [4.1 Base de datos (MongoDB Atlas)](#41-base-de-datos-mongodb-atlas)
   - [4.2 Backend (Render)](#42-backend-render)
   - [4.3 Frontend (Railway)](#43-frontend-railway)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Verificaciones posteriores al despliegue](#6-verificaciones-posteriores-al-despliegue)
7. [Publicación de nuevas versiones (Release)](#7-publicación-de-nuevas-versiones-release)
8. [Recuperación ante errores](#8-recuperación-ante-errores)
9. [Conclusiones](#9-conclusiones)

---

## 1. Introducción
El sistema Sweet Medical se encuentra compuesto por una aplicación web (Frontend), una API (Backend) y una base de datos. Estos tres componentes trabajan en conjunto y se encuentran alojados en distintos servicios de nube. El objetivo del despliegue es dejar disponible la aplicación para que cualquier usuario pueda acceder desde Internet sin necesidad de ejecutar el proyecto en un entorno local.

Durante el despliegue se configuran las conexiones entre los tres componentes, de manera que el Frontend pueda comunicarse con el Backend mediante peticiones HTTP, y el Backend pueda almacenar y consultar información de manera persistente en la base de datos.

## 2. Arquitectura de la solución
La arquitectura utilizada es de tres capas (Three-Tier Architecture):

- **Frontend:** Desarrollado con el framework Next.js y desplegado en Railway. Actúa como la interfaz de usuario (UI).
- **Backend:** Desarrollado con Node.js y Express. Se encuentra desplegado en Render y expone todos los servicios RESTful.
- **Base de datos:** MongoDB Atlas (NoSQL) almacena la información de pacientes, médicos, turnos, notificaciones y demás entidades del dominio.

El flujo de información es bidireccional. Cuando un usuario interactúa con la interfaz (por ejemplo, al iniciar sesión), el navegador envía la solicitud al Backend. El Backend procesa la lógica de negocio, valida las credenciales consultando MongoDB Atlas, y devuelve la respuesta al Frontend, el cual actualiza el estado de la pantalla.

## 3. Herramientas utilizadas
- **GitHub:** Almacenamiento del código fuente, control de versiones e integración para despliegue continuo (CI/CD).
- **MongoDB Atlas:** Alojamiento gestionado (DBaaS) de la base de datos en la nube.
- **MongoDB Compass:** Herramienta gráfica local para administrar, importar y visualizar datos.
- **Render:** Plataforma como Servicio (PaaS) utilizada para el alojamiento del Backend.
- **Railway:** Plataforma de infraestructura utilizada para el alojamiento y compilación del Frontend.
- **Node.js:** Entorno de ejecución de JavaScript del lado del servidor.

## 4. Despliegue inicial
El despliegue inicial se realiza una única vez para configurar la infraestructura base. Consiste en preparar la base de datos, publicar el Backend y, finalmente, publicar el Frontend. **Es imperativo respetar este orden**, ya que el Frontend requiere conocer el dominio público del Backend, y el Backend requiere la cadena de conexión de la base de datos para levantar exitosamente.

### 4.1 Base de datos (MongoDB Atlas)
1. Crear una cuenta e iniciar un proyecto en MongoDB Atlas.
2. Desplegar un nuevo Cluster gratuito (M0).
3. Crear la base de datos denominada `gestion_turnos_db`.
4. Crear las colecciones requeridas (medicos, pacientes, turnos, sedes, especialidades, practicas, obrasociales y notificaciones).
5. Importar los datos iniciales semilla utilizando MongoDB Compass.
6. Crear un usuario de base de datos (`Database User`) con permisos de lectura y escritura.
7. Habilitar el acceso desde Internet configurando el **Network Access** con la IP `0.0.0.0/0` (Allow access from anywhere). Esto es estrictamente necesario dado que los servicios PaaS como Render utilizan direcciones IP dinámicas que cambian con cada despliegue.
8. Obtener la cadena de conexión (Connection String / URI), que será utilizada posteriormente por el Backend.

### 4.2 Backend (Render)
1. Crear un nuevo servicio tipo *Web Service* en Render.
2. Vincular el repositorio del Backend alojado en GitHub.
3. Configurar el entorno de ejecución indicando que se trata de una aplicación `Node`.
4. Establecer los comandos del ciclo de vida del aplicativo:
   - *Build Command:* `npm install`
   - *Start Command:* `npm start`
5. Configurar las variables de entorno (*Environment Variables*):
   - `MONGO_URI`: Cadena de conexión obtenida de MongoDB Atlas en el paso anterior.
   - `JWT_SECRET`: Clave alfanumérica segura utilizada para firmar y verificar los tokens de autenticación.
6. Ejecutar el despliegue.
7. Verificar en la consola de Render que el servicio quede en estado *Live*.
8. Comprobar la disponibilidad consultando el endpoint `/healthcheck` y la documentación Swagger (`/api-docs`).
9. **Importante:** Asegurarse de que el middleware de CORS en el código del Backend esté correctamente configurado para permitir peticiones entrantes desde el futuro dominio del Frontend.

### 4.3 Frontend (Railway)
1. Crear un nuevo proyecto en Railway.
2. Vincular el repositorio del Frontend desde GitHub.
3. Railway detectará automáticamente que se trata de una aplicación Next.js y aplicará las configuraciones por defecto. Internamente ejecutará `npm install`, `npm run build` (para generar los archivos estáticos optimizados) y `npm start`.
4. Configurar las variables de entorno necesarias para que el Frontend conozca la ubicación de la API:
   - `NEXT_PUBLIC_API_URL`: Asignar a esta variable el dominio público generado por Render en la sección 4.2.
5. Ejecutar el despliegue.
6. Abrir la URL pública generada por Railway y verificar que la pantalla de inicio de sesión renderice y funcione correctamente.

## 5. Variables de entorno
Las variables de entorno son valores de configuración dinámicos inyectados en tiempo de ejecución. Permiten resguardar datos sensibles (como contraseñas) y facilitar el cambio de entornos (desarrollo, *staging*, producción) sin necesidad de modificar el código fuente.

**Backend (Render):**
- `MONGO_URI`: Cadena de conexión con credenciales hacia MongoDB Atlas.
- `JWT_SECRET`: Clave privada utilizada por la librería JWT para generar tokens.

**Frontend (Railway):**
- `NEXT_PUBLIC_API_URL`: URL pública del Backend utilizada por Axios o Fetch para consumir los endpoints REST. (El prefijo `NEXT_PUBLIC_` expone la variable al navegador).

Estas variables deben configurarse directamente desde los respectivos paneles de control de Render y Railway antes o durante el primer despliegue.

## 6. Verificaciones posteriores al despliegue
Una vez finalizado el proceso completo, se ejecuta una batería de pruebas manuales de humo (*Smoke Testing*):
- El Backend responde estado `200 OK` al endpoint `/healthcheck`.
- La interfaz de Swagger carga correctamente y expone todos los endpoints.
- El Frontend carga sin arrojar errores de red o consola (DevTools).
- Es posible iniciar sesión exitosamente con un usuario válido alojado en Atlas.
- Los componentes que requieren persistencia (turnos, pacientes, notificaciones) leen y escriben datos correctamente.
- Los logs de las consolas de Render y Railway no muestran excepciones no controladas.

## 7. Publicación de nuevas versiones (Release)
Gracias a la integración continua proporcionada por GitHub, Render y Railway, el proceso para liberar mejoras o solucionar *bugs* consta de los siguientes pasos:

1. Realizar los cambios en una rama de desarrollo.
2. Validar el funcionamiento de manera local.
3. Ejecutar la suite de tests disponibles.
4. Realizar un `commit` con una descripción semántica clara.
5. Subir los cambios al repositorio remoto mediante `git push`.
6. Realizar un *Merge* o *Pull Request* hacia la rama productiva (ej: `main` o `rama-deploy-ft`).
7. Los webhooks de Render y Railway detectarán automáticamente el nuevo commit en la rama principal y encolarán un nuevo despliegue.
8. Esperar a que los contenedores se reconstruyan y los servicios finalicen en estado exitoso.
9. Verificar nuevamente la estabilidad general de la aplicación.

Este enfoque automatizado (CI/CD) permite el despliegue ágil sin necesidad de intervenciones manuales en los servidores.

## 8. Recuperación ante errores
Si luego de un despliegue productivo se detecta un fallo crítico (*Breaking Bug*), se procederá a analizar los logs del servicio afectado. Si el error proviene del código introducido recientemente, la estrategia de mitigación será revertir (*revert*) el último commit problemático en GitHub o utilizar la opción de *Rollback* en la plataforma de la nube para restaurar instantáneamente el último contenedor estable. De esta forma, se garantiza la alta disponibilidad del sistema mientras se desarrolla un parche definitivo.

## 9. Conclusiones
La arquitectura descentralizada implementada facilita la escalabilidad y el mantenimiento independiente de cada capa del aplicativo. La utilización combinada de GitHub, MongoDB Atlas, Render y Railway permite automatizar el ciclo de vida del software, reduciendo drásticamente los tiempos de salida a producción (Time-to-Market) y minimizando el riesgo de errores de configuración humana durante la administración del sistema.
