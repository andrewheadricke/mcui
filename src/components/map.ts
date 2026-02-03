import m from 'mithril'
import L from "leaflet";

import AppState from '../lib/appstate'

// import these image assets so they get bundled
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let _markerIcon2x = markerIcon2x
let _markerShadow = markerShadow

export default {
  oncreate: (vnode)=>{
    vnode.state.map = L.map('map', {
      renderer: L.canvas()
    }).setView([-28, 134], 4);
    
    //vnode.state.map = L.map('map').setView([0, 0], 9);
    vnode.state.map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(vnode.state.map);

    var markerGroup = L.featureGroup();
    markerGroup.addTo(vnode.state.map);
    let nodes = AppState.identityManager.getContacts(false)
    for (let a = 0; a < nodes.length; a++) {
      if (typeof nodes[a].lat == 'number' && nodes[a].lat != 0) {
        let marker = L.marker([nodes[a].lat / 1000000, nodes[a].lon / 1000000]).addTo(markerGroup)
        marker.bindPopup("<b>" + nodes[a].name + "</b>")
        marker.bindTooltip(nodes[a].name, {permanent: true, direction : 'bottom', className:"transparent-tooltips", offset:[-15,15]})
      }
    }
    nodes = AppState.identityManager.getMyIdentities()
    for (let a = 0; a < nodes.length; a++) {
      if (typeof nodes[a].lat == 'number' && nodes[a].lat != 0) {
        let marker = L.marker([nodes[a].lat / 1000000, nodes[a].lon / 1000000]).addTo(markerGroup)
        marker._icon.style.filter = "hue-rotate(150deg)"
        marker.bindPopup("<b>" + nodes[a].name + "</b>")
        marker.bindTooltip(nodes[a].name, {permanent: true, direction : 'bottom', className:"transparent-tooltips", offset:[-15,15]})
      }
    }
    if (markerGroup.getLayers().length > 0) {
      var bounds = markerGroup.getBounds();
      vnode.state.map.fitBounds(bounds, { padding: [50, 50] });
    }
  },
  view: (vnode)=>{
    return m("section.flex flex-col h-full",
      m("div.h-full md:bottom-auto", {id: "map"})
    )
  }
}