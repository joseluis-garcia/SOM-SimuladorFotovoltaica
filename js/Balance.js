import * as UTIL from "./Utiles.js";

export default class Balance {
  constructor(produccion, consumo) {
    // Inicializa la tabla indice de acceso
    this.idxTable = Array(365);
    for (let i = 0; i < 365; i++) {
      this.idxTable[i] = {
        dia: i,
        mes: 0,
        suma: 0,
        maximo: 0,
        deficit: 0,
        excedente: 0,
        autoconsumo: 0,
      };
    }

    this.diaHora = Array.from(Array(365), () => new Array(24).fill(0));
    this.deficitMaximo = 0;
    this.excedenteMaximo = 0;
    this.autoconsumo = 0;
    this.excedenteAnual = 0;
    this.deficitAnual = 0;
    this.reCalculo(produccion, consumo);
  }

  reCalculo(produccion, consumo) {
    for (let idxDia = 0; idxDia < 365; idxDia++) {
      for (let hora = 0; hora < 24; hora++) {
        this.diaHora[idxDia][hora] = consumo.diaHora[idxDia][hora] - produccion.diaHora[idxDia][hora];
        if (this.diaHora[idxDia][hora] < 0) {
          this.autoconsumo += consumo.diaHora[idxDia][hora];
          this.excedenteAnual += Math.abs(this.diaHora[idxDia][hora]);
          this.idxTable[idxDia].autoconsumo += consumo.diaHora[idxDia][hora];
          this.idxTable[idxDia].excedente += Math.abs(
            this.diaHora[idxDia][hora]
          );
        } else {
          this.deficitAnual += this.diaHora[idxDia][hora];
          this.idxTable[idxDia].deficit += this.diaHora[idxDia][hora];
          this.autoconsumo += produccion.diaHora[idxDia][hora];
          this.idxTable[idxDia].autoconsumo += produccion.diaHora[idxDia][hora];
        }
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
    var minIDX = 0;
    for (let i = 0; i < 365; i++) {
      if (this.idxTable[i].maximo > this.excedenteMaximo) {
        this.excedenteMaximo = this.idxTable[i].maximo;
        maxIDX = i;
      }
      if (this.idxTable[i].maximo < this.deficitMaximo) {
        this.deficitMaximo = this.idxTable[i].maximo;
        minIDX = i;
      }
      this.totalAnual += this.idxTable[i].suma;
    }

/*     UTIL.debugLog("Balance:", {ExcedenteMaximo: this.excedenteMaximo, 
      FechaMaximoExcedente: UTIL.fechaDesdeIndice(maxIDX),
      DeficitMaximo: this.deficitMaximo,
      FechaMaximoDeficit: UTIL.fechaDesdeIndice(minIDX),
      DeficitAnual: this.deficitAnual,
      ExcedenteAnual: this.excedenteAnual,
      Autoconsumo: this.autoconsumo}); */
  }
}
