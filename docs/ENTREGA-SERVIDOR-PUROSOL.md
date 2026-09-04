# Entrega para `purosol.com.py`

Esta entrega contiene el frontend empaquetado como un contenedor estático y
listo para publicarse en `purosol.com.py`. El frontend ya está configurado para
consumir el backend publicado en `https://promo.edge.com.py/purosol` y para
utilizar la clave pública de reCAPTCHA Enterprise asignada al proyecto.

El cliente no debe esperar ni solicitar otro paquete de backend para desplegar
este contenedor: el backend continúa funcionando como un servicio externo en
la URL indicada. Sus credenciales privadas permanecen correctamente en ese
servidor y no forman parte del frontend.

## 1. Arquitectura de la entrega

El frontend contiene únicamente valores públicos incorporados durante el
build:

- `VITE_API_URL`: `https://promo.edge.com.py/purosol`.
- `VITE_RECAPTCHA_SITE_KEY`: clave pública del sitio de reCAPTCHA Enterprise
  ya suministrada para el proyecto.

Estas variables no son configurables en runtime: Vite las incorpora dentro del
JavaScript. Todo cambio exige reconstruir la imagen.

Los siguientes valores pertenecen exclusivamente al backend y nunca deben
aparecer en este repositorio o imagen:

- `AVIMOVIL_SECRET` y credenciales de campaña/ambiente.
- Credenciales privadas de Google Cloud o reCAPTCHA.
- Tokens personales de Figma.

## 2. Requisitos del servidor del cliente

1. Docker Engine con Docker Compose.
2. DNS de `purosol.com.py` apuntando al servidor.
3. Certificado TLS válido para `purosol.com.py` y, si se publica, `www`.
4. Publicar el contenedor bajo el dominio final `https://purosol.com.py`.

La clave pública de reCAPTCHA y la dirección del backend ya están incluidas en
`deploy/production.env.example`. No es necesario que otro desarrollador le
entregue al cliente un segundo contenedor o repositorio de backend.

## 3. Configuración

En el servidor, desde la raíz del repositorio:

```bash
cp deploy/production.env.example deploy/production.env
```

El archivo copiado ya contiene los valores públicos del proyecto. Está ignorado
por Git para que el servidor pueda ajustar el puerto o la etiqueta de imagen
sin modificar el repositorio.

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
su contenido a la configuración Nginx del servidor, instalar también la
política de cabeceras y sustituir las rutas de los certificados:

```bash
sudo mkdir -p /etc/nginx/snippets
sudo cp deploy/security-headers.conf /etc/nginx/snippets/codigos-secretos-security.conf
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
10. Comprobar las cabeceras públicas con
    `curl -I https://purosol.com.py/`: deben aparecer CSP, HSTS,
    `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y
    `X-Frame-Options`.

La política no usa `includeSubDomains` en HSTS durante esta primera entrega,
para no imponer HTTPS sobre otros subdominios del cliente. Debe probarse primero
en el ambiente de homologación, incluido un canje autorizado, porque la CSP
controla las conexiones necesarias para reCAPTCHA Enterprise y el backend.

## 7. Actualización y reversión

Antes de cada entrega, cambiar `IMAGE_TAG` por una versión identificable, por
ejemplo el commit aprobado:

```text
IMAGE_TAG=7ac90a6
```

Construir y desplegar nuevamente. Para volver atrás, iniciar la imagen con la
etiqueta anterior que el cliente haya conservado.

## 8. Prueba final posterior al despliegue

La entrega no requiere otro paquete de software. Después de publicarla en el
dominio definitivo sólo corresponde ejecutar la validación funcional indicada
en la sección 6. Esa prueba confirma, en el ambiente real, el recorrido ya
integrado: frontend → backend publicado → Avimovil → pantalla de resultado.
