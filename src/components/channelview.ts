import m from "mithril"
import { formatTimeDifference, hslToRgb } from '../lib/utils'
import { send as svgSend, dropdownArrow as svgDropdownArrow, trash as svgTrash } from './svgs'
import AppState from '../lib/appstate'
import { buildGroupTxtPacket } from "../lib/txtbuilder";
import fnv1a from 'fnv1a'
import DropdownIdentSelector from './dropdown_ident_selector'

let sendGroupMsg = function(vnode) {
  //console.log('send grup msg')
  if (vnode.state.selectedIdentity == null) {
    console.log('no identity selected')
    return
  }

  let pktBytes = buildGroupTxtPacket(vnode.state.selectedIdentity, vnode.attrs.channel, vnode.state.draftMsg)
  AppState.radioStore.sendToRadioFrame(pktBytes)
  vnode.state.draftMsg = ""
}


let ChannelView = {
  oninit: (vnode)=>{    
    vnode.state.dropdownActivator = null
    vnode.state.selectedIdentity = null
    vnode.state.selectedIdentityText = "Select Identity"
    vnode.state.draftMsg = ""
    vnode.state.name = ""    
    
    Object.seal(vnode.state)
  },
  oncreate: (vnode)=>{
    let scrollPane = document.getElementById("messagesScrollPane")
    scrollPane.scrollTop = scrollPane.scrollHeight
  },
  onupdate:(vnode)=>{
    let scrollPane = document.getElementById("messagesScrollPane")
    scrollPane.scrollTop = scrollPane.scrollHeight
  },
  view: (vnode)=>{
    return m("div.flex flex-col h-full",
      m("div.p-6 md:p-8",
        m("h2.text-2xl md:text-3xl font-bold", 
          "Channel", m("div.inline-block ms-4 text-base rounded-xl bg-blue-500 px-4 py-2 relative", {style:"top:-5px;"}, vnode.attrs.channel.name),
          m("div.inline-block text-gray-500 w-4 ms-2 cursor-pointer", {onclick:(e)=>{
            AppState.channelManager.removeChannel(vnode.attrs.channel.name)
            vnode.attrs.closeChannelView()
          }}, m.trust(svgTrash))
        )
      ),
      m("div.flex-1 flex flex-col overflow-hidden",
        m("div.overflow-y-auto custom-scrollbar ps-4 h-full", {id:"messagesScrollPane"},
          AppState.messageStore.getMessagesFor(vnode.attrs.channel.name).map((msg)=>{
            let fnv = fnv1a(msg.senderName)
            let bgColor = hslToRgb(fnv, 0.6, 0.5)
            let namePrefix = Array.from(msg.senderName)[0]
            return m("div.align-top mb-2",               
              m("div.inline-block align-top",
                m("div.w-12 min-w-12 h-12 rounded-full flex items-center justify-center font-bold", {style:"background-color:" + bgColor + ";"}, namePrefix),
              ),
              m("div.inline-block ms-2",
                m("div",
                  m("div.inline-block font-blue-200", msg.senderName),
                  m("div.inline-block text-xs ms-1 text-gray-400", formatTimeDifference(msg.timestamp))
                ),
                m("div.bg-gray-200 px-2 py-1 rounded-xl text-black", msg.msg),
              )
            )
          })
        ),
        m("div.flex border-t-1 border-gray-800",
          m("button.px-2 min-w-50 border-r-0 cursor-pointer", {onclick:(e)=>{
            //if (vnode.state.showDropdown) {
            //  return
            //}
            vnode.state.dropdownActivator = e.target
            setTimeout(()=>{
              globalThis.addEventListener('click', function(e) {
                vnode.state.dropdownActivator = null
                m.redraw()
              }, {once: true})
            }, 50)
          }}, vnode.state.selectedIdentityText, " ", m.trust(svgDropdownArrow)),
          m(DropdownIdentSelector, {ignoreActivatorPosition: true, classes:"bottom-0", activator: vnode.state.dropdownActivator, onSelect:(identity)=>{
            vnode.state.selectedIdentity = identity
            vnode.state.selectedIdentityText = identity.name
          }}),
          m("input.w-full flex-grow text-gray-600 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500", {type:"text", placeholder:"Send a message...", value: vnode.state.draftMsg, oninput: (e)=>vnode.state.draftMsg=e.target.value}),
          m("button.cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 w-14", {onclick:(e)=>{
            if (vnode.state.draftMsg.length == 0) {
              return
            }
            sendGroupMsg(vnode)
          }}, m.trust(svgSend))
        )
      )      
    )
  }
}

export default ChannelView