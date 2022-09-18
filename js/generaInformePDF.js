import TCB from "./TCB.js";
import {formatNumber, suma} from "./Utiles.js";

const doc = new jsPDF('portrait', 'mm', 'a4');

async function generaInformePDF() {
/*     TCB.pdfDoc = new jsPDF('portrait', 'mm', 'a4');
    const doc = TCB.pdfDoc; */


    let pagina = 1;
  
    var i = 1;
    nuevaLinea('Cabecera',null, null, i18next.t('main_LBL_titulo'));
    nuevaLinea('Titulo',i++, null, i18next.t('informe_LBL_datosDeConsumo'));
    if (document.getElementById('desdeFichero').checked) {
      nuevaLinea('Normal', i++, null, i18next.t('informe_LBL_fichero') + TCB.consumo.csvFile.name);
    } else { // es una carga de perfil REE
      nuevaLinea('Normal', i++, null, i18next.t('proyecto_LBL_perfilREE') + " " + TCB.tarifaActiva + 
                                                  i18next.t('informe_LBL_paraPotenciaAnual') + TCB.consumo.consumoBase + " kWh");
    }
    nuevaLinea('Normal', i++, null, i18next.t('informe_LBL_registros', {registros: TCB.consumo.numeroRegistros}) +  
                                    i18next.t('informe_LBL_desde') + TCB.consumo.fechaInicio.toLocaleDateString() +
                                    i18next.t('informe_LBL_hasta') + TCB.consumo.fechaFin.toLocaleDateString());
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_objetivoHora'), formatNumber(TCB.consumo.maximoAnual, 2), "kWh");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_consumoPFVdiaria'), formatNumber(TCB.consumo.totalAnual / TCB.consumo.numeroDias, 2), "kWh");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_consumoPFVmensual'), formatNumber(TCB.consumo.totalAnual / 12, 2),  "kWh");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_consumoPFVanual'), formatNumber(TCB.consumo.totalAnual, 2), "kWh");
  
    i += 2;
    nuevaLinea('Titulo', i++, null, i18next.t('informe_LBL_datosLocalizacionAportados'));
    nuevaLinea('Dato', i++, i18next.t('proyecto_LBL_lonlat'), formatNumber(TCB.rendimiento.lon,4) + ", " + formatNumber(TCB.rendimiento.lat,4), "");
    nuevaLinea('Dato', i++, i18next.t('proyecto_LBL_inclinacion'), TCB.rendimiento.inclinacion, "");
    nuevaLinea('Dato', i++, i18next.t('proyecto_LBL_azimut'), TCB.rendimiento.azimut, "");
  
    i += 2;
    nuevaLinea("Titulo", i++, null, i18next.t('informe_LBL_datosPVGISObtenidos'));
    nuevaLinea('Dato', i++, 'Radiation DB', TCB.rendimiento.radiation_db, "");
    nuevaLinea('Dato', i++, 'Meteo DB', TCB.rendimiento.meteo_db, "");
    nuevaLinea('Dato', i++, 'year_min', formatNumber(TCB.rendimiento.year_min, 0), "");
    nuevaLinea('Dato', i++, 'year_max', formatNumber(TCB.rendimiento.year_max, 0), "");
    nuevaLinea('Pie', pagina++, true);
  
    var i = 1;
    nuevaLinea('Cabecera',null, null, i18next.t('main_LBL_titulo'));
    nuevaLinea('Titulo', i++, null, i18next.t('informe_LBL_datosInstalacionAnalizada'));
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_panelesMinimo'), formatNumber(TCB.instalacion.paneles, 0) , "");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_potenciaPanel') , formatNumber(TCB.instalacion.potenciaUnitaria, 3), "kW");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_potenciaDisponible'), formatNumber(TCB.instalacion.potenciaTotal(), 2), "kW");
    nuevaLinea('Dato', i++, i18next.t('proyecto_LBL_inclinacion'), formatNumber(TCB.instalacion.inclinacion, 2), "º");
    nuevaLinea('Dato', i++, i18next.t('proyecto_LBL_azimut'), formatNumber(TCB.instalacion.azimut, 2), "º");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_system_loss'), formatNumber(TCB.instalacion.system_loss, 2), "%");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_technology'), TCB.instalacion.technology, "");
   
    i += 2;
    nuevaLinea("Titulo", i++, null, i18next.t('informe_LBL_produccionMediaEsperada'));
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_produccionMediaDiaria'), formatNumber(TCB.produccion.totalAnual / 365, 2) , "kWh");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_produccionMediaMensual'), formatNumber(TCB.produccion.totalAnual / 12, 2) , "kWh");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_produccionMediaAnual'), formatNumber(TCB.produccion.totalAnual, 2) , "kWh");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_kgCO2AnualAhorrado'), formatNumber(TCB.parametros.conversionCO2 * TCB.produccion.totalAnual,2) , "kg");
    
    await Plotly.toImage('graf_1', { format: 'jpeg', width: 800, height: 500 }).then(function (dataURL) {
      doc.addImage({imageData: dataURL, x: 40, y: 150, w:150, h:100})});
    nuevaLinea('Pie', pagina++, true);
  
    var i = 1;
    nuevaLinea('Cabecera',null, null, i18next.t('main_LBL_titulo'));
    nuevaLinea('Titulo',i++, null, i18next.t('main_TAB_resultados'));
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_energiaAhorrada'), formatNumber((TCB.produccion.totalAnual / TCB.consumo.totalAnual) * 100, 2) , "%");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_energíaDemandadaVersusGenerada'), formatNumber((TCB.consumo.totalAnual / TCB.produccion.totalAnual) * 100, 2) , "%");
    let p_autoconsumo = (TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100;
    let p_autosuficiencia = (TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100;
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_autoconsumoMedioAnual'), formatNumber(p_autoconsumo, 2) , "%");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_autosuficienciaMediaAnual'), formatNumber(p_autosuficiencia, 2) , "%");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_autosuficienciaMaxima'), formatNumber(p_autosuficiencia + (100 - p_autoconsumo),2) , "%");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_energiaSobrante'), formatNumber(TCB.balance.excedenteAnual / TCB.produccion.totalAnual * 100, 2) , "%");
    nuevaLinea('Dato', i++, i18next.t('resultados_LBL_energiaFaltante'), formatNumber(TCB.balance.excedenteAnual / TCB.balance.deficitAnual * 100, 2) , "%");
    await Plotly.toImage('graf_2', { format: 'jpeg', width: 800, height: 500 }).then(function (dataURL) {
      doc.addImage({imageData: dataURL, x: 25, y: 100, w:90, h:70})});
    await Plotly.toImage('graf_3', { format: 'jpeg', width: 800, height: 500 }).then(function (dataURL) {
      doc.addImage({imageData: dataURL, x: 110, y: 100, w:90, h:70})});
  
    nuevaLinea('Pie', pagina++, true);
  
    var i = 1;
    nuevaLinea('Cabecera',null, null, i18next.t('main_LBL_titulo'));
    nuevaLinea('Titulo',i++, null, i18next.t('main_TAB_precios'));
    nuevaLinea('Dato', i++, "Tarifa : ", TCB.tarifaActiva, "");
    nuevaLinea('Dato', i++, i18next.t('precios_LBL_compensa'), formatNumber(TCB.tarifas[TCB.tarifaActiva].precios[0], 2), "€/kWh");
    for (let j=1; j<TCB.tarifas[TCB.tarifaActiva].precios.length; j++) {
      if (TCB.tarifas[TCB.tarifaActiva].precios[j] > 0)
      nuevaLinea('Dato', i++, "P"+j, formatNumber(TCB.tarifas[TCB.tarifaActiva].precios[j], 2), "€/kWh");
    }
    let consumoOriginalAnual = suma(TCB.economico.consumoOriginalMensual);
    let consumoConPlacasAnual = suma(TCB.economico.consumoConPlacasMensualCorregido);
    nuevaLinea('Dato', i++,i18next.t('precios_LBL_gastoAnualSinPlacas'), formatNumber(consumoOriginalAnual, 2), "€");
    nuevaLinea('Dato', i++,i18next.t('precios_LBL_gastoAnualConPlacas'), formatNumber(consumoConPlacasAnual, 2), "€");
    nuevaLinea('Dato', i++,i18next.t('precios_LBL_ahorroAnual'), formatNumber(TCB.economico.ahorroAnual, 2), "€");
    nuevaLinea('Dato', i++,i18next.t('precios_LBL_costeInstalacion'), formatNumber(TCB.instalacion.precioInstalacion(), 2), "€");
    nuevaLinea('Dato', i++,i18next.t('precios_LBL_noCompensadoAnual'), formatNumber(suma(TCB.economico.perdidaMes), 2), "€");
    nuevaLinea('Dato', i++,i18next.t('precios_LBL_ahorroAnualPorciento'), formatNumber((consumoOriginalAnual - consumoConPlacasAnual) / consumoOriginalAnual * 100, 2), "%");
    await Plotly.toImage('graf_4', { format: 'jpeg', width: 800, height: 500 }).then(function (dataURL) {
      doc.addImage({imageData: dataURL, x: 40, y: 150, w:150, h:100})});
    nuevaLinea('Pie', pagina++, true);
  
    var i = 1;
    nuevaLinea('Cabecera',null, null, i18next.t('main_LBL_titulo'));
    nuevaLinea('Titulo',i++, null, i18next.t('main_TAB_financiero') + " (Euros)");
  
    var tcolumns= [
      { header: i18next.t('precios_LBL_año'), dataKey: 'ano' },
      { header: i18next.t('precios_LBL_previo'), dataKey: 'previo' },
      { header: i18next.t('precios_LBL_inversion'), dataKey: 'inversion' },
      { header: i18next.t('precios_LBL_ahorro'), dataKey: 'ahorro'},
      { header: i18next.t('precios_LBL_descuentoIBI'), dataKey: 'IBI'},
      { header: i18next.t('precios_LBL_subvencion'), dataKey: 'subvencion'},
      { header: i18next.t('precios_LBL_pendiente'), dataKey: 'pendiente'}
    ];
    var trows = TCB.economico.cashFlow.map( (row) => { var tt = {};
                                                       for (let objProp in row) {tt[objProp] = formatNumber(row[objProp], 2)};
                                                          return tt;
                                                      });
    doc.autoTable({columns: tcolumns, body: trows, margin:{left: 25, top:50}, 
      theme : 'striped', 
      styles: {halign: 'right', textColor: [0, 0, 0], lineColor: [0, 0, 0]},
      headStyles: {halign: 'center', fillColor: [255, 255, 255], lineColor: [0, 0, 0]},
      alternateRowStyles: {fillColor: [229,255,204]}
    });
      
    await Plotly.toImage('graf_5', { format: 'jpeg', width: 800, height: 500 }).then(function (dataURL) {
        doc.addImage({imageData: dataURL, x: 40, y: 100, w:150, h:100})});
    nuevaLinea('Pie', pagina++, false);
    doc.save('reporte.pdf');
  }

  function nuevaLinea( tipo, linea, propiedad, valor, unidad) {
    // Hoja DIN A4 - 210 x 297

    doc.setFontType('normal');
    const _hdr = 25;
    const footer = 285;
    const margenIzquierdo = 25;
    const margenDerecho = 195;
    const margenValor = 170;
    const margenUnidad = 180;
    const _vert = 10;
    const _delta = 7;
    const _font = {Cabecera: 22, Titulo: 16, Normal:12, Dato: 11, Pie:10}
    let renglon = _hdr + _vert + linea * _delta;
    let hoy = new Date();
  
    doc.setFontSize(_font[tipo]);
    switch (tipo) {
      case "Cabecera":
        doc.text(valor, margenIzquierdo, _hdr, {align: 'center'});
        doc.setFontSize(_font['Normal']);
        doc.text(i18next.t("main_LBL_proyectoActivo") + TCB.proyectoActivo, margenIzquierdo, _hdr + 7);
        break;
      case "Titulo":
        doc.text(valor, margenIzquierdo, renglon);
        doc.setLineWidth( 1 );
        doc.line(margenIzquierdo, renglon + 1, margenDerecho, renglon  + 1);
        break;
      case "Normal":
        doc.text(valor, margenIzquierdo, renglon);
        break;
      case "Dato":
        doc.setLineWidth( 0.1 );
        if (renglon % 2 == 0) 
          doc.setFillColor(255,255,255);
        else
          doc.setFillColor(229,255,204);
  
        doc.rect(margenIzquierdo, renglon - _delta + 2, margenDerecho - margenIzquierdo, 7, 'DF');
        doc.setFillColor(255,255,255);
  
        doc.text(propiedad, margenIzquierdo+1, renglon);
        if (unidad === "") {
          doc.text(valor, margenUnidad, renglon, null, null, 'right');
        } else {
          doc.text(valor, margenUnidad, renglon, null, null, 'right');
          doc.text(unidad, margenUnidad+1, renglon);
        }
        break;
      case "Pie":
        doc.setFillColor(0);
        doc.setLineWidth( 1 );
        doc.line(margenIzquierdo, footer, margenDerecho, footer);
        doc.text(hoy.toLocaleDateString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), margenIzquierdo, footer + 7);
        doc.text("Página: " + linea, margenDerecho, footer + 7,  null, null, 'right');
        if (propiedad) doc.addPage();
        break;
    }
  }

  export {generaInformePDF}