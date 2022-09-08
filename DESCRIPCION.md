**SOM Simulador - Analisis**

A continuación, la arquitectura básica a implementar en el simulador:

image.png

## Objetivo: 

El objetivo del simulador es dar información a un usuario que desea realizar una instalación fotovoltaica de uso individual para que pueda decidir lo mas objetivamente posible sobre las ventajas energéticas y económicas que puede obtener de la misma.

## Requisitos

Básicamente existen dos variables de entrada que determinan el comportamiento de todo el sistema:

1. Localización donde se realizaría la instalación: a partir de las coordenadas geográficas de la instalación y, si fuera posible, las orientaciones vertical y horizontal de las placas podemos disponer de una estimación bastante confiable del rendimiento energético a obtener en función de la época del año y las horas del día.

1. Caracteristicas del consumo que se espera tener en la instalación: en este caso intentaremos obtener la información individualizada del promotor y si no fuera el caso se asignará un perfil tipo según REE ponderado por el consumo anual registrado en la última factura.

## Proceso
Con estos dos elementos de entrada se realiza una propuesta inicial de placas a instalar y se dará toda la información necesaria en cuanto a balance energético y económico de la instalación.

Independientemente de la propuesta original el usuario podrá cambiar la configuración de la instalación y ver como cambian los resultados en tiempo real.

## Características
El simulador puede funcionar en varios idiomas. Por ahora español-castellano (es), ingles (en), catalán (ca) y galego (ga). La interfaz de usuario que aparece al iniciar la sesión es la última que se hubiera utilizado, en caso de no existir una sesión previa es la del navegador o la que se indique con el argumento lng=XX en la url de activación.

## Componentes
### Módulo de carga de consumos:

El objetivo es completar la matriz horaria de consumos para un periodo no inferior a 365 días.

![](RackMultipart20220907-1-666xrx_html_8c24437ae5088c51.png)

- El usuario es responsable de obtener el fichero de consumo horario de un periodo temporal de al menos un año conectándose al servicio que proveen las empresas distribuidoras. Los enlaces están disponibles en la pestaña proyecto.

- La aplicación está preparada para procesar las cabeceras del fichero CSV descargado de la distribuidora o cualquier fichero CSV con campos separados por punto y coma ';' y separador decimal coma ',' siempre y cuando tenga en su cabecera los siguientes campos:

  - Fecha: en formato dd/mm/aaaa
  - Hora: en formato entero con valores entre 0 y 23
  - Consumo: en kWh

- La aplicación tiene en cuenta que los ficheros de las distribuidoras tienen la particularidad que el nombre de la columna correspondiente al consumo varía según:

  - Fecha: en formato dd/mm/aaaa
  - i-DE: Consumo Kwh
  - e-distribucion: AE\_kWh
  - UFD – Naturgy: Consumo
  - E-REDES: ¿?
  - Viesgo: ¿?
  
- El número de registros mínimos que se esperan es de 8760, si no los hubiera se da un aviso dando al usuario la opción de continuar si lo desea.

- Como la fecha inicio y final pueden no coincidir con el ciclo anual natural se cmpletan los datos utilizando todos los registros basándose en la fecha independientemente del año. Es decir todas las fechas se convierten a un índice 1-365.

- No se gestiona los años bisiestos, el 29 de febrero, si estuviera en los datos de entrada se ignora.

- En caso de que para una fecha y hora hubiera más de un dato se registrará el promedio de los datos provistos.

- El resultado de la carga es una matriz de 365 filas de objetos:

Ci = {día, mes, suma, máximo, consumo [0:23]} con índice i variando de 0 a 364

- La carga se inicia una vez seleccionado el fichero CSV

- En caso de que el usuario no disponga de un fichero CSV con su registro horario individualizado se podrá hacer una carga basándose en el perfil tipo definido por REE que para este año es: [Perfiles\_iniciales\_de\_consumo\_y\_demanda\_de\_referencia\_2022.xlsx (live.com)](https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fwww.ree.es%2Fsites%2Fdefault%2Ffiles%2F01_ACTIVIDADES%2FDocumentos%2FDocumentacion-Simel%2FPerfiles_iniciales_de_consumo_y_demanda_de_referencia_2022.xlsx&wdOrigin=BROWSELINK)

