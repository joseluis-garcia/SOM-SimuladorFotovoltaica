import Consumo from "./Consumo.js";
import Rendimiento from "./Rendimiento.js";
import Instalacion from "./Instalacion.js";
import Produccion from "./Produccion.js";
import Balance from "./Balance.js";
import Economico from "./Economico.js";

import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";
import {inicializaEventos} from "./InicializaAplicacion.js"


// Funcion principal para la gestion del flujo de eventos

var optimizacion;

export default async function _Dispatch(accion) {
  UTIL.debugLog("Dispatcher envia: " + accion);

  var status;


  switch (accion) {
    case "Inicializa eventos":
      status = inicializaEventos();
      break;

    case "Consumo":
      status = await _initConsumos(TCB.fuenteConsumos);
      break;

    case "Calcular energia":
      optimizacion = true;

    case "Instalacion":
      if (!TCB.consumoCreado) {
        alert(i18next.t("dispatcher_MSG_defineConsumosPrimero"));
        return false;
      }
      UTIL.debugLog("Dispatch -> _initInstalacion");
      status = await _initInstalacion();
      if (!status) {
        UTIL.debugLog("Error creando instalación");
        break;
      }
    case "Rendimiento":
      UTIL.debugLog("Dispatch => _initRendimiento");
      status = await _initRendimiento();
      if (!status) {
        UTIL.debugLog("Error creando rendimiento");
        break;
      }
    case "Produccion":
      UTIL.debugLog("Dispatch -> _initProduccion");
      status = await _initProduccion();
      if (!status) {
        UTIL.debugLog("Error creando producción");
        break;
      }
    case "Balance":
      UTIL.debugLog("Dispatch -> _initBalance");
      status = _initBalance();
      if (!status) {
        UTIL.debugLog("Error creando balance");
        break;
      }

      if (optimizacion) {
        //fijamos un objetivo de 50% de autoconsumo
        optimizacion = false;
        let autoconsumoInicial = TCB.balance.autoconsumo / TCB.produccion.totalAnual;
        let variacion = autoconsumoInicial / 0.5;
        let panelesOptimos = Math.trunc(TCB.instalacion.paneles * variacion);
        UTIL.debugLog("First pass con " +TCB.instalacion.paneles + 
                " Autoconsumo: " + autoconsumoInicial + 
                " Variacion propuesta " + variacion + 
                " nuevos paneles " + panelesOptimos);
        if (TCB.instalacion.paneles != panelesOptimos) {
          TCB.instalacion.paneles = panelesOptimos;
          document.getElementById("numeroPaneles").value = panelesOptimos;
        }
        _Dispatch("Produccion");
      }
      if (TCB.balanceCreado) UTIL.muestraBalanceEnergia();

    case "Economico":
      UTIL.debugLog("Dispatch -> _initEconomico");
      status = _initEconomico();
      if (!status) {
        UTIL.debugLog("Error creando economico");
        break;
      }
      if (TCB.economicoCreado) {
        UTIL.muestraBalanceEconomico();
        muestraBalanceFinanciero();
      }
      break;

    case "Cambio subvencion":
      UTIL.debugLog("Dispatch -> _cambioSubvencion");
      TCB.economico.calculoFinanciero();
      muestraBalanceFinanciero();
      break;

    case "Cambio instalacion":
      UTIL.debugLog("Dispatch -> _cambioInstalacion");
      _cambioInstalacion();
      UTIL.muestraBalanceEnergia();
      UTIL.debugLog("Dispatch -> _initEconomico");
      _initEconomico();
      if (TCB.economicoCreado) {
        UTIL.muestraBalanceEconomico();
        muestraBalanceFinanciero();
      }
      break;
  }
}



// Inicio funciones workflow

