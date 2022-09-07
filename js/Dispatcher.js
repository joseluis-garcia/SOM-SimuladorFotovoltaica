// import the exported function, variable from the test3.js module.
import Consumo from "./Consumo.js";
import Rendimiento from "./Rendimiento.js";
import Instalacion from "./Instalacion.js";
import Produccion from "./Produccion.js";
import Balance from "./Balance.js";
import Graficos from "./Graficos.js";
import Economico from "./Economico.js";
import TCB from "./TCB.js";
import * as MAPA from "./Mapas.js";
import * as UTIL from "./Utiles.js";

// Funcion principal para la gestion del flujo de eventos

var optimizacion;

export default async function _Dispatch(accion) {
  UTIL.debugLog("Dispatcher envia: " + accion);

  var status;
  TCB.graficos = new Graficos();

  switch (accion) {
    case "Inicializa eventos":
      status = _initEvents();
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

async function _initEvents() {
  //Se recibimos argumento denug en la url ejecutamos con debug

  TCB.debug = UTIL.getQueryVariable('debug');
  UTIL.debugLog("_initEvents Debug activo: "+TCB.debug);

  //Inicializacion proceso i18n
  UTIL.debugLog("_initEvents call i18next");
  TCB.i18next = window.i18next;
  TCB.i18next.use(i18nextBrowserLanguageDetector);
  TCB.i18next.use(i18nextHttpBackend);
  await TCB.i18next.init({
      debug: TCB.debug,
      fallbackLng: 'es',
      locales: ['es', 'ca', 'ga', 'en', 'en-US'],
      backend: {loadPath: './locales/{{lng}}.json'}       
      }, (err, t) => {
      if (err) return console.error(err);
      for (var i = 0; i < document.querySelectorAll('[data-i18n]').length; i++) { 
          document.querySelectorAll('[data-i18n]')[i].innerHTML = i18next.t(document.querySelectorAll('[data-i18n]')[i].getAttribute("data-i18n")); 
      }
  });
  document.getElementById("idioma").value = TCB.i18next.language.substring(0,2);

  // Inicializa la gestión del mapa
  UTIL.debugLog("_initEvents call MAPA.mapaLocalizacion");
  MAPA.mapaLocalizacion();

  // Define la url base de la aplicación
  let fullPath = window.location.href;
  let ipos = fullPath.lastIndexOf("/");
  TCB.basePath = fullPath.slice(0, ipos + 1);
  UTIL.debugLog("_initEvents ejecutando desde " + TCB.basePath);

  document.getElementById('direccion').value = i18next.t("proyecto_LBL_localizacion");

  // Muestra los valores por defecto asignados a los parametros
  for (let param in TCB.parametros) {
    let campo = document.getElementById(param);
    campo.value = TCB.parametros[param];
    campo.addEventListener("change", function handleChange(event) { 
      TCB.parametros[event.target.id] = event.target.value == "" ? 0 : event.target.value;
    });
  }
  document.getElementById("potenciaPanel").value = TCB.potenciaPanelInicio;

  document.getElementById("tarifa").value = TCB.tarifaActiva;
  for (let i=0; i<=6; i++){
    document.getElementById("tarifaP"+i).value = TCB.tarifas[TCB.tarifaActiva].precios[i];
  }


  // Evento de cambio de idioma DOM.id: "idioma"
  const idioma = document.getElementById("idioma");
  idioma.addEventListener("change", function handleChange(event) {
    UTIL.debugLog("i18next cambiando idioma a " + event.target.value);
    i18next.changeLanguage(event.target.value, (err, t) => {
      if (err) return console.log(err);
      for (
        var i = 0;
        i < document.querySelectorAll("[data-i18n]").length;
        i++
      ) {
        document.querySelectorAll("[data-i18n]")[i].innerHTML = i18next.t(
          document.querySelectorAll("[data-i18n]")[i].getAttribute("data-i18n")
        );
      }
    });
  });

  // Evento para gestionar las opciones de fichero CSV o perfil REE. DOMid: "desdeFichero" y DOMid: "desdePotencia"
  document.getElementById("desdeFichero").addEventListener("change", cambioFuente);
  document.getElementById("desdePotencia").addEventListener("change", cambioFuente);
  function cambioFuente() {
    var datoFichero = document.getElementById("csvfile");
    var datoPotencia = document.getElementById("potenciaAno");
    datoFichero.disabled = !datoFichero.disabled;
    datoPotencia.disabled = !datoPotencia.disabled;
  }
  

  // Evento para gestionar los campos relativos a los precios de tarifas. DOMid: "tarifa"
  const select = document.getElementById("tarifa");
  select.addEventListener("change", function handleChange(event) {
    TCB.tarifaActiva = event.target.value;
    for (let i=0; i<=6; i++){
      document.getElementById("tarifaP"+i).value = TCB.tarifas[TCB.tarifaActiva].precios[i];
    }
    if (event.target.value == "3.0TD") {
      document.getElementById("tablaTarifas3.0TD").style.display = "block";
    } else {
      document.getElementById("tablaTarifas3.0TD").style.display = "none";
    }
  });

  // Carga los valores de tarifas definidos en TCB en los campos correspondientes y asigna el listener para gestionar sus cambios.
  for (let i=0; i<=6; i++){
    let cTarifa = document.getElementById("tarifaP"+i)
    cTarifa.addEventListener("change", function handleChange(event) {
      TCB.tarifas[TCB.tarifaActiva].precios[event.target.id.substring(7)] = event.target.value;
    });
  }

  // Evento para gestionar el boton de carga fichero CSV DOMid: "csvFile"
  const filecsv = document.getElementById("csvfile");
  filecsv.addEventListener("change", async function handleChange(event) {
    UTIL.debugLog("pasando a _initConsumos ", { fuente: "CSV", campo: "Consumo" });
    await _initConsumos({ fuente: "CSV", campo: "Consumo" });
  });

  // Evento para lanzar la carga del fichero CSV del perfil REE DOMid: "cargarREE"
  document.getElementById("cargarREE").addEventListener("click", async function handleChange(event) {
      if (document.getElementById("potenciaAno").value === "") { //Debemos tener un consumo anual base para hacer el cálculo
        alert(i18next.t("proyecto_MSG_definirPotenciaBaseREE"));
        return false;
      } else {
        UTIL.debugLog("pasando a _initConsumos ", { fuente: "CSV", campo: "Consumo" });
        await _initConsumos({fuente: "REE",campo: document.getElementById("tarifa").value}); //Cuando se trata de cargar los datos de REE se distingue el perfil de consumo en base a la tarifa
      }
  });

  // Evento para gestionar el nombre generico del proyecto DOMid: "proyecto"
  const proyecto = document.getElementById("proyecto");
  proyecto.addEventListener("change", () => {
    document.getElementById("nombreProyecto").innerHTML =
      i18next.t("main_LBL_proyectoActivo") + proyecto.value;
  });

  // Evento para gestionar las opciones de inclinacion entre un valor entrado por el usuario o la opción optimo.
  const inclinacion = document.getElementById("inclinacion");
  const inclinacionOptima = document.getElementById("inclinacionOptima");
  inclinacion.addEventListener("change", manageInclinacion);
  inclinacionOptima.addEventListener("change", manageInclinacion);
  function manageInclinacion() {
    const _inc = document.getElementById("inclinacion").value;
    const _flg = document.getElementById("inclinacionOptima");
    if (_inc === "" && !_flg.checked) {
      _flg.checked = true;
    } else if (_flg && _inc !== "") {
      _flg.checked = false;
    }
  }

  // Evento para gestionar las opciones de azimut entre un valor entrado por el usuario o la opción optimo.
  const azimut = document.getElementById("azimut");
  const azimutOptima = document.getElementById("azimutOptima");
  azimut.addEventListener("change", manageazimut);
  azimutOptima.addEventListener("change", manageazimut);
  function manageazimut() {
    const _inc = document.getElementById("azimut").value;
    const _flg = document.getElementById("azimutOptima");
    console.log(_inc + "\n" + _flg.checked);
    if (_inc === "" && !_flg.checked) {
      _flg.checked = true;
    } else if (_flg && _inc !== "") {
      _flg.checked = false;
    }
  }

  // Evento disparado el seleccionar una direccion de la lista de candidatos obtenida de Nominatim. DOMid: "candidatos"
  // Cada  elemento de la lista de candidatos tiene asociado el value de lon-lat que es pasado en el evento
  const listaCandidatos = document.getElementById("candidatos");
  listaCandidatos.addEventListener("click", async function handleChange(event) {
    await MAPA.centraMapa(event.target.value);
  });

  // Evento disparado al escribir una dirección. DOMid: "direccion"
  // Una vez capturado el nombre se pasa a Nominatim para obtener la lista de candidatos
  const direccion = document.getElementById("direccion");
  direccion.addEventListener("change", async function handleChange1(event) {
    await MAPA.mapaPorDireccion("localizacion");

  });

  // Evento asociado al boton calcular de la pestaña proyecto DOMid:"calcular"
  const calcular = document.getElementById("calcular"); 
  calcular.addEventListener("click", async function handleChange1(event) {
    MAPA.resetMap();
    _Dispatch("Calcular energia");
  });

  // Evento para gestionar los cambios de instalacion DOMid: "numeroPaneles" y DOMid: "potenciaUnitaria"
  document.getElementById("numeroPaneles").addEventListener("change", (e) => _nuevaInstalacion( e));
  document.getElementById("potenciaUnitaria").addEventListener("change", (e) =>_nuevaInstalacion( e));
  function _nuevaInstalacion(evento) {
    if (evento.target.id == "numeroPaneles") TCB.instalacion.paneles = evento.target.value;
    if (evento.target.id == "potenciaUnitaria") TCB.instalacion.potenciaUnitaria = evento.target.value;
    _Dispatch("Cambio instalacion");
  }

  // Evento para cargar la subvención EU DOMid: "subvencionEU"
  // La subvención EU solo se puede aplicar cuando el autoconsumo es superior al 80%
  const subvencion = document.getElementById("subvencionEU");
  subvencion.addEventListener("change", function handleChange(event) {
    let tauto = TCB.balance.autoconsumo / TCB.produccion.totalAnual * 100;
    if (tauto < 80) {
      alert (i18next.t("precios_msg_limiteAutoconsumo", {autoconsumo: tauto.toFixed(2)}));
      subvencion.value = 0;
    } else {
      _Dispatch("Cambio subvencion");
    }
  });

  // Evento para gestionar la subvención del IBI
  document.getElementById("valorIBI").addEventListener("change", chkIBI);
  document.getElementById("porcientoSubvencionIBI").addEventListener("change", chkIBI);
  document.getElementById("duracionSubvencionIBI").addEventListener("change", chkIBI);
  function chkIBI() {
    _Dispatch('Economico');
  }
}

// Fin area declaracion de eventos
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
  var status;

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

// assign the function _initConsumo to the global window object's initConsumo.
window.Dispatch = _Dispatch;