- Este perfil esta basado en un consumo de 1kWh por lo que se multiplican todos los valores por el consumo anual en kWh que figura en la última factura o según el criterio que indique el usuario para la instalación.

- REE ofrece perfiles de consumo anual para usuarios según la tarifa contratada por lo que el perfil que se cargará es el que corresponda a la tarifa que este seleccionada en pantalla seleccionada.

- La interfaz de usuario de este módulo es:

![](RackMultipart20220907-1-666xrx_html_2e9f7bcc73a8b0d1.png)

## Modulo de carga de rendimientos

El rendimiento de la placa solar en cuanto a la energía producida en cada momento se obtiene de la fuente de datos PVGIS de la UE. (https://joint-research-centre.ec.europa.eu/pvgis-photovoltaic-geographical-information-system\_en)

![](RackMultipart20220907-1-666xrx_html_57335a6aa309b59a.png)

- Mediante la utilización de un API documentado en ([https://joint-research-centre.ec.europa.eu/pvgis-photovoltaic-geographical-information-system/getting-started-pvgis/api-non-interactive-service\_en](https://joint-research-centre.ec.europa.eu/pvgis-photovoltaic-geographical-information-system/getting-started-pvgis/api-non-interactive-service_en)) podemos solicitar el rendimiento estimado de una instalación fotovoltaica en un punto definido por su latitud y longitud geográfica, el azimut (ángulo de orientación de las placas con respecto al sur y el ángulo de inclinación de la placa con respecto a la plano horizontal.

- Para realizar la llamada se cuenta con un mapa que permite localizar con exactitud las coordenadas donde se instalarán las placas dando un primer punto sobre el mapa.

- En caso de conocer la orientación del tejado respecto al sur se puede dar un segundo punto que se tomará como azimut. Si se desconoce se puede marcar la opción <Optimo> dejando que PVGIS devuelva ese valor. 

- La inclinación siempre debe ser ingresada por el usuario o dejar la opción de <Optimo> para que PVGIS la determine en función de la latitud.

Suponiendo que el usuario ha definido los tres valores la llamada a PVGIS sería:

https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat=%3CLATITUD%3E&lon=%3CLONGITUD%3E&pvcalculation=1&peakpower=1&loss=14&outputformat=json&angle=ORIENTACION&aspect=AZIMUT

donde:

- peakpower = 1 es para solicitar la producción estimada de una instalación de 1KWp

- loss= 14 es una perdida técnica en % de la instalación (se podrá cambiar desde la pestaña de parámetros)

- pvcalculation=1 es un parámetro que indica a PVGIS que deseamos obtener el dato de la potencia suministrada en cada momento.

En caso de que el usuario no indique azimut ni orientación la llamada será:

https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat=LATITUD&lon=LONGITUD&pvcalculation=1&peakpower=1&loss=14&outputformat=json&optimalangles=1

- La respuesta a esta solicitud es un fichero en formato JSON que contiene la producción estimada en cada hora de cada día del año desde la fecha original de datos disponible en PVGIS (1 de enero de 2005 hasta 31 de diciembre de 2020 -> 140260 registros).

- La carga comienza al seleccionar el botón \<Calcular\> de la pestaña \<Proyecto\>

- Por temas de seguridad (CORS) el servidor PVGIS no permite llamadas directas desde código javascript ejecutado en el browser por lo que se ha desarrollado un proxi (php) que nos permita hacer la llamada desde el servidor. 

- El resultado de la carga es una matriz de 365 filas de objetos:

Ri = {día, mes, suma, máximo, rendimiento [0:23]} con índice i variando de 0 a 364

Donde cada valor rendimiento es el resultado del promedio de los últimos 16 años dado por PVGIS para ese día y hora.

## Bucle de optimización inicial:

Una vez cargados los consumos y el rendimiento unitario podemos empezar el proceso de bucle inicial de optimización.

![](RackMultipart20220907-1-666xrx_html_9d8636647a263850.png)

- La idea es poder definir una instalación que cumpla con el objetivo de alcanzar un autoconsumo del 50% para lo que el sistema propone una configuración inicial de paneles que cubra el consumo diario máximo de los datos de consumo cargados, después del bucle inicial de calculo de producción y balance donde se obtiene la primera valoración del autoconsumo, se aplica una corrección lineal, en cuanto al número de paneles, que permitirá acercarse al 50% buscado pasando a ser esta la propuesta inicial mostrada en los resultados.