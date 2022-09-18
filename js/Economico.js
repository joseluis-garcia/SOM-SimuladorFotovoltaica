import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";

export default class Economico {
  constructor() {
    // Inicializa la tabla indice de acceso
    this.idxTable = Array(365);
    for (let i = 0; i < 365; i++) {
      let tmp = UTIL.fechaDesdeIndice(i);
      this.idxTable[i] = {
        dia: tmp[0],
        mes: tmp[1],
        consumoOriginal: 0,
        consumoConPlacas: 0,
        compensado: 0,
        diaSemana: 0,
      }; //Esta array contiene lo pagado por consumo, lo cobrado por compensacion y el balance neto sin tener en cuenta posibles limites
    }
    this.cashFlow = Array(5);
    for (let i = 0; i < 5; i++) {
      this.cashFlow[i] = {
        ano: 0,
        previo: 0,
        inversion: 0,
        ahorro: 0,
        IBI: 0,
        subvencion: 0,
        pendiente: 0,
      };
    }

    this.diaHoraPrecio = Array.from(Array(365), () => new Array(24).fill(0));
    this.diaHoraTarifa = Array.from(Array(365), () => new Array(24).fill(0));

    this.impuestoTotal = (TCB.parametros.IVA + TCB.parametros.impuestoElectrico) / 100;

    this.consumoOriginalMensual = new Array(12);
    this.consumoConPlacasMensual = new Array(12);
    this.consumoConPlacasMensualCorregido = new Array(12);
    this.compensadoMensual = new Array(12);
    this.compensadoMensualCorregido = new Array(12);
    this.perdidaMes = new Array(12);
    this.ahorroAnual = 0;
    this.TIRProyecto = 0;
    this.VANProyecto = 0;
    this.interesVAN = TCB.parametros.interesVAN;
    this.reCalculo();
  }

  reCalculo() {
    for (let i = 0; i < 365; i++) {
      this.idxTable[i].consumoOriginal = this.calculoPrecioDia(i, TCB.consumo.idxTable, TCB.consumo.diaHora) * (1 + this.impuestoTotal);
      this.idxTable[i].consumoConPlacas = this.calculoPrecioDia(i, TCB.balance.idxTable, TCB.balance.diaHora) * (1 + this.impuestoTotal);
      this.idxTable[i].compensado = this.idxTable[i].consumoOriginal - this.idxTable[i].consumoConPlacas;
    }

    this.consumoOriginalMensual = UTIL.resumenMensual(this.idxTable, "consumoOriginal" );
    this.consumoConPlacasMensual = UTIL.resumenMensual(this.idxTable, "consumoConPlacas" );
    this.compensadoMensual = UTIL.resumenMensual(this.idxTable, "compensado");

    for (let i = 0; i < 12; i++) {
      if (this.consumoConPlacasMensual[i] < 0) {
        //Se debe corregir que si la comercializadora limita economicamente la compensacion al consumo
        this.perdidaMes[i] = -this.consumoConPlacasMensual[i];
        this.compensadoMensualCorregido[i] = this.consumoOriginalMensual[i];
        this.consumoConPlacasMensualCorregido[i] = 0;
      } else {
        this.consumoConPlacasMensualCorregido[i] = this.consumoConPlacasMensual[i];
      }
    }
    this.calculoFinanciero();
  }

