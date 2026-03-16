import m from 'mithril'
import L from 'leaflet'
import AppState from '../lib/appstate'
import { greenToRedViaYellow } from '../lib/utils'
import { Buffer } from 'buffer'

let loadLinksOntoMap = function(vnode) {

  // custom simple icon
  let customIcon = L.divIcon({
    className: 'dot-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })

  //console.log('loadLinks')
  if (vnode.state.pathGroup != null) {
    vnode.state.map.removeLayer(vnode.state.pathGroup)
  }

  vnode.state.pathGroup = L.featureGroup();
  for (let a = 0; a < vnode.state.links.length; a++) {
    let performancePerc = vnode.state.links[a].usage / vnode.state.maxUsage
    if (vnode.attrs.hidePoorLinks && performancePerc <= 0.05) {
      continue
    }

    let marker = L.marker(vnode.state.links[a].nodeA, {icon: customIcon}).addTo(vnode.state.pathGroup)
    marker.bindPopup("<b>" + vnode.state.links[a].nodeAName + "</b>")
    marker = L.marker(vnode.state.links[a].nodeB, {icon: customIcon}).addTo(vnode.state.pathGroup)
    marker.bindPopup("<b>" + vnode.state.links[a].nodeBName + "</b>")

    let derivedColor = greenToRedViaYellow(performancePerc)

    //console.log(performancePerc, derivedColor)
    L.polyline([vnode.state.links[a].nodeA,vnode.state.links[a].nodeB], {
      color: derivedColor,
      weight: (performancePerc <= 0.05) ? 1 : 3,
      }).addTo(vnode.state.pathGroup)
  }
  
  vnode.state.pathGroup.addTo(vnode.state.map)

  if (!vnode.state.boundsSet && vnode.state.pathGroup.getLayers().length > 0) {
    vnode.state.boundsSet = true
    var bounds = vnode.state.pathGroup.getBounds();
    vnode.state.map.fitBounds(bounds, { padding: [50, 50] });
  }  
}

let loadLinksFromPacketLogs = function(vnode) {
  vnode.state.links = AppState.packetLogs.iterateLinks(vnode.attrs.hashMode, (link, usage)=>{
    let nodeAPrefix, nodeBPrefix: Buffer
    if (vnode.attrs.hashMode == 0) {
      nodeAPrefix = Buffer.from(link.substring(0, 2), 'hex');
      nodeBPrefix = Buffer.from(link.substring(2, 4), 'hex');
    } else if (vnode.attrs.hashMode == 1) {
      nodeAPrefix = Buffer.from(link.substring(0, 4), 'hex');
      nodeBPrefix = Buffer.from(link.substring(4, 8), 'hex');
    }
    let nodeA = AppState.identityManager.getRepeatersByPrefix(nodeAPrefix)
    let nodeB = AppState.identityManager.getRepeatersByPrefix(nodeBPrefix)

    if (usage > vnode.state.maxUsage) {
      vnode.state.maxUsage = usage
    }

    let nodeAHasCoords, nodeBHasCoords      

    let nodeALoc, nodeBLoc
    if (nodeA.length == 1) {
      nodeALoc = [ nodeA[0].lat / 1000000, nodeA[0].lon / 1000000 ]
      if (nodeA[0].lat != 0 && nodeA[0].lon != 0) {
        nodeAHasCoords = true
      }
    }
    if (nodeB.length == 1) {
      nodeBLoc = [ nodeB[0].lat / 1000000, nodeB[0].lon / 1000000 ]
      if (nodeB[0].lat != 0 && nodeB[0].lon != 0) {
        nodeBHasCoords = true
      }
    }

    if (nodeAHasCoords && nodeBHasCoords) {
      return {nodeA: nodeALoc, nodeB: nodeBLoc, usage: usage, nodeAName: nodeA[0].name, nodeBName: nodeB[0].name}
    }
  })
}

export default {
  oninit: (vnode)=>{
    vnode.state.maxUsage = 0
    vnode.state.pathGroup = null
    vnode.state.boundsSet = false
    vnode.state.lastHashMode = vnode.attrs.hashMode
    
    loadLinksFromPacketLogs(vnode)
  },
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
    
    loadLinksOntoMap(vnode)
  },
  onupdate: (vnode)=>{
    if (vnode.state.lastHashMode != vnode.attrs.hashMode) {
      loadLinksFromPacketLogs(vnode)
      vnode.state.lastHashMode = vnode.attrs.hashMode
    }
    loadLinksOntoMap(vnode)
  },
  view: (vnode)=>{
    return m("section.h-full",
      m("div.h-full md:bottom-auto", {id: "map"})
    )
  }
}