// Función de construccion objeto Consumo ---------------------------------------------------------------------------------
async function _initConsumos(desde) {
  //desde puede ser CSV en caso de fichero individual de consumo o REE en caso de perfil REE
  UTIL.debugLog("_initCosnumos:" , desde);

  if (TCB.consumoCreado) {
    delete TCB.consumo; // Si hay un consumo creado se borra
    TCB.consumoCreado = false;
  }

  var inFile;
  var consumoBase;
  if (desde.fuente === "CSV") {
    const csvFile = document.getElementById("csvfile");
    //Quizas en el futuro permitamos cargar varios ficheros de consumo para bloques o CEs. Por ahora solo 1
    if (csvFile.files.length != 1) {
      alert(i18next.t("proyecto_MSG_definirFicheroConsumo"));
      return false;
    }
    inFile = csvFile.files[0]; // Se carga el fichero de consumo individual desde el CSV definido
    consumoBase = 1;
    UTIL.debugLog("_initConsumo => new consumo de " + inFile.name);
  } else {
    inFile = await UTIL.getFileFromUrl(TCB.basePath + "datos/REE.csv"); //Este es el fichero que contiene los perfiles de consumo (para ambas tarifas) de REE para el último año
    consumoBase = document.getElementById("potenciaAno").value;
    UTIL.debugLog("_initConsumo => new consumo de REE potencia anual: " + consumoBase + " kWh");
  }

  TCB.consumo = new Consumo(inFile, consumoBase);
  await TCB.consumo.loadCSV(desde);
  if (TCB.consumo.numeroRegistros > 0) {
    TCB.consumo.sintesis();
    let consumoMsg =
      TCB.consumo.numeroRegistros + " registros de consumo cargados desde " +
      TCB.consumo.fechaInicio.toLocaleString() + " hasta ";
    consumoMsg += TCB.consumo.fechaFin.toLocaleString();
    document.getElementById("csv_resumen").innerHTML = consumoMsg;
    TCB.consumoCreado = true;
  } else {
    TCB.consumoCreado = false;
  }
  return TCB.consumoCreado;
}

// Función de construccion objeto Instalacion inicial ----------------------------------------------------------------------
async function _initInstalacion() {

  let tmpPaneles = Math.ceil(TCB.consumo.maximoAnual / TCB.potenciaPanelInicio); //Para empezar ponemos un panel de potencia definida en TCB defaults
  UTIL.debugLog("_initInstalacion con" + tmpPaneles + " paneles de " + TCB.potenciaPanelInicio + "kWp");
  TCB.instalacion = new Instalacion(tmpPaneles, TCB.potenciaPanelInicio); //Creamos una instalación por defecto que cubra el consumo maximo anual
  TCB.instalacionCreada = true;
  return true;

}

// Función de construccion objeto Rendimiento -------------------------------------------------------------------------------
async function _initRendimiento() {

  if (TCB.rendimientoCreado) {
    delete TCB.rendimiento; // Si hay rendimiento creado se borra
    TCB.rendimientoCreado = false;
  }

  var inclinacion;
  var azimut;
  var point1;

  // Verificamos posicion en el mapa
  if (document.getElementById("lonlat").value == "") {
    alert(i18next.t("dispatcher_MSG_definePosicionMapa"));
    return false;
  } else {
    point1 = document.getElementById("lonlat").value.split(",");
  }

  // Verificamos inclinación de los paneles
  if (document.getElementById("inclinacionOptima").checked) {
    inclinacion = "Optimo";
  } else {
    inclinacion = document.getElementById("inclinacion").value;
    if (inclinacion.length == 0) {
      alert("Inclinacion?");
      return false;
    }
  }

  // Verificamos orientacion con respecto al sur
  if (document.getElementById("azimutOptima").checked) {
    azimut = "Optimo";
  } else {
    azimut = document.getElementById("azimut").value;
    if (azimut.length == 0) {
      alert("azimut?");
      return false;
    }
  }

  UTIL.debugLog("_initRendimiento -> new rendimiento");
  TCB.rendimiento = new Rendimiento(point1[0], point1[1], inclinacion, azimut);

  document.getElementById("accionMapa").innerHTML = i18next.t("rendimiento_MSG_obteniendoPVGISdata");
  const timeOutID = setInterval(function () {
      document.getElementById("accionMapa").innerHTML += ">";
      }, 1000);

  if ((status = await TCB.rendimiento.loadPVGISdata())) {
    TCB.rendimientoCreado = true;
  } else {
    TCB.rendimientoCreado = false;
  }
  clearInterval(timeOutID);
  document.getElementById("accionMapa").innerHTML = i18next.t("proyecto_LBL_accion_mapa1");
  return TCB.rendimientoCreado;
}

async function _initProduccion() {
  if (!TCB.consumoCreado) {
    alert(i18next.t("dispatcher_MSG_defineConsumosPrimero"));
    return false;
  }

  if (TCB.produccionCreada) {
    delete TCB.produccion;
    TCB.produccionCreada = false;
  }

  TCB.produccion = new Produccion(TCB.instalacion.potenciaTotal(), TCB.rendimiento);
  TCB.produccionCreada = true;
  return true;
}

function _initBalance() {
  if (TCB.balanceCreado) {
    delete TCB.balance;
    TCB.balanceCreado = false;
  }
  TCB.balance = new Balance(TCB.produccion, TCB.consumo);
  TCB.balanceCreado = true;
  return true;
}

