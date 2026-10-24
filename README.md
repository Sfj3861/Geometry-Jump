# Geometry Jump

Recreación fan-made y de código abierto de un plataformas rítmico para Android, construido con Canvas, JavaScript y un contenedor Android WebView.

## Campaña

La campaña principal tiene **17 niveles progresivos** y conserva los **3 niveles originales como desafíos extra** (20 niveles en total):

1. **Niveles 1–5 — estilo 1.0:** cubo, bloques, pinchos y huecos.
2. **Niveles 6–7 — espejo:** portales que reflejan horizontalmente la escena.
3. **Niveles 8–10 — ball:** modo bola con cambio de gravedad al tocar.
4. **Niveles 11–12 — azul:** pads y orbes azules.
5. **Niveles 13–17 — tamaño y rosa:** portales mini/grande, orbes rosas y pads rosas.
6. **Desafíos extra:** los tres niveles originales con secciones mixtas.

## Interfaz y controles

- Logo geométrico original de Geometry Jump y favicon SVG.
- Menús compactos con botones en relieve, contornos oscuros y menos efectos de neón.
- Diseño de los iconos de cubo y bola inspirado en la estética geométrica clásica, sin reutilizar los recursos gráficos originales.
- La interfaz toma como referencia la evolución de Geometry Dash 1.0–1.5: siete niveles iniciales en 1.0; espejo en 1.1; bola en 1.2; orbes y pads azules en 1.3; nuevas naves y decoración en 1.4; UFO, orbes y pads rosas y mejoras del editor en 1.5. Fuentes: [historial de versiones](https://geometrydash.wiki.gg/es/wiki/Actualizaciones) y [actualización 1.5](https://geometrydash.wiki.gg/es/wiki/Actualización_1.5).

## Controles

- Tocar la pantalla, hacer clic o pulsar **Espacio / ↑ / W** para saltar. Los eventos de teclado evitan el desplazamiento de la página y se limpian al perder el foco.
- En modo bola, tocar/pulsar alterna la gravedad.
- **P** pausa, **Esc** vuelve al menú, **M** silencia el audio y **F** activa pantalla completa.
- El modo práctica guarda checkpoints temporales.

## Compilar

El repositorio incluye workflows de GitHub Actions para compilar la APK de Android y publicar una release. Consulta [Actions](https://github.com/Sfj3861/Geometry-Jump/actions) y [Releases](https://github.com/Sfj3861/Geometry-Jump/releases). La nueva versión de trabajo es **v0.4.0**.

## Créditos y licencias

Consulta `THIRD_PARTY_NOTICES.md` y `app/src/main/assets/OPEN_SOURCE_LICENSE.txt` para las licencias y atribuciones del código y de la música. Geometry Jump es un proyecto fan-made y no está afiliado a RobTop Games.
