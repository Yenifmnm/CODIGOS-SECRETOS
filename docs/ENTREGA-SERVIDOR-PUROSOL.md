# Entrega para `purosol.com.py`

Esta guía empaqueta el frontend como un contenedor estático. El contenedor no
incluye el backend, credenciales de Avimovil ni secretos de reCAPTCHA.

## 1. Responsabilidades

El frontend contiene únicamente valores públicos incorporados durante el
build:

- `VITE_API_URL`: URL pública del backend.
- `VITE_RECAPTCHA_SITE_KEY`: clave pública del sitio de reCAPTCHA Enterprise.

Estas variables no son configurables en runtime: Vite las incorpora dentro del
JavaScript. Todo cambio exige reconstruir la imagen.

Los siguientes valores pertenecen exclusivamente al backend y nunca deben
aparecer en este repositorio o imagen:

- `AVIMOVIL_SECRET` y credenciales de campaña/ambiente.
- Credenciales privadas de Google Cloud o reCAPTCHA.
- Tokens personales de Figma.

## 2. Requisitos previos del cliente

1. Docker Engine con Docker Compose.
2. DNS de `purosol.com.py` apuntando al servidor.
3. Certificado TLS válido para `purosol.com.py` y, si se publica, `www`.
4. `purosol.com.py` autorizado en la clave de reCAPTCHA Enterprise.
5. El backend debe permitir por CORS el origen exacto
   `https://purosol.com.py` (y `https://www.purosol.com.py` si no se redirige).
6. El backend y Avimovil deben estar validados con un código exclusivo de
   prueba antes de abrir la campaña al público.

## 3. Configuración

En el servidor, desde la raíz del repositorio:

```bash
cp deploy/production.env.example deploy/production.env
```

Completar `deploy/production.env` con los valores públicos entregados por el
responsable del proyecto. El archivo está ignorado por Git.

## 4. Construcción y arranque

```bash
docker compose --env-file deploy/production.env build --pull
docker compose --env-file deploy/production.env up -d
docker compose --env-file deploy/production.env ps
```

El build se detiene si falta `VITE_API_URL` o
`VITE_RECAPTCHA_SITE_KEY`; de ese modo no se publica accidentalmente el mock.

Comprobar el contenedor desde el servidor:

```bash
curl --fail http://127.0.0.1:8080/healthz
```

Debe responder `ok`.

## 5. Publicación HTTPS

El archivo `deploy/purosol.com.py.nginx.example` muestra cómo redirigir `www`
al dominio principal y enviar HTTPS al contenedor. El administrador debe copiar
su contenido a la configuración Nginx del servidor, sustituir las rutas de los
certificados y validar antes de recargar:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Si el cliente utiliza Traefik, Caddy, Kubernetes o un balanceador externo,
debe aplicar la configuración equivalente y apuntar al puerto `8080` del
contenedor.

## 6. Validación antes de habilitar al público

1. Abrir `https://purosol.com.py/` en una ventana privada.
2. Confirmar que no hay recursos 404 ni errores de consola.
3. Confirmar que reCAPTCHA no muestra “dominio no válido”.
4. Realizar un único canje con cédula y código autorizados para pruebas.
5. Verificar en los logs del backend que el POST llegó.
6. Verificar en Avimovil que `Origen` contiene la cédula y `Mensaje` el código.
7. Confirmar que la respuesta contiene un resultado definitivo; para premio,
   debe incluir un ID y nombre reales, no el placeholder
   `[variables!INSTANT_WIN_PRIZE]`.
8. Verificar las pantallas ganadora, perdedora, repetido, inexistente y límite.
9. Revisar desktop y mobile/iPhone sin cambiar sus estilos.

## 7. Actualización y reversión

Antes de cada entrega, cambiar `IMAGE_TAG` por una versión identificable, por
ejemplo el commit aprobado:

```text
IMAGE_TAG=7ac90a6
```

Construir y desplegar nuevamente. Para volver atrás, iniciar la imagen con la
etiqueta anterior que el cliente haya conservado.

## 8. Bloqueos conocidos al preparar esta entrega

La infraestructura queda lista para el dominio final, pero mover el frontend
no corrige problemas del backend o Avimovil. Antes de producción debe estar
resuelto y demostrado:

- el reenvío efectivo backend → Avimovil;
- el ambiente y secreto correctos de Avimovil;
- la sustitución de `INSTANT_WIN_PRIZE` por el ID/nombre del premio;
- el contrato final de respuesta de `/api/codes/redeem`.
