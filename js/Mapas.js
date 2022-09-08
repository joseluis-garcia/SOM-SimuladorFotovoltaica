import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";

var map;
var p_exist = false;

function resetMap() {
  p_exist = false;
}

export default function mapaLocalizacion() {

  var point1, point2;

  var lonlattxt;
  var azimut;
  var p1, p2;
  var Vmarker1, Vmarker2;
  var kmlFeature;
  var Vlayer;
  var attribution = new ol.control.Attribution({
    collapsible: false,
  });

  map = new ol.Map({
    controls: ol.control.defaults({ attribution: false }).extend([attribution]),
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM({
          crossOrigin: null,
          maxZoom: 30,
        }),
      }),
    ],
    target: "map",
    view: new ol.View({
      center: ol.proj.fromLonLat([-3.7, 40.45]),
      maxZoom: 18,
      zoom: 6,
    }),
  });
  map.addControl(new ol.control.ZoomSlider());

  map.on("singleclick", function (evt) {
    if (p_exist) {
      document.getElementById("accionMapa").innerHTML = i18next.t(
        "proyecto_LBL_accion_mapa1"
      );
      p2 = evt.coordinate;
      point2 = ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
      azimut =
        (Math.atan2(point1[0] - point2[0], point1[1] - point2[1]) * 180) /
        Math.PI;
      document.getElementById("azimut").value = azimut.toFixed(0);
      if (document.getElementById("azimutOptima").checked)
        document.getElementById("azimutOptima").checked = false;

      Vmarker2 = new ol.Feature({ geometry: new ol.geom.Point(p2) });
      let kml = new ol.format.KML().writeFeatures([Vmarker2]);
      kmlFeature = new ol.format.KML().readFeature(kml);
      Vmarker2.setStyle(kmlFeature.getStyle());

      var lineaStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({ color: [250, 0, 0, 1], width: 4 }),
      });
      let coord = [p1, p2];
      var lineaAzimut = new ol.Feature({
        geometry: new ol.geom.LineString(coord),
      });
      lineaAzimut.setStyle(lineaStyle);
      Vlayer.getSource().addFeatures([Vmarker2, lineaAzimut]);

      p_exist = false;
    } else {
      // Si ya habiamos definido un punto previo removemos el layer donde esta dibujado el circulo de 500m de CCEE
      map.getLayers().forEach((layer) => {
        if (layer instanceof ol.layer.Vector) map.removeLayer(layer);
      });
      p1 = evt.coordinate;
      point1 = ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
      lonlattxt = point1[0].toFixed(4) + "," + point1[1].toFixed(4);
      document.getElementById("lonlat").value = lonlattxt;
      document.getElementById("accionMapa").innerHTML = i18next.t(
        "proyecto_LBL_accion_mapa2"
      );
      p_exist = true;

      Vmarker1 = new ol.Feature({ geometry: new ol.geom.Point(p1) });
      var Smarker1 = new ol.style.Style({
        image: new ol.style.Icon({
          scale: 1,
          anchor: [0.5, 1],
//          src: TCB.basePath + "/datos/marker.png",
            src: "./datos/marker.png",
        }),
      });
      Vmarker1.setStyle(Smarker1);

      let areaCCEE = new ol.Feature({ geometry: new ol.geom.Circle(p1, 500) }); // Circulo de 500m para CCEE

      Vlayer = new ol.layer.Vector({ source: new ol.source.Vector() });

      Vlayer.getSource().addFeatures([Vmarker1, areaCCEE]);
      map.getView().setCenter(evt.coordinate);
      map.addLayer(Vlayer);
    }
  });
}

async function mapaPorDireccion() {
  var localizacion = document.getElementById("direccion");
  var listaCandidatos = document.getElementById("candidatos");
  let url =
    "https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&addressdetails=1&countrycodes=es&";
  url += "q=" + localizacion.value;
  UTIL.debugLog("Call Nominatim:" + url);
  var latlons = [];
  const respCandidatos = await fetch(url);
  if (respCandidatos.status === 200) {
    var dataCartoCiudad = await respCandidatos.text();
    var jsonAdd = JSON.parse(dataCartoCiudad);

    while (listaCandidatos.firstChild) {
      listaCandidatos.removeChild(listaCandidatos.firstChild);
    }

    jsonAdd.forEach(function (item) {
      var nitem = document.createElement("option");
      nitem.value = [item.lon, item.lat];
      nitem.text = item.display_name.toString();
      latlons.push = [item.lat, item.lon];
      listaCandidatos.appendChild(nitem);
    });

    if (listaCandidatos.childElementCount > 0 ) {
      listaCandidatos.disabled = false;
    } else {
      listaCandidatos.disabled = true;
    }

  } else {
    alert("Error conectando con Nominatim: " + respuesta.status + "\n" + url);
    return false;
  }
}

async function centraMapa(direccion) {
  let coords = direccion.split(",");
  map
    .getView()
    .setCenter(
      ol.proj.transform([coords[0], coords[1]], "EPSG:4326", "EPSG:3857")
    );
  map.getView().setZoom(17);
}

export { mapaLocalizacion, mapaPorDireccion, centraMapa, resetMap };
