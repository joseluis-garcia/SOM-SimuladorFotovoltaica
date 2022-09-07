import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";
/*
 Rendimiento es la clase responsable de obtener la información de PVGIS.
 La matriz diaHora contiene la potencia generada por un placa de 1kWp con las caracteristicas definidas por
 su latitud, longitud, azimut respecto al sur e inclinacion de las placas con la horizontal
 Adicionalmente completa los datos de la instalación que se han utilizado desde PVGIS.
*/

export default class Rendimiento {
  constructor(lon, lat, inclinacion, azimut) {
    //Lamentablemente no se puede llamar una funcion asincrona desde el constructor de clase por lo que se debe llamar desde la instancia ya creada.
    //En este caso despues de crear un nuevo rendimiento se debe llamar await loadPVGISdata().

    // Inicializa la tabla indice de acceso
    this.idxTable = Array(365);
    for (let i = 0; i < 365; i++) {
      this.idxTable[i] = { previos: 0, dia: i, mes: 0, suma: 0, maximo: 0 };
    }
    this.diaHora = Array.from(Array(365), () => new Array(24).fill(0));
    this.fechaInicio = new Date(1, 1, 1900);
    this.fechaFin = new Date(1, 1, 1900);
    this.lon = lon;
    this.lat = lat;
    this.inclinacion = inclinacion;
    this.azimut = azimut;

    // Datos provenientes de PVGIS
    this.radiation_db;
    this.meteo_db;
    this.year_min;
    this.year_max;
  }

  async loadPVGISdata() {
    var addurl;
    if (this.inclinacion == "Optimo") {
      addurl = "&optimalinclination=1";
    } else {
      addurl = "&angle=" + this.inclinacion;
    }

    if (this.azimut == "Optimo") {
      addurl += "&aspect=0";
    } else {
      addurl += "&aspect=" + this.azimut;
    }

    if (this.azimut === "Optimo" && this.inclinacion === "Optimo") {
      addurl = "&optimalangles=1";
    }

    if (TCB.parametros.perdidasSistema != 0) {
      addurl += "&loss=" + TCB.parametros.perdidasSistema;
    }

    let url =
      TCB.basePath +
      "proxy PVGIS.php?lat=" +
      this.lat +
      "&lon=" +
      this.lon +
      addurl;

    UTIL.debugLog("PVGIS url:" + url);

    try {
      const respuesta = await fetch(url);
      if (respuesta.status === 200) {
        var PVGISdata = await respuesta.json();

        var unDia = { dia: 0, mes: 0, valores: Array(24).fill(0) };
        let i = 0;
        var hora;
        var lastFecha = new Date(1970, 1, 1);

        TCB.instalacion.system_loss = PVGISdata.inputs.pv_module.system_loss;
        TCB.instalacion.technology = PVGISdata.inputs.pv_module.technology;
        TCB.instalacion.inclinacion = PVGISdata.inputs.mounting_system.fixed.slope.value;
        TCB.instalacion.inclinacionOptimal = PVGISdata.inputs.mounting_system.fixed.slope.optimal;
        TCB.instalacion.azimut = PVGISdata.inputs.mounting_system.fixed.azimuth.value;
        TCB.instalacion.azimutOptimal = PVGISdata.inputs.mounting_system.fixed.azimuth.optimal;
        this.radiation_db = PVGISdata.inputs.meteo_data.radiation_db;
        this.meteo_db = PVGISdata.inputs.meteo_data.meteo_db;
        this.year_min = PVGISdata.inputs.meteo_data.year_min;
        this.year_max = PVGISdata.inputs.meteo_data.year_max;

        PVGISdata.outputs.hourly.forEach((element) => {
          //Para gestionar fechas en formato dd/mm/aaaa como vienen en el CSV debamos invertir a aaaa/mm/dd en javascript
          let _dia = parseInt(element["time"].substr(6, 2));
          let _mes = parseInt(element["time"].substr(4, 2)) - 1; //_mes es el indice interno gestionado por JS
          let _ano = parseInt(element["time"].substr(0, 4));
          hora = parseInt(element["time"].substr(9, 2)); //hora es el indice en la tabla 0-23 y coincide con datos PVGIS

          let currFecha = new Date(_ano, _mes, _dia, 0, 0);
          if (i == 0) {
            this.fechaInicio = currFecha;
            this.horaInicio = hora;
          }

          if (_mes == 1 && _dia == 29) return; //Ignoramos el 29/2 de los años bisiestos
          if (currFecha.getTime() == lastFecha.getTime()) {
            unDia.valores[hora] = parseFloat(element["P"]);
            //                        if(_dia == 1 && _mes == 0) console.log("1:" + _dia + "/" + _mes + ":" + hora + "-" + parseFloat(element['P']) + "valores " + unDia.valores);
          } else {
            if (i == 0) {
              unDia = {
                dia: currFecha.getDate(),
                mes: currFecha.getMonth(),
                valores: Array(24).fill(0),
              };
              unDia.valores[hora] = parseFloat(element["P"]);
              //                            if(_dia == 1 && _mes == 0) console.log("2:" + _dia + "/" + _mes + ":" + hora + "-" + parseFloat(element['P']) + "valores " + unDia.valores);
            } else {
              UTIL.mete(unDia, this.idxTable, this.diaHora);
              unDia = {
                dia: currFecha.getDate(),
                mes: currFecha.getMonth(),
                valores: Array(24).fill(0),
              };
              unDia.valores[hora] = parseFloat(element["P"]);
              //                           if(_dia == 1 && _mes == 0) console.log("3:" + _dia + "/" + _mes + ":" + hora + "-" + parseFloat(element['P']) + "valores " + unDia.valores);
            }
            lastFecha = currFecha;
          }
          i++;
        });

        UTIL.mete(unDia, this.idxTable, this.diaHora);
        this.fechaFin = lastFecha;
        this.horaFin = hora;
        this.numeroRegistros = i;
        return true;
      }
    } catch (err) {
      alert(i18next.t("rendimiento_MSG_errorFetch") + err.message);
      return false;
    }
  }
}
