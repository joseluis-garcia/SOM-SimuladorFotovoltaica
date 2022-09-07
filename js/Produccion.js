import * as UTIL from "./Utiles.js";

export default class Produccion {
  constructor(potencia, rendimiento) {
    this.idxTable = Array(365);

    // Inicializa la tabla indice de acceso
    for (let i = 0; i < 365; i++) {
      this.idxTable[i] = { dia: i, mes: 0, suma: 0, maximo: 0 };
    }
    this.diaHora = Array.from(Array(365), () => new Array(24).fill(0));
    this.maximoAnual = 0;
    this.totalAnual = 0;
    this.reCalculo(potencia, rendimiento);
  }

  reCalculo(potencia, rendimiento) {
    for (let idxDia = 0; idxDia < 365; idxDia++) {
      for (let hora = 0; hora < 23; hora++) {
        this.diaHora[idxDia][hora] =
          (rendimiento.diaHora[idxDia][hora] * potencia) / 1000;
      }
      let tmp = UTIL.fechaDesdeIndice(idxDia);
      this.idxTable[idxDia].dia = tmp[0];
      this.idxTable[idxDia].mes = tmp[1];
      this.idxTable[idxDia].suma = UTIL.suma(this.diaHora[idxDia]);
      this.idxTable[idxDia].maximo = Math.max(...this.diaHora[idxDia]);
    }
    this.sintesis();
  }

  sintesis() {
    var maxIDX = 0;
    for (let i = 0; i < 365; i++) {
      if (this.idxTable[i].maximo > this.maximoAnual) {
        this.maximoAnual = this.idxTable[i].maximo;
        maxIDX = i;
      }
      this.totalAnual += this.idxTable[i].suma;
    }
/*     UTIL.debugLog("Produccion:", {maximo: this.maximoAnual.toFixed(2), 
            dia: UTIL.fechaDesdeIndice(maxIDX), 
            total: this.totalAnual.toFixed(2), 
            mensual: (this.totalAnual / 12).toFixed(2),
            diaria:  (this.totalAnual / 365).toFixed(2)});    */
  }
}
