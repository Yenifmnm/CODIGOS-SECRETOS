# Entrega Docker para PuroSol — Turnstile / PR #4

Usar la rama `codex/entrega-purosol` y el commit aprobado de esta entrega.
No desplegar el commit anterior `dcef18d` para esta migración: todavía usa
reCAPTCHA y la ruta V1. El push no actualiza el servidor del cliente.

## Qué incluye

Frontend React/Vite, Nginx sin privilegios en 8080, healthcheck y Compose.
El backend sigue externo en `https://promo.edge.com.py/purosol`.
El canje ahora usa `POST /api/v2/codes/redeem` con `turnstileToken`.
Se conserva el intérprete de `shortMessage/coupons` y
`status/codeCount/prize`, el contador, el catálogo y la sesión del resultado.

La pantalla ganadora muestra, tanto en móvil como en escritorio:

> *GUARDÁ TUS STICKERS GANADORES PARA CANJEAR TU PREMIO*
>
> ¡COMUNICATE AL +595 984 324 335 PARA RETIRARLO!

Las otras pantallas conservan su aviso de seguir participando, sin teléfono.

## Antes de desplegar — obligatorio

1. Solicitar a Edge la **clave pública del widget Turnstile**
   (`VITE_TURNSTILE_SITE_KEY`). La antigua clave de Google no sirve.
2. Edge debe confirmar que el widget autoriza los hostnames efectivamente usados:
   `purosol.com.py`, `www.purosol.com.py` y los dominios de prueba que correspondan.
3. Edge debe tener configurada la clave **secreta** en el backend, la validación
   de Turnstile (acción `redeem_code`) y CORS para los orígenes HTTPS del sitio.
4. Confirmar con Edge que V2 está disponible. No retirar V1 hasta validar esta
   entrega; el rollback anterior depende de V1 y de reCAPTCHA.
5. Conservar la imagen anterior, su configuración y su política CSP para rollback.

No incluir secretos de Turnstile, `AVIMOVIL_SECRET` ni credenciales de Google
en Git, archivos públicos o variables `VITE_*`.

## Configuración en el servidor

Desde la raíz del checkout del commit aprobado:

```bash
test -f deploy/production.env || cp deploy/production.env.example deploy/production.env
```

Editar el archivo existente sin sobrescribir ajustes propios:

```ini
VITE_API_URL=https://promo.edge.com.py/purosol
VITE_TURNSTILE_SITE_KEY=
FRONTEND_PORT=8080
IMAGE_TAG=commit-aprobado
```

Completar la sitekey real y reemplazar `commit-aprobado` por el SHA aprobado.
La plantilla deja la clave vacía intencionalmente: Compose debe detenerse hasta
que se configure. No usar claves de prueba en producción. Quitar
`VITE_RECAPTCHA_SITE_KEY` de este archivo: ya no se consume.

**Vite incorpora estas variables durante el build. Reiniciar no las actualiza.**
No basta con definirlas como variables del contenedor en runtime.

## Construcción y arranque

En el servidor Linux, verificar primero la identidad del checkout:

```bash
git status --short
git rev-parse HEAD
unset VITE_API_URL VITE_TURNSTILE_SITE_KEY FRONTEND_PORT IMAGE_TAG
docker compose --env-file deploy/production.env config
docker compose --env-file deploy/production.env build --pull --no-cache frontend
docker compose --env-file deploy/production.env up -d --no-build --force-recreate frontend
docker compose --env-file deploy/production.env ps
docker compose --env-file deploy/production.env logs --tail=100 frontend
curl --fail http://127.0.0.1:8080/healthz
```

Mantener el nombre de proyecto Compose usado previamente si el operador lo
personalizó. No ejecutar `down` ni eliminar la imagen anterior.
El contenedor escucha sólo en el loopback del servidor. El proxy HTTPS debe
enviar las visitas a ese puerto; si está en otro contenedor/equipo, adaptar la red.

## HTTPS y CSP: actualizar también el proxy exterior

La CSP debe permitir `https://challenges.cloudflare.com` en
`script-src` y `frame-src`. Una CSP antigua en Nginx/Cloudflare puede bloquear
Turnstile aunque el contenedor esté actualizado. Las políticas múltiples se
aplican juntas; agregar una nueva no neutraliza una anterior restrictiva.

Revisar `deploy/purosol.com.py.nginx.example`, certificados y configuración
actual antes de copiar nada. Si el proxy ya utiliza el snippet suministrado:

```bash
sudo cp deploy/security-headers.conf /etc/nginx/snippets/codigos-secretos-security.conf
sudo nginx -t
sudo systemctl reload nginx
```

Recargar sólo si la validación de Nginx fue exitosa. Si hay otro proxy, aplicar
el equivalente sin borrar reglas propias del cliente.

## Validación

Pruebas de regresión locales sin enviar códigos al backend:

```bash
npm ci
npm run typecheck
node --test scripts/test-result-session.mjs scripts/test-pr4-integration.mjs
```

La integración se comprobó con 21 pruebas, build y contenedor local (healthcheck,
Nginx sin privilegios y CSP). Para la imagen de prueba se usaron una URL ficticia
y una clave pública de prueba: **esa imagen no es para producción**. Debe
reconstruirse con la URL real y la sitekey del proyecto.
Persisten el warning CSS previo y avisos de auditoría de dependencias existentes;
no se modificó el lockfile en esta integración. No hay script de lint configurado.

- Healthcheck `ok` confirma Nginx, no el canje ni Avimovil.
- Abrir el sitio con una sesión nueva: sin avisos de Google, errores de CSP
  ni hostname de Turnstile no autorizado.
- El widget puede pedir una interacción; no es garantía de invisibilidad.
- Con datos autorizados exclusivamente para pruebas, comprobar en Network el
  POST a V2, el token presente (sin compartirlo) y el resultado del backend.
- Sin token no debe enviarse el canje. Un 403 muestra el aviso de seguridad.
- Verificar ganador, participación, inexistente, repetido y límite, contador
  incluido. Una respuesta desconocida no debe inventar un premio.
- El ganador conserva premio y contador al recargar dentro de la misma pestaña;
  abrir `#/ganaste` sin resultado debe volver a Participar.
- Confirmar el aviso exacto de ganador y que las demás pantallas no cambiaron.
- Probar escritorio y móvil/iPhone. No consumir códigos de participantes.

## Rollback

Volver a la imagen anterior **sin reconstruirla**, con su configuración de
Compose compatible, y restaurar la CSP anterior si vuelve a reCAPTCHA.
Coordinar con Edge: el frontend anterior requiere V1 activa.
No se considera validado el circuito real hasta completar una prueba controlada
contra Edge/Avimovil en el dominio final.
