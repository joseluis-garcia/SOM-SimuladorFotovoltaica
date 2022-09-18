import TCB from "./TCB.js";
import { generaInformePDF } from "./generaInformePDF.js";
import * as MAPA from "./Mapas.js";
import * as UTIL from "./Utiles.js";
import Graficos from "./Graficos.js";

async function inicializaEventos() {
    //Se recibimos argumento debug en la url ejecutamos con debug
  
    TCB.debug = UTIL.getQueryVariable('debug');
    UTIL.debugLog("_initEvents Debug activo: "+TCB.debug);

    //Inicializacion graficos Plotly
    TCB.graficos = new Graficos();
  
    //Inicializacion proceso i18n
    UTIL.debugLog("_initEvents call i18next");
    TCB.i18next = window.i18next;
    TCB.i18next.use(i18nextBrowserLanguageDetector);
    TCB.i18next.use(i18nextHttpBackend);
    await TCB.i18next.init({
        debug: TCB.debug,
        fallbackLng: 'es',
        locales: ['es', 'ca', 'ga', 'en', 'en-US', 'es-ES'],
        backend: {loadPath: './locales/{{lng}}.json'}       
        }, (err, t) => {
        if (err) return console.error(err);
        for (var i = 0; i < document.querySelectorAll('[data-i18n]').length; i++) { 
            document.querySelectorAll('[data-i18n]')[i].innerHTML = i18next.t(document.querySelectorAll('[data-i18n]')[i].getAttribute("data-i18n")); 
        }
    });
    document.getElementById("idioma").value = TCB.i18next.language.substring(0,2);
  
    // Inicialización y evento asociado a la generación del informe pdf
    document.getElementById('informe').addEventListener("click", function handleChange(event) { 
    if (TCB.economicoCreado) {

      generaInformePDF();
    } else {
        alert("debe procesar primero");
    }});
  
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
      TCB.fuenteConsumos = { fuente: "CSV", campo: "Consumo" };
      Dispatch ('Consumo');
    });
  
    // Evento para lanzar la carga del fichero CSV del perfil REE DOMid: "cargarREE"
    document.getElementById("cargarREE").addEventListener("click", async function handleChange(event) {
        if (document.getElementById("potenciaAno").value === "") { //Debemos tener un consumo anual base para hacer el cálculo
          alert(i18next.t("proyecto_MSG_definirPotenciaBaseREE"));
          return false;
        } else {
          UTIL.debugLog("pasando a _initConsumos ", { fuente: "CSV", campo: "Consumo" });
          TCB.fuenteConsumos = {fuente: "REE",campo: document.getElementById("tarifa").value};
          Dispatch ('Consumo'); //Cuando se trata de cargar los datos de REE se distingue el perfil de consumo en base a la tarifa
        }
    });
  
    // Evento para gestionar el nombre generico del proyecto DOMid: "proyecto"
    const proyecto = document.getElementById("proyecto");
    proyecto.addEventListener("change", () => {
      document.getElementById("nombreProyecto").innerHTML =
        i18next.t("main_LBL_proyectoActivo") + proyecto.value;
      TCB.proyectoActivo = proyecto.value;
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
      Dispatch("Calcular energia");
    });
  
    // Evento para gestionar los cambios de instalacion DOMid: "numeroPaneles" y DOMid: "potenciaUnitaria"
    document.getElementById("numeroPaneles").addEventListener("change", (e) => _nuevaInstalacion( e));
    document.getElementById("potenciaUnitaria").addEventListener("change", (e) =>_nuevaInstalacion( e));
    function _nuevaInstalacion(evento) {
      if (evento.target.id == "numeroPaneles") TCB.instalacion.paneles = evento.target.value;
      if (evento.target.id == "potenciaUnitaria") TCB.instalacion.potenciaUnitaria = evento.target.value;
      Dispatch("Cambio instalacion");
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
        Dispatch("Cambio subvencion");
      }
    });
  
    // Evento para gestionar la subvención del IBI
    document.getElementById("valorIBI").addEventListener("change", chkIBI);
    document.getElementById("porcientoSubvencionIBI").addEventListener("change", chkIBI);
    document.getElementById("duracionSubvencionIBI").addEventListener("change", chkIBI);
    function chkIBI() {
      Dispatch('Economico');
    }
  }

  export {inicializaEventos};