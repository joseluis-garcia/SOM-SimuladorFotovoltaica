import * as UTIL from "./Utiles.js";
import TCB from "./TCB.js";

export default class Graficos {   

    consumos_y_generacion(donde){
    var resConsumo = UTIL.resumenMensual(TCB.consumo.idxTable, 'suma');
    var trace1 = {
        x: UTIL.nombreMes,
        y: resConsumo,
        type: 'scatter',
        name: i18next.t('graficos_LBL_graficasConsumo')
    };
    
    var resProduccion = UTIL.resumenMensual(TCB.produccion.idxTable, 'suma');
    var trace2 = {
        x: UTIL.nombreMes,
        y: resProduccion,
        type: 'scatter',
        name: i18next.t('graficos_LBL_graficasProduccion')
    };

    var layout = {
        title: i18next.t('graficos_LBL_produccionMediaMensual', {potencia: (TCB.instalacion.potenciaTotal()).toFixed(2)}),
        yaxis: {
            title: 'kWh'
        }
    };
    
    var data = [trace1, trace2];
    Plotly.newPlot(donde, data, layout);
    }

    resumen_3D ( donde) {

    var g_produccion = {
        z: TCB.produccion.diaHora,
        name: i18next.t('graficos_LBL_graficasProduccion'),
        type: 'surface',
        colorscale: 'YlOrRd',
        opacity:1,
        showlegend:true,
        showscale: false
    };

    var g_consumo = {
        z: TCB.consumo.diaHora,
        name: i18next.t('graficos_LBL_graficasConsumo'),
        type: 'surface',
        colorscale: 'Picnic',
        opacity:0.8,
        showlegend:true,
        showscale: false
    };
  
    var layout_resumen = {
        title: i18next.t('graficos_LBL_graficasProduccion') + " vs " + i18next.t('graficos_LBL_graficasConsumo'),
        scene: {
            xaxis:{title: i18next.t('graficos_LBL_graficasHora')},
            yaxis:{title: i18next.t('graficos_LBL_graficasDia')},
            zaxis:{title: 'kWh'},
            camera: {eye: {x: -1.5, y: -1.5, z: 0.5}}
            },
        autosize: false,

        width: 1200,
        height: 800,
        margin: {
            l: 65,
            r: 50,
            b: 65,
            t: 25
          }
    };

    Plotly.newPlot(donde, [g_consumo, g_produccion], layout_resumen);
    }

    balanceEnergia (donde1, donde2){
        var autoconsumo = UTIL.resumenMensual(TCB.balance.idxTable, 'autoconsumo');
        var excedente = UTIL.resumenMensual(TCB.balance.idxTable, 'excedente');
        var deficit = UTIL.resumenMensual(TCB.balance.idxTable, 'deficit');
        var consumo = UTIL.resumenMensual(TCB.consumo.idxTable, 'suma');
        var produccion = UTIL.resumenMensual(TCB.produccion.idxTable, 'suma');
        
        var trace_produccion = {
            x: UTIL.nombreMes,
            y: produccion,
            name: i18next.t('graficos_LBL_graficasProduccion'),
            type: 'scatter'
        };
        
        var trace_consumo = {
            x: UTIL.nombreMes,
            y: consumo,
            name: i18next.t('graficos_LBL_graficasConsumo'),
            type: 'scatter'
        };

        var trace_excedente = {
            x: UTIL.nombreMes,
            y: excedente,
            name: i18next.t('graficos_LBL_graficasExcedente'),
            type: 'bar'
        };

        var trace_deficit = {
            x: UTIL.nombreMes,
            y: deficit,
            name: i18next.t('graficos_LBL_graficasDeficit'),
            type: 'bar'
        };

        var trace_autoconsumo = {
            x: UTIL.nombreMes,
            y: autoconsumo,
            name: i18next.t('graficos_LBL_graficasAutoconsumo'),
            type: 'bar'
        };

        var layout = {
            title: i18next.t('graficos_LBL_balanceProduccion', {potencia: (TCB.instalacion.potenciaTotal()).toFixed(2)}),
            barmode: 'stack',
            yaxis: {
                title: 'kWh'
            }
        };
      
        var data = [trace_produccion, trace_autoconsumo, trace_excedente];
        Plotly.newPlot(donde1, data, layout);

        var layout = {
            title: i18next.t('graficos_LBL_balanceConsumo', {potencia: (TCB.instalacion.potenciaTotal()).toFixed(2)}),
            barmode: 'stack',
            yaxis: {
                title: 'kWh'
            }
        };
        var data1 = [trace_consumo, trace_autoconsumo, trace_deficit  ];
        Plotly.newPlot(donde2, data1, layout);
    }

