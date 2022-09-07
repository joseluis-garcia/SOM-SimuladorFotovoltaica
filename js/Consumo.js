import * as UTIL from "./Utiles.js";

export default class Consumo {
  constructor(csvFile, consumoBase) {
    this.csvFile = csvFile;
    this.idxTable = Array(365);

    // Inicializa la tabla indice de acceso
    for (let i = 0; i < 365; i++) {
      this.idxTable[i] = { previos: 0, dia: i, mes: 0, suma: 0, maximo: 0 };
    }

    this.diaHora = Array.from(Array(365), () => new Array(24).fill(0));
    this.fechaInicio = new Date(1, 1, 1900);
    this.horaInicio = -1;
    this.fechaFin = new Date(1, 1, 1900);
    this.horaFin = -1;

    this.consumoBase = consumoBase;
    this.maximoAnual = 0;
    this.totalAnual = 0;
    this.numeroRegistros = 0;
    this.numeroDias = 0;

    UTIL.debugLog("Constructor consumo => loadcsv");
  } // End constructor

  async loadCSV(desde) {
    var lastLine;
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        alert(
          i18next.t("consumo_MSG_errorLecturaicheroConsumo") +
            "\nReader.error: " + reader.error 
        );
        reject("...error de lectura");
      };

      reader.onload = (e) => {
        const text = e.target.result;
        const data = UTIL.csvToArray(text, ";");
        
        if (data.length == 0) return false;

        if (data.length < 8760) {
          if ( !window.confirm( i18next.t("proyecto_MSG_numeroLimitadoResgistros", {registros: data.length})))
          {
            return false;
          }
        }
        UTIL.debugLog("Consumo procesando " + data.length + " registros del fichero " + this.csvFile.name);

        try {
          var lastFecha = new Date(1970, 1, 1);
          var hora;
          var unDia = { dia: 0, mes: 0, valores: Array(24).fill(0) }; //el mes es 0-11, la hora es 0-23
          var decimalCaracter;

          if (desde.fuente == "REE") decimalCaracter = ".";
          if (desde.fuente == "CSV") decimalCaracter = ",";

          for (var i = 0; i < data.length - 1; i++) {
            lastLine = data[i];

            //Para gestionar fechas en formato dd/mm/aaaa como vienen en el CSV debamos invertir a aaaa/mm/dd en javascript
            let parts = data[i]["Fecha"].split("/"); //separamos la hora
            let _dia = parts[0];
            let _mes = parts[1] - 1; //_mes es el indice interno gestionado por JS pero es 1-24 en los ficheros de las distribuidoras
            let _ano = parts[2];

            //Hay casos en ficheros CSV que aparece una hora 25 los dias de cambio de horario.
            hora = data[i]["Hora"] - 1; //hora viene 1-24. Se cambia al interno 0-23
            if (hora < 0) hora = 0;
            if (hora >= 23) hora = 23;
            let currFecha = new Date(_ano, _mes, _dia, 0, 0);

            if (_mes == 1 && _dia == 29) continue; //Ignoramos el 29/2 de los años bisiestos

            //Registramos los datos del primer registro
            if (i == 0) {
              this.fechaInicio = currFecha;
              this.horaInicio = hora + 1;
            }

            if (currFecha.getTime() == lastFecha.getTime()) {
              //debemos cambiar la , por el . para obtener el valor
              unDia.valores[hora] =
                parseFloat(data[i][desde.campo].replace(decimalCaracter, ".")) *
                this.consumoBase;
            } else {
              if (i == 0) {
                unDia = {
                  dia: currFecha.getDate(),
                  mes: currFecha.getMonth(),
                  valores: Array(24).fill(0),
                };
                unDia.valores[hora] =
                  parseFloat(
                    data[i][desde.campo].replace(decimalCaracter, ".")
                  ) * this.consumoBase;
              } else {
                UTIL.mete(unDia, this.idxTable, this.diaHora);
                unDia = {
                  dia: currFecha.getDate(),
                  mes: currFecha.getMonth(),
                  valores: Array(24).fill(0),
                };
                unDia.valores[hora] =
                  parseFloat(
                    data[i][desde.campo].replace(decimalCaracter, ".")
                  ) * this.consumoBase;
              }
              lastFecha = currFecha;
              if (unDia.valores[hora] == 0) {
                console.log("0000-" + unDia.dia + "/" + unDia.mes);
              }
            }
          }

          UTIL.mete(unDia, this.idxTable, this.diaHora);

          this.fechaFin = lastFecha;
          this.horaFin = hora;
          this.numeroRegistros = data.length;
          resolve();
        } catch (error) {
          this.numeroRegistros = 0;
          console.log("Error lectura con: " + lastLine + "\n" + error);
          reject(error);
        }
      };
      reader.readAsText(this.csvFile);
    });
  }

  sintesis() {
    var maxIDX = 0;
    for (let i = 0; i < 365; i++) {
      if (this.idxTable[i].maximo > this.maximoAnual) {
        this.maximoAnual = this.idxTable[i].maximo;
        maxIDX = i;
      }
      if (this.idxTable[i].previos > 0) this.numeroDias++;
      this.totalAnual += this.idxTable[i].suma;
    }

    UTIL.debugLog("Consumo:", {desde: this.fechaInicio,
      hasta: this.fechaFin,
      maximo: this.maximoAnual.toFixed(2), 
      dia: UTIL.fechaDesdeIndice(maxIDX), 
      total: this.totalAnual.toFixed(2), 
      mensual: (this.totalAnual / 12).toFixed(2),
      diaria:  (this.totalAnual / 365).toFixed(2)});   

  }
}
