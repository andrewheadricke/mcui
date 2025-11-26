import m from 'mithril'
import { towerCell as svgTowerCell, commentDots as svgCommentDots, trash as svgTrash } from './svgs'
import AppState from '../lib/appstate'
import { formatTimeDifference } from "../lib/utils"

export default {
  view: (vnode)=>{
    return m("section.content-section block p-6 md:p-8",
      m("h2.text-2xl md:text-3xl font-bold mb-6", "Contacts"),
      m("div.space-y-3",        
        AppState.identityManager.getContacts(true).map((contact)=>{
          return m("div.bg-gray-800 rounded-lg p-4 flex items-center justify-between max-w-150",
            m("div.flex items-center gap-4 w-full",
              (()=>{
                //console.log(contact)
                if (contact.type == "REPEATER") {
                  return m("div.w-12 min-w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center", m("span.w-6", m.trust(svgTowerCell)))
                } else {
                  let namePrefix = Array.from(contact.name)[0]
                  return m("div.w-12 min-w-12 h-12 rounded-full flex items-center justify-center font-bold", {style:"background-color:" + contact._rgb + ";"}, namePrefix)
                }
              })(),              
              m("div",
                m("p.font-medium", contact.name),
                m("p.text-xs text-gray-500", {style:"word-break:break-all;"}, "Public key: ", contact.getShortPublicKeyHex()),
                m("p.text-xs text-gray-500", "First seen: ", formatTimeDifference(contact.firstSeen)),
                m("p.text-xs text-gray-500", "Last seen: ", formatTimeDifference(contact.lastSeen))
              )              
            ),
            (()=>{
              if (contact.type == "CHAT") {
                return m("div.w-6 min-w-6 text-primary cursor-pointer", {onclick:(e)=>{
                  AppState.messageStore.newDirectChat(contact)
                  AppState.setCurrentSection("Direct")
                }}, m.trust(svgCommentDots))
              }
            })(),
            m("div.w-8 text-gray-500 cursor-pointer", {onclick:(e)=>{
              AppState.identityManager.removeIdentity(contact.getPublicKeyHex())
              m.redraw()
            }}, m.trust(svgTrash))
          )
        })
      )
    )
  }
}
