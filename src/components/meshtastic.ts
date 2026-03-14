import m from "mithril"
import { map as svgMap, list as svgList } from './svgs'
import AppState from "../lib/appstate"
import { formatTimeDifference } from "../lib/utils"
import MeshtasticMap from "./meshtasticmap"

let listView = {
  view:(vnode)=>{
    return m("div.grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 pt-1 p-6",
      AppState.meshtastic.getAllNodes(true).map((node)=>{
        let colors = AppState.meshtastic.getCachedColors(node.id)
        
        return m("div.rounded-lg p-4 flexx items-centerx justify-betweenx relativex", {style:"color:#000000;background-color:" + colors.f + ";"},
          m("div",
            m("span.p-2 rounded-lg me-2", {style:"color:" + colors.fg + ";background-color:" + colors.bg}, node.shortName),
            node.longName
          ),
          m("div.pt-2",
            m("p.text-xs", {style:"word-break:break-all;"}, "Public key: ", node.getShortPublicKey()),
            m("p.text-xs", "First seen: ", formatTimeDifference(node.firstSeen)),
            m("p.text-xs", "Last seen: ", formatTimeDifference(node.lastSeen)),
            (()=>{
              if (node.location != null) {
                return [
                  m("p.text-xs", "Location: ", node.location[0], ", ", node.location[1]),
                  m("p.text-xs", "Altitude: ", node.location[2], "m")
                ]
              }
            })()
          )
        )
      })
    )
  }
}

export default {
  oninit: (vnode)=>{
    vnode.state.viewMode = "list"
  },
  view: (vnode)=>{
    let padding = "pt-6 ps-6 md:pt-8 md:ps-8"
    return m("section.content-section block flex flex-col h-full",
      m("h2.text-2xl md:text-3xl font-bold " + padding,
        "Meshtastic",
        m("div.inline-flex ms-5 text-base text-gray-500 font-normal shadow-xs -space-x-px",
          m("button.inline-flex items-center text-body bg-neutral-primary-soft border rounded rounded-r-none hover:bg-gray-800 focus:ring-3 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-s-base text-sm px-3 py-2 focus:outline-none cursor-pointer", {onclick:(e)=>vnode.state.viewMode="list"},
            m("span.w-5 me-2", m.trust(svgList)), "List"
          ),
          m("button.inline-flex items-center text-body bg-neutral-primary-soft border rounded rounded-l-none hover:bg-gray-800 focus:ring-3 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-s-base text-sm px-3 py-2 focus:outline-none cursor-pointer", {onclick:(e)=>vnode.state.viewMode="map"},
            m("span.w-5 me-2", m.trust(svgMap)), "Map"
          )
        )        
      ),
      m("div.text-lg text-gray-500 ps-6 pt-2", AppState.meshtastic.nodeCount(), " nodes"),
      (()=>{
        if (vnode.state.viewMode == "list") {
          return m(listView)
        } else {
          return m(MeshtasticMap)
        }
      })()
      
    )
  }
}