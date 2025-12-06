import m from 'mithril'
import L from 'leaflet'

export default {
  oninit: (vnode)=>{
    vnode.state.map = null
    vnode.state.layerGroup = null
    vnode.state.lat = 0
    vnode.state.lon = 0
  },
  oncreate: (vnode)=>{
    vnode.state.map = L.map('modalMap').setView([-28, 134], 4);
    //vnode.state.map = L.map('map').setView([0, 0], 9);
    vnode.state.map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(vnode.state.map);

    vnode.state.map.on('click', function(e){
      if (vnode.state.layerGroup != null) {
        vnode.state.layerGroup.clearLayers()
      }
      let marker = new L.Marker(e.latlng, {draggable:true})
      vnode.state.lat = Math.round(e.latlng.lat * 1000000)
      vnode.state.lon = Math.round(e.latlng.lng * 1000000)
      vnode.state.layerGroup = L.layerGroup([marker])
      vnode.state.map.addLayer(vnode.state.layerGroup);      
    })
  },
  view: (vnode)=>{
    return m("div.h-full flex flex-col",
      m("div.bg-white px-4 pb-4 p-4 sm:pb-4 text-black",
        m("div.sm:flex sm:items-start",
          m("div.text-center sm:mt-0 sm:ml-4 sm:text-left",
            m("h3.text-base font-semibold text-gray-900", "Select location")                
          )
        )            
      ),
      m("section.flex-1",
        m("div.md:bottom-auto xflex-1 h-full", {id: "modalMap"})
      ),
      m("section.border-t-1 border-gray-500 p-2 flex justify-end pe-10",
        m("button.inline-block ms-4 text-base font-bold rounded-xl bg-gray-500 px-4 py-2 relative cursor-pointer", {onclick: vnode.attrs.onClose}, "Cancel"),
        m("button.inline-block ms-4 text-base font-bold rounded-xl bg-blue-500 px-4 py-2 relative cursor-pointer", {onclick: (e)=>{
          vnode.attrs.onSave(vnode.state.lat, vnode.state.lon)
        }}, "Save")
      )
    )
  }
}