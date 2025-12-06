import m from 'mithril'
import { towerCell as svgTowerCell, commentDots as svgCommentDots, trash as svgTrash, users as svgUsers, cog as svgCog, map as svgMap } from './svgs'
import AppState from '../lib/appstate'
import { formatTimeDifference } from "../lib/utils"
import ContactFilters from "./contactfilters"
import LocationChooser from './location_chooser'

const dropdownContact = {
  view: (vnode: any)=>{
    return m("div.z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm right-5 absolute", {style:"box-shadow: 0px 0px 6px 6px rgba(0, 0, 0, 0.1);", onmouseleave: vnode.attrs.onClose},
      m("ul.py-2 text-sm text-gray-700",
        m("li",
          m("a.block px-4 py-2 hover:bg-gray-100 font-normal", {href:"#", onclick:()=>{
            AppState.identityManager.removeIdentity(vnode.attrs.contact.getPublicKeyHex())
            vnode.attrs.onClose()
          }}, m("div.inline-block w-4 me-1", m.trust(svgTrash)), " Remove")
        ),
        m("li",
          m("a.block px-4 py-2 hover:bg-gray-100 font-normal", {href:"#", onclick:()=>{
            AppState.setActiveModal({
              view:()=>m(LocationChooser, {
                onClose: ()=>{
                  AppState.setActiveModal(null)
                }, onSave:(lat, lon)=>{
                  vnode.attrs.contact.lat = lat
                  vnode.attrs.contact.lon = lon
                  AppState.identityManager.saveIdentities()
                  AppState.setActiveModal(null)
                }
              })
            })
            vnode.attrs.onClose()
          }}, m("div.inline-block w-4 me-1", m.trust(svgMap)), " Set Location")
        )
      )
    )
  }
}

let onFilterChange = (vnode, filterString: string)=>{
  vnode.state.txtFilter = filterString
}

export default {
  oninit: (vnode)=>{
    vnode.state.txtFilter = ""
    vnode.state.showContactDropdown = false
    vnode.state.contactHoverCardIdx = null

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("section.content-section block p-6 md:p-8",
      m("h2.text-2xl md:text-3xl font-bold mb-6", "Contacts"),
      m(ContactFilters, {onFilterChange: onFilterChange.bind(null, vnode)}),
      m("div.grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4",
        AppState.identityManager.getContacts(true).map((contact, idx)=>{
          let re
          try {
            re = new RegExp(vnode.state.txtFilter, "i")
          } catch(e){}
          if (vnode.state.txtFilter.length > 0) {
            let bMatch = false
            if (vnode.state.txtFilter.startsWith("^") == false && contact.name.match(re) != null) {
              bMatch = true
            }
            if (contact.getPublicKeyHex().match(re) != null) {
              bMatch = true
            }
            if (!bMatch) {
              return
            }
          }
          return m("div.bg-gray-800 rounded-lg p-4 flex items-center justify-between relative", {onmouseover:()=>vnode.state.contactHoverCardIdx=idx, onmouseout:()=>{
              vnode.state.contactHoverCardIdx=null
            }},
            m("div.flex items-center gap-4 w-full",
              (()=>{
                //console.log(contact)
                if (contact.type == "REPEATER") {
                  return m("div.w-12 min-w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center", m("span.w-6", m.trust(svgTowerCell)))                  
                } else if (contact.type == "ROOM") { 
                  return m("div.w-12 min-w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center", m("span.w-6", m.trust(svgUsers)))
                } else {
                  let namePrefix = Array.from(contact.name)[0]
                  return m("div.w-12 min-w-12 h-12 rounded-full flex items-center justify-center font-bold", {style:"background-color:" + contact._rgb + ";"}, namePrefix)
                }
              })(),              
              m("div",
                m("p.font-medium", contact.name),
                m("p.text-xs text-gray-500", {style:"word-break:break-all;"}, "Public key: ", contact.getShortPublicKeyHex()),
                m("p.text-xs text-gray-500", "First seen: ", formatTimeDifference(contact.firstSeen)),
                m("p.text-xs text-gray-500", "Last seen: ", formatTimeDifference(contact.lastSeen)),
                (()=>{
                  if (contact.lat != 0 && contact.lon != 0) {
                    return m("p.text-xs text-gray-500", "Location: ", Math.round(contact.lat / 1000) / 1000, ", ", Math.round(contact.lon / 1000) / 1000)
                  }
                })()                
              )              
            ),
            (()=>{
              if (contact.type == "CHAT") {
                return m("div.w-6 min-w-6 me-2 text-primary cursor-pointer", {onclick:(e)=>{
                  AppState.messageStore.newDirectChat(contact)
                  AppState.setCurrentSection("Direct")
                }}, m.trust(svgCommentDots))
              }
            })(),
            (()=>{
              if (vnode.state.contactHoverCardIdx!=null && vnode.state.contactHoverCardIdx==idx) {
                return m("div.w-8 text-gray-500 cursor-pointer", {onclick:(e)=>{
                  // show dropdown
                  vnode.state.showContactDropdown = true
                }}, m.trust(svgCog))
              } else {
                return m("div.w-8")
              }
            })(),            
            (()=>{
              if (vnode.state.showContactDropdown && vnode.state.contactHoverCardIdx==idx) {
                return m(dropdownContact, {contact: contact, onClose: ()=>vnode.state.showContactDropdown=false})
              }
            })()            
          )
        })
      )
    )
  }
}
