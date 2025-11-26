import m from 'mithril'
import { plus as svgPlus, plug as svgPlug } from './svgs'
import { websocket as svgWebsocket, bluetooth as svgBluetooth, usb as svgUsb } from './svgs'
import { cog as svgCog, trash as svgTrash, plugCircleCheck as svgPlugCircleCheck } from './svgs'
import AppState from '../lib/appstate'

let NewRadioForm = {
  oninit: (vnode)=>{
    vnode.state.connectionType = ""
    vnode.state.draftWebsocketUrl = "ws://localhost:5000"
    vnode.state.showConnectDropdown = "hidden"
  },
  view: (vnode)=>{
    return m("div.bg-gray-800/50 min-h-46 border-2 border-dashed border-gray-700 rounded-xl p-2 text-left text-gray-500",
      m("div.text-gray-500", "Connection type:"),
      m("button.bg-blue-500 hover:bg-blue-700 text-white font-bold mt-1 py-1 px-4 rounded-full w-full", {
        onclick: ()=>{
          if (vnode.state.showConnectDropdown == "") {
            return
          }
          vnode.state.showConnectDropdown=""
          setTimeout(()=>{
            globalThis.addEventListener('click', function(e) {
              vnode.state.showConnectDropdown = "hidden"
              m.redraw()
            }, {once: true})
          }, 50)
        }
      }, (vnode.state.connectionType) == ""? "Select option": vnode.state.connectionType),
      m("div.z-10 absolute bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-45 " + vnode.state.showConnectDropdown, {style:"box-shadow: 0px 0px 6px 6px rgba(0, 0, 0, 0.1);"},
        m("ul.py-2 text-sm text-gray-700",
          m("li",
            m("a.block px-4 py-2 hover:bg-gray-100 font-normal", {href:"#", onclick:(e)=>{
              e.preventDefault()
              vnode.state.connectionType = "websocket"
            }}, m("div", 
              m("div.inline-block h-6 w-6", m.trust(svgWebsocket)), 
              m("div.inline-block align-top ms-1", {style:"margin-top:1px;"}, "WebSocket")
            ))
          ),
          m("li",
            m("a.block px-4 py-2 hover:bg-gray-100 font-normal", {href:"#", onclick:(e)=>{
              e.preventDefault()
              vnode.state.connectionType = "ble"
            }}, m("div", 
              m("div.inline-block h-6 w-6", m.trust(svgBluetooth)), 
              m("div.inline-block align-top ms-1", {style:"margin-top:2px;"}, "BLE")
            ))
          ),
          m("li",
            m("a.block px-4 py-2 hover:bg-gray-100 font-normal", {href:"#", onclick:(e)=>{
              e.preventDefault()
              vnode.state.connectionType = "serial"
            }}, m("div", 
              m("div.inline-block h-6 w-6", m.trust(svgUsb)), 
              m("div.inline-block align-top ms-1", {style:"margin-top:2px;"}, "USB/Serial")
            ))
          )
        )
      ),
      (()=>{
        if (vnode.state.connectionType == "websocket") {
          return [
            m("div.text-gray-500 mt-1", "Websocket Url:"),
            m("input.block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6", {type:"text", value: vnode.state.draftWebsocketUrl, oninput:(e)=>vnode.state.draftWebsocketUrl=e.target.value})
          ]
        }
      })(),
      (()=>{
        if (vnode.state.connectionType != "") {
          return m("button.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick: (e)=>{
            let newRadio = AppState.radioStore.add(vnode.state.connectionType, vnode.state.draftWebsocketUrl)
            AppState.radioStore.connect(newRadio)
            .then(()=>{
              m.redraw()
            })
            vnode.attrs.onConnect()            
          }}, m("div.w-5 inline-block", {style:"position:relative;top:3px;"}, m.trust(svgPlug)), " Connect")
        }
      })()      
    )
  }
}

