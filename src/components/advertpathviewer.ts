import m from 'mithril'
import L from 'leaflet'
import AppState from '../lib/appstate'
import { Identity } from '../lib/identities'

let loadMapContents = function(vnode) {
  let path = vnode.attrs.contactNode.advertPath.split(",")
  //for (let a = 0; a < path.length; a++) {
  //  let tmpIdentities = AppState.identityManager.getRepeatersByPrefixHex(path[a])
  //  vnode.state.identities.push(...tmpIdentities)
  //}
  //console.log(path) 

  let customIcon = L.divIcon({
    className: 'dot-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })

  let ambiguousIcon = L.divIcon({
    className: 'ambiguous-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })

  vnode.state.layerGroup = L.featureGroup();

  let addedNodes = {}
  if (vnode.attrs.contactNode.hasCoords()) {
    let marker = L.marker(vnode.attrs.contactNode.getCoords(), {icon: customIcon}).addTo(vnode.state.layerGroup)
    marker.bindPopup("<b>" + vnode.attrs.contactNode.name + "</b>")
    addedNodes[vnode.attrs.contactNode.getPublicKeyHex()] = true
  }

  let noCoordNodes = []
  for (let a = 0; a < path.length; a++) {

    let srcNodes = AppState.identityManager.getRepeatersByPrefixHex(path[a])
    let dstNodes = AppState.identityManager.getRepeatersByPrefixHex(path[a+1])

    //console.log(srcNodes, dstNodes)

    let addedSrc, addedDst: boolean
    let icon = customIcon
    if (srcNodes.length > 1) {
      icon = ambiguousIcon
    }
    let srcNodesWithCoords = []
    for (let b = 0; b < srcNodes.length; b++) {      
      if (srcNodes[b].hasCoords()) {
        if (addedNodes.hasOwnProperty(srcNodes[b].getPublicKeyHex()) == false) {
          addedNodes[srcNodes[a].getPublicKeyHex()] = true          
          let marker = L.marker(srcNodes[b].getCoords(), {icon: icon}).addTo(vnode.state.layerGroup)
          marker.bindPopup("<b>" + srcNodes[b].name + "</b>")
          addedSrc = true
        }
        srcNodesWithCoords.push(srcNodes[b])
      }
    }    
    if (a == 0 && vnode.attrs.contactNode.hasCoords()) {
      for (let b = 0; b < srcNodesWithCoords.length; b++) {
        if (srcNodes.length == 1) {
          let derivedColor = "#ff0000"
          L.polyline([vnode.attrs.contactNode.getCoords(), srcNodesWithCoords[b].getCoords()], {
            color: derivedColor,
          }).addTo(vnode.state.layerGroup)
        } else {
          let derivedColor = "#0000ff"
          L.polyline([vnode.attrs.contactNode.getCoords(), srcNodesWithCoords[b].getCoords()], {
            color: derivedColor,
            weight: 1
          }).addTo(vnode.state.layerGroup)
        }
      }
    }
    
    icon = customIcon
    if (dstNodes.length > 1) {
      icon = ambiguousIcon
    }
    let dstNodesWithCoords = []
    for (let b = 0; b < dstNodes.length; b++) {
      if (dstNodes[b].hasCoords()) {
        if (addedNodes.hasOwnProperty(dstNodes[b].getPublicKeyHex()) == false) {
          addedNodes[dstNodes[b].getPublicKeyHex()] = true
          let marker = L.marker(dstNodes[b].getCoords(), {icon: icon}).addTo(vnode.state.layerGroup)
          marker.bindPopup("<b>" + dstNodes[b].name + "</b>")
          dstNodesWithCoords.push(dstNodes[b])
        }
        addedDst = true
      }
    }
    //console.log(srcNodesWithCoords, dstNodesWithCoords)

    if (srcNodesWithCoords.length == 1 && dstNodes.length == 1) {
      let derivedColor = "#ff0000"
      L.polyline([srcNodesWithCoords[0].getCoords(), dstNodes[0].getCoords()], {
        color: derivedColor,
      }).addTo(vnode.state.layerGroup)
    } else {
      for (let b = 0; b < srcNodesWithCoords.length; b++) {
        for (let c = 0; c < dstNodesWithCoords.length; c++) {
          let derivedColor = "#0000ff"
          L.polyline([srcNodesWithCoords[b].getCoords(), dstNodes[c].getCoords()], {
            color: derivedColor,
            weight: 1
          }).addTo(vnode.state.layerGroup)
        }
      }
    }        
  }

  vnode.state.layerGroup.addTo(vnode.state.map)

  if (!vnode.state.boundsSet && vnode.state.layerGroup.getLayers().length > 0) {
    vnode.state.boundsSet = true
    var bounds = vnode.state.layerGroup.getBounds();
    vnode.state.map.fitBounds(bounds, { padding: [50, 50] });
  }  
}

export default {
  oninit: (vnode)=>{
    vnode.state.map = null
    vnode.state.layerGroup = null
    vnode.state.identities = []    
  },
  oncreate: (vnode)=>{
    vnode.state.map = L.map('modalMap').setView([-28, 134], 4);
    //vnode.state.map = L.map('map').setView([0, 0], 9);
    vnode.state.map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(vnode.state.map);

    loadMapContents(vnode)
  },
  view: (vnode)=>{
    return m("div.h-full flex flex-col",
      m("div.bg-white px-4 pb-4 p-4 sm:pb-4 text-black",
        m("div.sm:flex sm:items-start",
          m("div.text-center sm:mt-0 sm:ml-4 sm:text-left",
            m("h3.text-base font-semibold text-gray-900", "Advert Path")
          )
        )            
      ),
      m("section.flex-1",
        m("div.md:bottom-auto h-full", {id: "modalMap"})
      ),
      m("section.border-t-1 border-gray-500 p-2 flex justify-end pe-10",
        m("button.inline-block text-base font-bold rounded-xl bg-gray-500 px-4 py-2 relative cursor-pointer", {onclick: vnode.attrs.onClose}, "Dismiss")
      )
    )
  }
}