    balanceEconomico (donde1){

        var _perdidas = new Array(12);
        var _compensado = new Array(12);
        for (let i=0; i<12; i++) { //las perdidas y lo compensado lo graficamos negativo
            _perdidas[i] = -TCB.economico.perdidaMes[i];
            _compensado[i] = -TCB.economico.compensadoMensual[i];
        }

        var trace_pagado = {
            x: UTIL.nombreMes,
            y: TCB.economico.consumoConPlacasMensualCorregido,
            name: i18next.t('graficos_LBL_graficasPagado'),
            type: 'scatter'
        };

        var trace_consumo = {
            x: UTIL.nombreMes,
            y: TCB.economico.consumoOriginalMensual,
            name: i18next.t('graficos_LBL_graficasConsumo'),
            type: 'bar'
        }

        var trace_compensa = {
            x: UTIL.nombreMes,
            y: _compensado,
            name: i18next.t('graficos_LBL_graficasCompensacion'),
            type: 'bar'
        }

         var trace_perdida = {
            x: UTIL.nombreMes,
            y: _perdidas,
            name: i18next.t('graficos_LBL_graficasNoCompensado'),
            type: 'bar'
        } 

        var layout = {
            title: i18next.t('graficos_LBL_tituloBalanceEconomico', {potencia: (TCB.instalacion.potenciaTotal()).toFixed(2)}),
            barmode: 'relative',
            yaxis: {
                title: 'Euros'
            }
        };
        var data1 = [trace_consumo, trace_compensa, trace_perdida, trace_pagado ]; //
        Plotly.newPlot(donde1, data1, layout);
    }

    plotAlternativas (donde, potencia_kWp, paneles, TIR, autoconsumo, autosuficiencia, precioInstalacion, ahorroAnual, limiteSubvencion) {
        var trace_TIR = {
            x: paneles,
            y: TIR,
            name: 'TIR',
            type: 'scatter'
        };

        var trace_autosuficiencia = {
            x: paneles,
            y: autosuficiencia,
            name: i18next.t('graficos_LBL_graficasAutosuficiencia'),
            type: 'scatter'
        };

        var trace_autoconsumo = {
            x: paneles,
            y: autoconsumo,
            name: i18next.t('graficos_LBL_graficasAutoconsumo'),
            type: 'scatter'
        };

        var trace_precioInstalacion = {
            x: paneles,
            y: precioInstalacion,
            name: i18next.t('graficos_LBL_graficasInversion'),
            yaxis : 'y2',
            type: 'scatter'
        };

        var trace_ahorroAnual = {
            x: paneles,
            y: ahorroAnual,
            name: i18next.t('graficos_LBL_graficasAhorro'),
            yaxis : 'y2',
            type: 'scatter'
        };

        var layout = {
            title: i18next.t('graficos_LBL_alternativasPotencia', {potencia: potencia_kWp}),
            yaxis: {
                title: '%'
            },
            yaxis2: {
                title: 'Euros',
                overlaying: 'y',
                side: 'right'
            },
            legend: {
                x:1.1, y:1.,
                orientation:'v'
            },

            shapes: [
                  //line vertical
                  {
                    type: 'line',
                    x0: TCB.instalacion.paneles, y0: 0,
                    x1: TCB.instalacion.paneles, y1: 100,
                    line: {color: 'rgb(55, 128, 191)', width: 1}
                  },
                    {
                    type: 'line',
                    x0: 0, y0: 80,
                    x1: limiteSubvencion, y1: 80,
                    line: {color: 'rgb(87, 202, 0)', width: 2}
                    },
                    {
                    type: 'line',
                    x0: limiteSubvencion, y0: 0,
                    x1: limiteSubvencion, y1: 80,
                    line: {color: 'rgb(87, 202, 0)', width: 2}
                    }
                ],
            annotations: [
                {
                    x: limiteSubvencion, y: 80,
                    xref: 'x', yref: 'y',
                    text: 'Limite subvencion EU',
                    showarrow: true,
                    arrowhead: 3,
                    xanchor: 'left',
                    hovertext: limiteSubvencion.toFixed(1) + " paneles",
                    ax: 20,
                    ay: -20
                }]
        };

        var data = [trace_TIR, trace_autoconsumo, trace_autosuficiencia, trace_precioInstalacion, trace_ahorroAnual]; //
        Plotly.newPlot(donde, data, layout);
    }
}