let dropdownRadio = {
  view:(vnode)=>{
    let autoConnectColor = ""
    if (vnode.attrs.radio.autoConnect) {
      autoConnectColor = "text-green-600"
    }

    return m("div.z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-40 right-5 absolute", {style:"box-shadow: 0px 0px 6px 6px rgba(0, 0, 0, 0.1);"},
      m("ul.py-2 text-sm text-gray-700",
        m("li",
          m("a.block px-4 py-2 hover:bg-gray-100 font-normal " + autoConnectColor, {href:"#", onclick:()=>{
            vnode.attrs.radio.toggleAutoConnect()
            AppState.radioStore.saveToLocalStorage()
          }}, m("div.inline-block w-5 me-2", m.trust(svgPlugCircleCheck)), m("div.inline-block align-top", "Auto-connect"))
        ),
        m("li",
          m("a.block px-4 py-2 hover:bg-gray-100 font-normal", {href:"#", onclick:()=>{
            AppState.radioStore.removeRadio(vnode.attrs.radio)
          }}, m("div.inline-block w-5 me-2", m.trust(svgTrash)), m("div.inline-block align-top", "Remove"))
        )
      )
    )
  }
}

export default {
  oninit: (vnode)=>{
    vnode.state.showNewRadioForm = false
    vnode.state.radioHoverCardIdx = null
    vnode.state.menuVisible = false;

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("section.content-section block p-6 md:p-8",
      m("h2.text-2xl md:text-3xl font-bold mb-6", "Radio"),
      m("div.grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
        AppState.radioStore.getRadios().map((radio, idx)=>{

          let dropdownCog
          if (vnode.state.radioHoverCardIdx == idx) {
            dropdownCog = m("div.text-gray-500 absolute mt-2 cursor-pointer", {style:"right:20px;", onclick:(e)=>{
              e.preventDefault()
                if (vnode.state.menuVisible) {
                  return
                }
                vnode.state.menuVisible = true
                
                setTimeout(()=>{
                  globalThis.addEventListener('click', function(e) {
                    vnode.state.menuVisible = false
                    m.redraw()
                  }, {once: true})
                }, 50)
            }}, m.trust(svgCog))
          }

          let connectedNotice = ""
          if (radio == AppState.radioStore.getConnected()) {
            connectedNotice = m("div.w-full justify-items-end", 
              m("div.text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded", "Connected")
            )
          }

          return m("div.bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-primary transition relative", {onmouseover:()=>vnode.state.radioHoverCardIdx=idx, onmouseout:()=>vnode.state.radioHoverCardIdx=null},
            connectedNotice,
            (()=>{
              if (vnode.state.radioHoverCardIdx == idx && vnode.state.menuVisible) {
                return m(dropdownRadio, {radio: radio})
              }
            })(),
            dropdownCog,
            m("p.text-gray-500", "Name: ", m("span.font-bold", radio.username)),
            m("p.text-gray-500", "Hardware: ", m("span.font-bold", radio.hardware)),
            m("p.text-gray-500", "Firmware: ", m("span.font-bold", radio.firmware)),
            m("p.text-gray-500", "Firmware Date: ", m("span.font-bold", radio.firmwareDate)),
            m("p.text-gray-500", "Send Raw Packet support: ", m("span.font-bold", JSON.stringify(radio.sendRawPacketSupport))),
            m("div.mt-2 flex justify-center", 
              (()=>{
                if (connectedNotice == "") {
                  return m("button.border-1 border-primary hover:bg-primary/15 text-gray-300 font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick:(e)=>{
                      AppState.radioStore.connect(radio)
                    }},
                    m("div.w-5 inline-block me-1", {style:"position:relative;top:3px;"}, m.trust(svgPlug)), "Connect"
                  )
                } else if (radio.sendRawPacketSupport == false) {
                  return m("div.inline-block bg-red-200/10 border border-red-400 text-red-700 px-3 py-1 text-sm rounded relative", "READ ONLY mode without send raw packet support!")
                }
              })()
            )
          )
        }),
        // new radio card
        (()=>{
          if (!vnode.state.showNewRadioForm) {
            return m("div.bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center cursor-pointer", {onclick:()=>{
                vnode.state.showNewRadioForm = true
              }},
              m("div.inline-block w-12 text-gray-600 mb-2", m.trust(svgPlus)),
              m("p.text-gray-500", "New Radio")
            )
          } else {
            return m(NewRadioForm, {onConnect:()=>vnode.state.showNewRadioForm=false})
          }
        })()
      )
    )
  }
}