function _cambioInstalacion(paneles, potenciaUnitaria) {

  if (paneles === undefined) {
    TCB.instalacion.paneles = document.getElementById("numeroPaneles").value;
  } else {
    TCB.instalacion.paneles = paneles;
  }
  if (potenciaUnitaria === undefined) {
    TCB.instalacion.potenciaUnitaria = document.getElementById("potenciaUnitaria").value;
  } else {
    TCB.instalacion.potenciaUnitaria = potenciaUnitaria;
  }

  if (TCB.produccionCreada) {
    delete TCB.produccion;
    TCB.produccionCreada = false;
  }

  TCB.produccion = new Produccion(
    TCB.instalacion.potenciaTotal(),
    TCB.rendimiento
  );
  TCB.produccionCreada = true;
  if (TCB.balanceCreado) {
    delete TCB.balance;
    TCB.balanceCreado = false;
  }
  TCB.balance = new Balance(TCB.produccion, TCB.consumo);
  TCB.balanceCreado = true;
  return true;
}

function _initEconomico() {
  if (TCB.economicoCreado) {
    delete TCB.economico;
    TCB.economicoCreado = false;
  }

  TCB.economico = new Economico();
  TCB.economicoCreado = true;
  return true;
}

function muestraBalanceFinanciero() {
  var table = document.getElementById("financiero");
  var rowCount = table.rows.length;
  if (rowCount > 1) {
    for (let i = 1; i < rowCount; i++) {
      table.deleteRow(1);
    }
  }
  for (let i = 0; i < 5; i++) {
    var row = table.insertRow(i + 1);

    var cell = row.insertCell(0);
    cell.innerHTML = TCB.economico.cashFlow[i].ano;

    var cell = row.insertCell(1);
    if (TCB.economico.cashFlow[i].previo < 0) cell.classList.add("text-danger");
    cell.innerHTML = TCB.economico.cashFlow[i].previo.toFixed(2) + "€";

    var cell = row.insertCell(2);
    if (TCB.economico.cashFlow[i].inversion < 0)
      cell.classList.add("text-danger");
    cell.innerHTML = TCB.economico.cashFlow[i].inversion.toFixed(2) + "€";

    var cell = row.insertCell(3);
    cell.innerHTML = TCB.economico.cashFlow[i].ahorro.toFixed(2) + "€";

    var cell = row.insertCell(4);
    cell.innerHTML = TCB.economico.cashFlow[i].IBI.toFixed(2) + "€";

    var cell = row.insertCell(5);
    cell.innerHTML = TCB.economico.cashFlow[i].subvencion.toFixed(2) + "€";

    var cell = row.insertCell(6);
    if (TCB.economico.cashFlow[i].pendiente < 0)
      cell.classList.add("text-danger");
    cell.innerHTML = TCB.economico.cashFlow[i].pendiente.toFixed(2) + "€";
  }

  UTIL.muestra("VAN", "", TCB.economico.VANProyecto.toFixed(2), "€");
  UTIL.muestra("TIR", "", TCB.economico.TIRProyecto.toFixed(2), "%");
  loopAlternativas();
}

function loopAlternativas() {
  var numeroPanelesOriginal = TCB.instalacion.paneles;
  var intentos = [0.25, 0.5, 1, 1.5, 2];
  var paneles = [];
  var autoconsumo = [];
  var TIR = [];
  var autosuficiencia = [];
  var precioInstalacion = [];
  var ahorroAnual = [];

  intentos.forEach((intento) => {
    let _pan = Math.trunc(numeroPanelesOriginal * intento);
    if (_pan >= 1) {
      _cambioInstalacion(_pan, TCB.instalacion.potenciaUnitaria);
      _initEconomico();
      paneles.push(_pan);
      autoconsumo.push((TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100);
      autosuficiencia.push((TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100);
      TIR.push(TCB.economico.TIRProyecto);
      precioInstalacion.push(TCB.instalacion.precioInstalacion());
      ahorroAnual.push(TCB.economico.ahorroAnual);
    }
  });

  _cambioInstalacion(numeroPanelesOriginal, TCB.instalacion.potenciaUnitaria);
  _initEconomico();

  //Buscamos punto de autoconsumo == 80%
  let i = 0;
  while (autoconsumo[i] > 80) i++;
  let pendiente = (autoconsumo[i] - autoconsumo[i-1]) / (paneles[i] - paneles[i-1]);
  let dif = 80 - autoconsumo[i-1];
  let limiteSubvencion = paneles[i-1] + dif / pendiente; 

  TCB.graficos.plotAlternativas(
    "graf_5",
    TCB.instalacion.potenciaUnitaria,
    paneles,
    TIR,
    autoconsumo,
    autosuficiencia,
    precioInstalacion,
    ahorroAnual,
    limiteSubvencion
  );
}
// assign the function _Dispatch to the global window object's initConsumo.
window.Dispatch = _Dispatch;
