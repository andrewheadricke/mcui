import m from 'mithril'
import {commentSlash as svgCommentSlash, send as svgSend, arrowsH as svgArrowsH, arrowLeft as svgArrowLeft } from './svgs'
import AppState from '../lib/appstate'
import { formatTimeDifference } from '../lib/utils'
import DropdownIdentSelector from './dropdown_ident_selector'
import { buildDirectTxtPacket } from '../lib/txtbuilder'

export default {
  oninit: (vnode)=>{
    vnode.state.chats = AppState.messageStore.getAllDirectMessages()
    vnode.state.activeChatKey = null
    vnode.state.activeChat = null
    vnode.state.dropdownActivator = null
    vnode.state.onIdentSelect = null

    vnode.state.draftMsg = ""

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    let sendButtonColor = "gray"
    if (vnode.state.activeChat != null) {
      sendButtonColor = "blue"
    }    
    const width = window.innerWidth;
    let chatChooser = "flex-1"
    let msgPane = "hidden"
    if (width < 768) {
      if (vnode.state.activeChat != null) {
        chatChooser = "hidden"
        msgPane = ""
      }      
    }
    return m("section.content-section flex flex-col h-full",
      m("div.p-3 md:p-6 border-b border-gray-800",
        m("h2.text-2xl md:text-3xl font-bold hidden md:inline-block me-5", "Direct Messages"),
        (()=>{
          if (vnode.state.activeChat != null) {
            let senderNamePrefix = Array.from(vnode.state.activeChat.sender.name)[0]
            let recipientNamePrefix = Array.from(vnode.state.activeChat.recipient.name)[0]
            return m("div.inline-block",
              m("div.inline-block md:hidden", m("button.rounded p-2 border-1 bg-gray-100 text-black relative top-1 cursor-pointer", {onclick:(e)=>vnode.state.activeChat=null}, m("div.w-4", m.trust(svgArrowLeft)))),
              m("span.inline-block items-center rounded-md px-2 py-1 text-sm md:text-base font-medium text-gray-500", 
                m("div.inline-flex w-10 min-w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-100 ", {style:"background-color:" + vnode.state.activeChat.sender._rgb + ";"}, senderNamePrefix),
                m("span.ms-2", vnode.state.activeChat.sender.name)
              ),
              m("div.inline-block w-7 relative top-2", m.trust(svgArrowsH)),
              m("span.inline-block items-center rounded-md px-2 py-1 text-sm md:text-base font-medium text-gray-500", 
                m("div.inline-flex w-10 min-w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-100 ", {style:"background-color:" + vnode.state.activeChat.recipient._rgb + ";"}, recipientNamePrefix),
                m("span.ms-2", vnode.state.activeChat.recipient.name)
              )
            )
          } else {
            return m("h2.text-2xl md:text-3xl font-bold block md:hidden", "Direct Messages")
          }
        })()        
      ),
      m(DropdownIdentSelector, {activator: vnode.state.dropdownActivator, onSelect: vnode.state.onIdentSelect}),
      m("div.flex-1 flex flex-row overflow-hidden",
        m("div.border-r-1 border-gray-800 overflow-y-scroll custom-scrollbar min-w-70 " + chatChooser + " md:flex-none",
          (()=>{
            let results: any[] = []
            Object.keys(vnode.state.chats).forEach((key)=>{
              let chatDetails = vnode.state.chats[key]
              //console.log(chatDetails)
              let senderNamePrefix = Array.from(chatDetails.sender.name)[0]
              let recipientElem
              if (chatDetails.recipient != null) {
                recipientElem = m("div.text-xs text-right", "local: ", chatDetails.recipient.name)
              } else {
                recipientElem = m("div.text-xs text-right cursor-pointer", {onclick:(e)=>{
                  vnode.state.dropdownActivator = e.target
                  vnode.state.onIdentSelect = (ident)=>{
                    chatDetails.recipient = ident
                  }
                  setTimeout(()=>{
                    globalThis.addEventListener('click', function(e) {
                      vnode.state.dropdownActivator = null
                      m.redraw()
                    }, {once: true})
                  }, 50)
                }}, "choose sender identity")
              }

              results.push(                
                m("div.border-b-1 border-gray-800 p-2 hover:bg-gray-800/30 cursor-pointer text-nowrap w-full flex flex-row", {onclick:()=>{
                  if (chatDetails.recipient == null) {
                    return
                  }
                  vnode.state.activeChatKey = key
                  vnode.state.activeChat = chatDetails
                }},
                  m("div.inline-block align-top relative top-1",            
                    m("div.w-12 min-w-12 h-12 rounded-full flex items-center justify-center font-bold", {style:"background-color:" + chatDetails.sender._rgb + ";"}, senderNamePrefix)
                  ),
                  m("div.inline-block p-2 text-gray-500 align-top flex-1 relative",
                    m("div.font-bold", chatDetails.sender.name),
                    recipientElem
                  )
                )
              )
            })
            return results
          })()
        ),
        m("div.flex-1 flex flex-col border-0 " + msgPane + " md:flex", {style:"margin-left:2px;"},
          (()=>{
            if (vnode.state.activeChatKey == null) {
              return m("div.flex-1 flex items-center justify-center text-gray-600",
                m("div.text-center",
                  m("div.inline-block w-18 mb-4 opacity-30", m.trust(svgCommentSlash)), // text-6xl mb-4 opacity-30"></i>
                  m("p", "Select a chat to start")
                )
              )
            } else {
              return m("div.flex-1 text-gray-600 p-4",
                AppState.messageStore.getDirectMessagesFor(vnode.state.activeChatKey).map((msg)=>{
                  return m("div.mb-2 size-fit",
                    m("div.bg-gray-200 px-2 py-1 rounded-xl text-black mb-1", msg.msg),
                    m("div.text-xs ms-1 text-gray-400", formatTimeDifference(msg.timestamp))
                  )
                })
              )
            }
          })(),          
          m("div.flex border-t-1 border-gray-800 ms-1x",
            m("input.w-full flex-grow text-gray-600 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500", {type:"text", placeholder:"Send a message...", value: vnode.state.draftMsg, oninput: (e)=>vnode.state.draftMsg=e.target.value}),
            m("button.cursor-pointer bg-" + sendButtonColor + "-500 hover:bg-" + sendButtonColor + "-600 text-white font-bold px-3 w-12", {onclick:(e)=>{
              // from our perspective, a directchat recipient is us, so when building the reply tx, the "sender" param is recipient (us)
              let pkt = buildDirectTxtPacket(vnode.state.activeChat.recipient, vnode.state.activeChat.sender, vnode.state.draftMsg)
              AppState.radioStore.sendToRadioFrame(pkt)
              vnode.state.draftMsg = ""
            }}, m.trust(svgSend))
          )
        )
      )      
    )
  }
}