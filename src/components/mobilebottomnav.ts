import m from 'mithril'
import { userSecret as svgUserSecret, addressBook as svgAddressBook, hashtag as svgHashtag, map as svgMap, comments as svgComments } from './svgs'
import AppState from '../lib/appstate'

export default {
  oninit: (vnode)=>{
    vnode.state.sections = []
    vnode.state.sections.push(["Identities", svgUserSecret])
    vnode.state.sections.push(["Contacts", svgAddressBook])
    vnode.state.sections.push(["Channels", svgHashtag])
    vnode.state.sections.push(["Direct", svgComments])
    vnode.state.sections.push(["Map", svgMap])
  },
  view: (vnode)=>{
    return m("nav.fixed md:hidden bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800",
      m("div.flex justify-around py-2", 
        vnode.state.sections.map((section)=>{
          let colorClass = "text-gray-500"
          if (section[0] == AppState.currentSection) {
            colorClass = "text-primary"
          }
          return m("button.mobile-nav-btn flex flex-col items-center py-2 px-3 hover:bg-gray-800 cursor-pointer " + colorClass, {onclick:(e)=>{
              AppState.setCurrentSection(section[0])
            }},
            m("span.w-6", m.trust(section[1])),
            m("span.text-xs mt-1", section[0])
          ) 
        })
      )
    )
  }
}
