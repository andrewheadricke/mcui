import m from 'mithril'
import AppState from '../lib/appstate'
import LinksMap from './linksmap'
import { map as svgMap, list as svgList } from './svgs'
import linksmap from './linksmap'

let linksList = {
  view: (vnode)=>{
    return AppState.packetLogs.iterateLinks((link, usage)=>{
      let nodeAByte = parseInt(link.substring(0, 2), 16);
      let nodeBByte = parseInt(link.substring(2, 4), 16);
      let nodeA = AppState.identityManager.getRepeatersByFirstByte(nodeAByte)
      let nodeB = AppState.identityManager.getRepeatersByFirstByte(nodeBByte)        
      let nodeAtxt = nodeA.map((n)=>n.name).join(", ")
      let nodeBtxt = nodeB.map((n)=>n.name).join(", ")

      let nodeAColor, nodeBColor
      let nodeAHasCoords, nodeBHasCoords
      let linkHasCoords = ""

      if (nodeA.length == 1) {
        //nodeALoc = nodeA[0].lat / 1000000 + " " + nodeA[0].lon / 1000000
        if (nodeA[0].lat != 0 && nodeA[0].lon != 0) {
          nodeAHasCoords = true
        }
      } else if (nodeA.length == 0) {
        nodeAtxt = "<unknown>"
      } else if (nodeA.length > 1) {
        nodeAColor = "text-red-500 font-bold"
      }

      if (nodeB.length == 1) {
        //nodeBLoc = nodeB[0].lat / 1000000 + " " + nodeB[0].lon / 1000000
        if (nodeB[0].lat != 0 && nodeB[0].lon != 0) {
          nodeBHasCoords = true
        }
      } else if (nodeB.length == 0) {
        nodeBtxt = "<unknown>"
      } else if (nodeB.length > 1) {
        nodeBColor = "text-red-500 font-bold"
      }

      if (nodeAHasCoords && nodeBHasCoords) {
        linkHasCoords = m("div.inline-block ms-5 rounded-full bg-blue-500/10 px-4 py-1 text-xs text-white", "hasCoords")
      }

      return m("div", m("div.inline-block min-w-20", link, " (", usage, ")"), m("span." + nodeAColor, nodeAtxt), " <--> ", m("span." + nodeBColor, nodeBtxt), linkHasCoords)
    })
  }
}

export default {

  oninit: (vnode)=>{
    vnode.state.viewMode = "list"
    vnode.state.hidePoorLinks = ""
  },
  view: (vnode)=>{
    let padding = "pt-6 ps-6 md:pt-8 md:ps-8"
    return m("section.content-section block flex flex-col h-full",
      m("h2.text-2xl md:text-3xl font-bold " + padding,
        "Links",
        m("div.inline-flex ms-5 text-base text-gray-500 font-normal shadow-xs -space-x-px",
          m("button.inline-flex items-center text-body bg-neutral-primary-soft border rounded rounded-r-none hover:bg-gray-800 focus:ring-3 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-s-base text-sm px-3 py-2 focus:outline-none cursor-pointer", {onclick:(e)=>vnode.state.viewMode="list"},
            m("span.w-5 me-2", m.trust(svgList)), "List"
          ),
          m("button.inline-flex items-center text-body bg-neutral-primary-soft border rounded rounded-l-none hover:bg-gray-800 focus:ring-3 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-s-base text-sm px-3 py-2 focus:outline-none cursor-pointer", {onclick:(e)=>vnode.state.viewMode="map"},
            m("span.w-5 me-2", m.trust(svgMap)), "Map"
          )
        ),
        (()=>{
          if (vnode.state.viewMode == "map") {
            return m("div.inline-block ms-5",
              m("input.w-4 h-4 border border-gray-300 rounded checked:bg-blue-500 checked:border-blue-500", {type:"checkbox", onclick:(e)=>{
                (e.target.checked) ? vnode.state.hidePoorLinks=true: vnode.state.hidePoorLinks=false            
              }}),
              m("span.text-base ms-2 font-normal text-gray-500 align-top top-2 relative", "Hide seldom used links")
            )
          }
        })()
      ),
      (()=>{
        if (vnode.state.viewMode == "list") {
          return m("div." + padding + " pt-0", m(linksList))
        } else {
          return m("div.pt-6 flex-1", m(linksmap, {hidePoorLinks: vnode.state.hidePoorLinks}))
        }
      })()      
    )
  }
}