  calculoFinanciero() {
    const tiempoSubvencionIBI = document.getElementById("duracionSubvencionIBI").value;
    const valorSubvencionIBI = document.getElementById("valorIBI").value;
    const porcientoSubvencionIBI = document.getElementById("porcientoSubvencionIBI").value / 100;
    const tipoSubvencionEU = document.getElementById("subvencionEU").value;
    var valorSubvencionEU;
    var cuotaPeriodo = new Array(5).fill(0);

    if ((TCB.consumo.totalAnual / TCB.produccion.totalAnual) * 100 < 80) {
      valorSubvencionEU = 0;
    } else {
      valorSubvencionEU = tipoSubvencionEU * TCB.instalacion.potenciaTotal();
    }

    this.ahorroAnual = UTIL.suma(this.consumoOriginalMensual) - UTIL.suma(this.consumoConPlacasMensualCorregido);
    this.cashFlow[1].subvencion = valorSubvencionEU; //La subvención se cobra con suerte despues de un año
    for (let i = 0; i < 5; i++) {
      this.cashFlow[i].ano = i + 1;
      this.cashFlow[i].ahorro = this.ahorroAnual;
      if (i == 0) {
        this.cashFlow[i].previo = 0;
        this.cashFlow[i].inversion = -TCB.instalacion.precioInstalacion();
        this.cashFlow[i].IBI = 0; //Los beneficios de IBI suelen ser a partir del año 1
      } else {
        this.cashFlow[i].previo = this.cashFlow[i - 1].pendiente;
        if (i <= tiempoSubvencionIBI) {
          this.cashFlow[i].IBI = valorSubvencionIBI * porcientoSubvencionIBI;
        }
      }
      cuotaPeriodo[i] =
        this.cashFlow[i].inversion +
        this.cashFlow[i].ahorro +
        this.cashFlow[i].IBI +
        this.cashFlow[i].subvencion;
        this.cashFlow[i].pendiente = this.cashFlow[i].previo + cuotaPeriodo[i];
    }

    this.VANProyecto = this.VAN(this.interesVAN, cuotaPeriodo);
    this.TIRProyecto = this.TIR(this.interesVAN * 2, cuotaPeriodo);
  }

  // Calculo de TIR
  TIR(initRate, args) {
    var depth = 20;
    var numberOfTries = 1;

    var positive, negative;
    args.forEach(function (value) {
      if (value > 0) positive = true;
      if (value < 0) negative = true;
    });
    if (!positive || !negative)
      throw new Error("TIR necesita al menos un valor negativo");

    let rate = initRate;
    let delta = 1;
    let flag = false;
    while (numberOfTries < depth) {
      let _van = this.VAN(rate, args);
      if (_van < 0) {
        delta = delta / 2;
        flag = true;
        rate = rate - delta;
        if (rate < 0) {
          alert("rate:" + rate);
          numberOfTries = depth;
        }
      } else {
        flag ? (delta /= 2) : (delta *= 2);
        rate = rate + delta;
      }
      numberOfTries++;
    }
    return rate;
  }

  // Calculo de VAN
  VAN(rate, units) {
    var rate = rate / 100;
    var _npv = units[0];
    for (var i = 1; i < units.length; i++) {
      _npv += units[i] / Math.pow(1 + rate, i);
    }
    return Math.round(_npv * 100) / 100;
  }

  calculoPrecioDia(idxDia, idxTable, datoTable) {
  // esta funcion devuelve el precio de la energia consumida o vertida a la red segun las tarifas que se definen    
    var pDia = 0;

    //El dia de calculo a efectos de tarifa es el dia / mes del año del último registro del fichero de consumos
    let diaCalculo = new Date(TCB.consumo.fechaFin.getYear(),idxTable[idxDia].mes,idxTable[idxDia].dia);
    let diaSemana = diaCalculo.getDay();
    this.idxTable[idxDia].diaSemana = diaSemana;

    let tarifa = TCB.tarifas[TCB.tarifaActiva];
    for (let i = 0; i < 24; i++) {
      if (datoTable[idxDia][i] < 0) {   //Si el balance es negativo hay aportacion a red y el precio de a compensacion es siempre al mismo
        pDia += datoTable[idxDia][i] * tarifa.precios[0];
      } else {
        if (TCB.tarifaActiva == "2.0TD") {
          if (diaSemana == 0 || diaSemana == 6) {             //es un fin de semana por lo que tarifa P3 todo el dia
            pDia += datoTable[idxDia][i] * tarifa.precios[3];
          } else {
            pDia += datoTable[idxDia][i] * tarifa.precios[tarifa.horas[i]];              
          }
        } else {
          if (diaSemana == 0 || diaSemana == 6) {
            pDia += datoTable[idxDia][i] * tarifa.precios[6]; //es un fin de semana por lo que tarifa P6 todo el dia
          } else {
            pDia += datoTable[idxDia][i] * tarifa.precios[[tarifa.horas[idxTable[idxDia].mes][i]]];
          }
        }
      }
    }

    return pDia;
  }
}
