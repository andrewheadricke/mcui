import m from 'mithril'

import AppState from '../lib/appstate'
import { walkieTalkie as svgWalkieTalkie, addressBook as svgAddressBook, broadcastOrig, circle as svgCircle } from './svgs'
import { hashtag as svgHashtag, comments as svgComments } from './svgs'
import { map as svgMap, circleNodes as svgCircleNodes, route as svgRoute, userSecret as svgUserSecret } from './svgs'

export default {
  oninit: (vnode)=>{
    vnode.state.sections = []
    vnode.state.sections.push(["Radio", svgWalkieTalkie])
    vnode.state.sections.push(["Identities", svgUserSecret])
    vnode.state.sections.push(["Contacts", svgAddressBook])
    vnode.state.sections.push(["Channels", svgHashtag])
    vnode.state.sections.push(["Direct", svgComments])
    vnode.state.sections.push(["Map", svgMap])    
    vnode.state.sections.push(["Links", svgCircleNodes])
    vnode.state.sections.push(["Traces", svgRoute])
  },
  view:(vnode)=>{

    let radioStatusColor = "text-red-500"
    let radioStatusText = "Radio Offline"
    if (AppState.radioStore.isConnected()) {
      radioStatusColor = "text-green-500"
      radioStatusText = "Radio Online"
    }

    return m("aside.hidden md:flex md:flex-col md:w-64 bg-gray-950 border-r border-gray-800",
      m("div.p-6 border-b border-gray-800",
        m("h1.text-2xl font-bold text-primary flex items-center gap-3",
          m("span.h-8 w-8 text-mesh", m.trust(broadcastOrig)), "MCui"
        ),
        m("p.text-xs text-gray-500 mt-1", "A MeshCore compatible UI",
          m("span.float-right", "v", appVersion)
        )
      ),

      m("nav.flex-1 p-4",
        m("ul.space-y-2",
          vnode.state.sections.map((section)=>{
            let activeClass = ""
            if (section[0] == AppState.currentSection) {
              activeClass = "bg-primary/10 text-primary font-medium"
            }
            return m("li", m("button.cursor-pointer nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-500 " + activeClass, {onclick:(e)=>{
              AppState.setCurrentSection(section[0])
            }}, m("span.w-5", m.trust(section[1])), section[0]))
          })
        )
      ),

      m("div.p-4 border-t border-gray-800 text-xs text-gray-500",
        m("div.flex items-center gap-2",
          m("span.w-4 " + radioStatusColor, m.trust(svgCircle)),
          m("span", radioStatusText, " • ", AppState.identityManager.getContacts(false).length, " contacts")
        )
      )
    )
  }
}