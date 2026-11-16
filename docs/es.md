# Calendario de siembra

## Presentación

Un calendario de siembra para su huerto en Gladys: cuándo sembrar en semillero, sembrar directamente, plantar y cosechar cada cultivo, con fechas adaptadas a su clima. Todo se calcula en la propia integración: sin cuenta, sin clave, sin conexión.

- **55 cultivos**: 43 hortalizas (tomate, zanahoria, puerro, col, fresa…) y 12 aromáticas (albahaca, perejil, cebollino, tomillo…). Marque los de su huerto.
- **Fechas para su clima**: una zona climática (mediterránea, oceánica templada, templada, continental, montaña), un ajuste fino en semanas y el hemisferio sur.
- **Opcionalmente, la luna**: los días del calendario lunar del huerto (método Maria Thun) adecuados para cada cultivo, días de raíz para las zanahorias, días de fruto para los tomates…

Obtiene un calendario en **Mis calendarios**, dos widgets de panel, tres disparadores de escena y una acción de escena.

![Los widgets En el huerto y Cultivo el viernes 9 de abril de 2027, con la opción lunar (ilustración generada, no una captura de pantalla)](https://raw.githubusercontent.com/William-De71/gladys-sowing-calendar/main/docs/assets/widgets.es.png)

## Requisitos

- Gladys Assistant 5.3.0 o posterior.
- La zona horaria correcta en Gladys (Ajustes → Sistema): los días cambian a medianoche en esta zona.

## Configuración

1. Instale la integración desde **Integraciones** (Sowing calendar).
2. Marque los cultivos de su huerto y elija su zona climática.
3. En **Mis calendarios**, haga clic en **Activar para mí**: el «Calendario de siembra» aparece entre sus calendarios. Para usarlo en escenas, ábralo en **Calendarios** y compártalo con el hogar.

| Campo                              | Por defecto         | Efecto                                                                                                               |
| ---------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Cultivos del huerto                | 16 cultivos comunes | El calendario, los widgets y las escenas siguen estos cultivos.                                                      |
| Zona climática                     | Templada            | Desplaza las fechas de referencia (ver más abajo).                                                                   |
| Ajuste fino (semanas)              | 0                   | Semanas añadidas a todas las fechas, −4 a 4: positivo para una zona de heladas, negativo para un huerto resguardado. |
| Hemisferio                         | Norte               | Sur: todas las fechas seis meses después.                                                                            |
| Tareas en el calendario            | las cuatro          | Siembra en semillero, siembra directa, plantación, cosecha. Los widgets y las escenas muestran siempre todo.         |
| Días lunares favorables            | no                  | Añade los días de la luna adecuados para cada cultivo (calculado localmente, un segundo por año).                    |
| Hora de los disparadores de escena | 7                   | Los disparadores se inician cada día a esta hora (0 a 23).                                                           |
| Idioma de los textos               | Automático          | Textos de escenas y estado. El calendario sigue siempre el idioma de cada usuario.                                   |

Las fechas de referencia son las de un clima templado: mitad norte de Francia, Bélgica, meseta suiza, sur de Alemania. Una zona más cálida adelanta la primavera y alarga el otoño, una más fría lo contrario: una fecha hasta el 15 de julio sigue el desplazamiento de primavera, una posterior el de otoño.

| Zona              | Primavera            | Otoño                |
| ----------------- | -------------------- | -------------------- |
| Mediterránea      | 3 semanas antes      | 3 semanas después    |
| Oceánica templada | 1 semana antes       | 2 semanas después    |
| Templada          | fechas de referencia | fechas de referencia |
| Continental       | 1 semana después     | 1 semana antes       |
| Montaña           | 3 semanas después    | 3 semanas antes      |

## Uso

### Calendario

- «Siembra en semillero: Tomate» del 16 de febrero al 15 de abril: un evento de día completo por cultivo y tarea, durante todo su periodo, con las fechas, la zona, el consejo de la tarea y, con la opción lunar, los días favorables del periodo en su descripción.
- Con todos los cultivos y todas las tareas, unos 190 periodos al año: desmarque tareas (la cosecha, por ejemplo) para un calendario más ligero.

El calendario cubre la semana pasada y el año siguiente. Avanza cada noche. Una nueva zona mueve los eventos, sin duplicarlos.

### Widgets

- **En el huerto**: una tarjeta por tarea en curso (los cultivos; hasta cuándo al tocar la tarjeta), lo que empieza en la semana y lo que entra en su última semana. Con la opción lunar, el tipo de día como título y los cultivos que favorece.
- **Cultivo** (ajuste «Cultivo»): cada tarea de un cultivo con sus fechas, en verde mientras está en curso, y con la opción lunar sus próximos días favorables.

### Escenas

Disparadores, cada día a la hora de la configuración:

- **Resumen del día**: lo que hay que hacer en el huerto. Filtros: empieza un periodo o no, el tipo de día lunar. Variables: los mismos valores que la acción de abajo, salvo `has_opening`.
- **Empieza un periodo**: el primer día del periodo de un cultivo y una tarea. Filtros: las tareas, los cultivos. Variables: `crop`, `crop_label`, `task` (sow_indoors, sow_outdoors, plant_out, harvest), `task_label`, `start`, `end`, `end_label`, `lunar_days`, `summary`.
- **Última semana de un periodo**: siete días antes del final de un periodo de dos semanas o más. Mismos filtros y variables.

Acción **Obtener las tareas del huerto** (hoy o mañana): `date`, `sow_indoors`, `sow_outdoors`, `plant_out`, `harvest` (los cultivos de cada tarea), `task_count`, `opening`, `has_opening` (yes, no), `closing`, `day_type` (fruit, root, flower, leaf), `day_type_label`, `avoid` (yes, no), `favourable`, `summary`.

Ejemplos:

- «Empieza un periodo», filtro tarea = siembra en semillero → enviar «{{triggerEvent.data.summary}}»: «Siembra en semillero, Tomate: desde hoy hasta el 15 abr»
- «Última semana de un periodo», filtro cultivo = ajo → recordatorio «Última semana para plantar el ajo».
- Cada domingo a las 9:00 (escena programada) → «Obtener las tareas del huerto» → enviar su salida «Resumen» en un mensaje.

### Transporte

Solo local: todo se calcula en el contenedor, nada sale de su red. El catálogo muestra la insignia «local».

## Cómo se calcula

- La tabla de cultivos da, por quincena, los periodos habituales de los calendarios de huerto franceses para un clima templado. Son orientaciones: el tiempo del año, la variedad y la exposición cuentan igual.
- Cada fecha se desplaza según la zona (primavera u otoño) y luego según el ajuste fino; el hemisferio sur añade seis meses. Un periodo conserva al menos una semana.
- La opción lunar usa el cálculo de la integración «Lunar gardening calendar»: el tipo de un día es el tipo más largo del día (constelación de la luna), sin los días desfavorables (perigeo, apogeo, nodo lunar, eclipse). Comprobado día a día con el calendario 2026 publicado por icalendrier.fr.

## Solución de problemas

- **No hay calendario**: haga clic en **Activar para mí** en **Mis calendarios** en la página de la integración. Un calendario no compartido no aparece en las escenas: compártalo con el hogar.
- **Las fechas no encajan con su huerto**: cambie de zona o use el ajuste fino, que se aplica a todas las fechas. Un cultivo parece erróneo: abra una issue con el cultivo, la tarea y las fechas que espera.
- **El resumen del día no se inicia**: se inicia una vez al día, a la hora configurada o en el primer minuto siguiente. No se vuelve a iniciar tras un reinicio el mismo día.
- Registros: la pestaña **Registros** de la integración. En modo desarrollador, `DEBUG=gladys-integration-sdk` añade los registros del SDK.
