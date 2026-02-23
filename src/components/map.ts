import m from 'mithril'
import L from "leaflet"
import { convex } from "@turf/convex"
import { area } from "@turf/area"
import { featureCollection, point } from '@turf/helpers';

import AppState from '../lib/appstate'

// import these image assets so they get bundled
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
let _markerIcon2x = markerIcon2x
let _markerShadow = markerShadow

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let setCustomControl = (vnode)=>{
  vnode.state.customControl = L.Control.extend({
    options: {
        position: 'topleft',
        showingArea: false
    },
  
    onAdd: function (map) {

      let _this = this

      let getControlHtml = ()=>{
        let retVal = '<button type="button" style="width: 30px; height: 30px; cursor: pointer;" title="Show mesh area">📐</button>'
        if (_this.options.showingArea) {
          retVal += '<span style="color:#000;padding-right:8px;font-size:14px;">' + vnode.state.totalArea + '</span>'
        }
        return retVal
      }

      let container = L.DomUtil.create('div', 'leaflet-bar');
      container.style.backgroundColor = "#ffffff"
      container.innerHTML = getControlHtml();
      let boundaryLayer = null 

      L.DomEvent.disableClickPropagation(container);

      container.onclick = function() {
        if (_this.options.showingArea == false) {
          _this.options.showingArea = true
          container.innerHTML = getControlHtml()
          boundaryLayer = L.geoJSON(vnode.state.convexHull, {style: { colorx: 'red' }}).addTo(vnode.state.map);
        } else {
          _this.options.showingArea = false
          container.innerHTML = getControlHtml()
          boundaryLayer.removeFrom(vnode.state.map)
        }
      };

      return container;
    }
  })
}

export default {
  oncreate: (vnode)=>{
    vnode.state.convexHull = null
    vnode.state.totalArea = ""
    vnode.state.customControl = null;
    vnode.state.map = L.map('map', {
      renderer: L.canvas()
    }).setView([-28, 134], 4)
    
    //vnode.state.map = L.map('map').setView([0, 0], 9);
    vnode.state.map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(vnode.state.map)

    let allNodes = []
    var markerGroup = L.featureGroup();
    markerGroup.addTo(vnode.state.map);
    let nodes = AppState.identityManager.getContacts(false)
    for (let a = 0; a < nodes.length; a++) {
      if (typeof nodes[a].lat == 'number' && nodes[a].lat != 0) {
        let marker = L.marker([nodes[a].lat / 1000000, nodes[a].lon / 1000000]).addTo(markerGroup)
        marker.bindPopup("<b>" + nodes[a].name + "</b>")
        marker.bindTooltip(nodes[a].name, {permanent: true, direction : 'bottom', className:"transparent-tooltips", offset:[-15,15]})
        allNodes.push(nodes[a])
      }
    }
    nodes = AppState.identityManager.getMyIdentities()
    for (let a = 0; a < nodes.length; a++) {
      if (typeof nodes[a].lat == 'number' && nodes[a].lat != 0) {
        let marker = L.marker([nodes[a].lat / 1000000, nodes[a].lon / 1000000]).addTo(markerGroup)
        marker._icon.style.filter = "hue-rotate(150deg)"
        marker.bindPopup("<b>" + nodes[a].name + "</b>")
        marker.bindTooltip(nodes[a].name, {permanent: true, direction : 'bottom', className:"transparent-tooltips", offset:[-15,15]})
        allNodes.push(nodes[a])
      }
    }
    if (markerGroup.getLayers().length > 0) {
      var bounds = markerGroup.getBounds()
      vnode.state.map.fitBounds(bounds, { padding: [50, 50] })
    }
    
    const points = featureCollection(
      allNodes.map(coord => point([coord.lon  / 1000000, coord.lat / 1000000]))
    );
    vnode.state.convexHull = convex(points);

    //L.geoJSON(hull, {style: { colorx: 'red' }}).addTo(vnode.state.map);

    if (vnode.state.convexHull != null) {
      const areaSqMeters = area(vnode.state.convexHull);
      const areaSqKm = areaSqMeters / 1_000_000;
      vnode.state.totalArea = numberWithCommas(Math.round(areaSqKm)) + " km²";

      setCustomControl(vnode)
      vnode.state.map.addControl(new vnode.state.customControl);
    }
  },
  view: (vnode)=>{
    return m("section.flex flex-col h-full",
      m("div.h-full md:bottom-auto", {id: "map"})
    )
  }
}