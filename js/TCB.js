// Modulo de variable globales y valores por defecto
const TCB = {
    consumo:"",
    rendimiento:"",
    instalacion:"",
    produccion:"",
    balance:"",
    economico:"",
    graficos:"",

    //Variables globales de funcionamiento
    debug : false,
    basePath : "",
    pdfDoc: "",


    consumoCreado : false,
    localizacionDefinida : false,
    rendimientoCreado : false,
    instalacionCreada : false,
    produccionCreada : false,
    balanceCreado : false,
    economicoCreado : false,

    //Algunos valores por defecto
    // Estos precios son los de SOM a agosto 2022 y no deberían estar aqui.
    tarifas : { 
        '2.0TD': { 
            precios: [0.187, 0.357, 0.293, 0.241, 0, 0, 0],
            horas: [3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2]
        },
        '3.0TD': { 
            precios: [0.187, 0.355, 0.324, 0.296, 0.269, 0.246, 0.239],
            horas: [
                [6, 6, 6, 6, 6, 6, 6, 6, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2],
                [6, 6, 6, 6, 6, 6, 6, 6, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2],
                [6, 6, 6, 6, 6, 6, 6, 6, 3, 2, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3],
                [6, 6, 6, 6, 6, 6, 6, 6, 5, 4, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5],
                [6, 6, 6, 6, 6, 6, 6, 6, 5, 4, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5],
                [6, 6, 6, 6, 6, 6, 6, 6, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4],
                [6, 6, 6, 6, 6, 6, 6, 6, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2],
                [6, 6, 6, 6, 6, 6, 6, 6, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4],
                [6, 6, 6, 6, 6, 6, 6, 6, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4],
                [6, 6, 6, 6, 6, 6, 6, 6, 5, 4, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5],
                [6, 6, 6, 6, 6, 6, 6, 6, 3, 2, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3],
                [6, 6, 6, 6, 6, 6, 6, 6, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2],
            ]}
    },
    tarifaActiva : '2.0TD',
    proyectoActivo: "",
    fuenteConsumos : {},
    
    // Parametros por defecto
    parametros : {
        conversionCO2 : 0.440,
        impuestoElectrico : 5.113,
        IVA : 21.0,
        euroxkWpinstalado : 1400,
        perdidasSistema : 14,
        interesVAN : 3,
        tecnologia : 'crystSi'
    },
    potenciaPanelInicio : 0.450
}
export default TCB

