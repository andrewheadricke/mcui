import m from 'mithril'
import { formatTimeDifference } from "../lib/utils"
import { cog as svgCog, edit as svgEdit, circleCheck as svgCircleCheck, save as svgSave, broadcast as svgBroadcast } from './svgs'
import { satellite as svgSatellite, trash as svgTrash } from './svgs'
import AppState from '../lib/appstate'
import { Packet } from "meshcore.js"

const dropdownIdentity = {
  view: (vnode: any)=>{
    return m("div.z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-40 right-5 absolute", {style:"box-shadow: 0px 0px 6px 6px rgba(0, 0, 0, 0.1);"},
      m("ul.py-2 text-sm text-gray-700",
        m("li",
          m("a.block px-4 py-2 hover:bg-gray-100 font-normal", {href:"#", onclick:()=>{
            //console.log('on edit click')
            vnode.attrs.showNameEdit()
          }}, m.trust(svgEdit), " Edit Name")
        ),
        (()=>{
          if (vnode.attrs.isContact == false) {
            let autoAckColor = ""
            if (vnode.attrs.autoAck) {
              autoAckColor = "text-green-600"
            }
            return [
              m("li",
                m("a.block px-4 py-2 hover:bg-gray-100 " + autoAckColor, {href:"#", onclick:()=>{
                  let identity = AppState.identityManager.getIdentity(vnode.attrs.publicKey)
                  identity.toggleAutoAck()
                  AppState.identityManager.saveIdentities()
                }}, m.trust(svgCircleCheck), " Auto ACK")
              ),
              m("li",
                m("a.block px-4 py-2 hover:bg-gray-100", {href:"#", onclick:async ()=>{
      
                  let identity = AppState.identityManager.getIdentity(vnode.attrs.publicKey)
                  let pkt = await identity.buildAdvertPacket(Packet.ROUTE_TYPE_DIRECT)
                  //console.log(pkt)
      
                  let decodedPacket = Packet.fromBytes(pkt)
                  let payload = decodedPacket.parsePayload()
                  //console.log(payload)
      
                  const data = new Uint8Array(pkt.length + 1);
                  data[0] = 53
                  data.set(pkt, 1)
                  
                  let result = await AppState.radioStore.sendToRadioFrame(data)
                  if (result != null) {
                    console.log(result)
                  }
                }}, m.trust(svgBroadcast), " Advert (Direct)")
              ),
              m("li",
                m("a.block px-4 py-2 hover:bg-gray-100", {href:"#", onclick: async ()=>{
                  let identity = AppState.identityManager.getIdentity(vnode.attrs.publicKey)
                  let pkt = await identity.buildAdvertPacket(Packet.ROUTE_TYPE_FLOOD)
      
                  const data = new Uint8Array(pkt.length + 1);
                  data[0] = 53
                  data.set(pkt, 1)
                  
                  let result = await AppState.radioStore.sendToRadioFrame(data)
                  if (result != null) {
                    console.log(result)
                  }
                }}, m.trust(svgSatellite), " Advert (Flood)")
              )
            ]
          }
        })(),
        m("li",
          m("a.block px-4 py-2 hover:bg-gray-100", {href:"#", onclick:()=>{
            AppState.identityManager.removeIdentity(vnode.attrs.publicKey)
          }}, m.trust(svgTrash), " Remove")
        )
      )
    )
  }
}

export default {
  oninit: (vnode)=>{
    vnode.state.menuDisplay = "hidden"
    vnode.state.menuVisible = false
    vnode.state.showNameEdit = false
    vnode.state.editName = vnode.attrs.identity.name
    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("div.bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-primary transition relative", {onmouseover:()=>vnode.state.menuDisplay="", onmouseout:()=>vnode.state.menuDisplay="hidden"},
      m("div.absolute " + vnode.state.menuDisplay, {style:"right:10px;"}, 
        m("a.text-gray-500", {href:"#", onclick:(e)=>{
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
      ),
      (()=>{
        if (vnode.state.menuVisible) {
          return m(dropdownIdentity, {autoAck: vnode.attrs.identity.autoAck, isContact: vnode.attrs.identity.privateKey == null, showNameEdit: ()=>vnode.state.showNameEdit=true, publicKey: vnode.attrs.identity.getPublicKeyHex()})
        }
      })(),
      (()=>{
        if (vnode.state.showNameEdit == false) {
          return m("p.text-gray-500", "Name: ", vnode.attrs.identity.name)
        } else {
          return m("div.flex", 
            m("input.flex-grow border border-gray-300 rounded-l-md px-2 w-full max-w-8/10 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500", {style:"padding-top:1px;padding-bottom:1px;", type:"text", placeholder:"name", value: vnode.state.editName, oninput: (e)=>vnode.state.editName=e.target.value}),
            m("button.bg-blue-500 hover:bg-blue-600 text-white font-bold px-1 rounded-r-md", {onclick:()=>{
              vnode.attrs.identity.name = vnode.state.editName
              AppState.identityManager.saveIdentities()
              vnode.state.showNameEdit = false
            }}, m.trust(svgSave))
          )
        }
      })(),
      m("p.text-gray-500", "Public Key: ", vnode.attrs.identity.getShortPublicKeyHex()),
      m("p.text-gray-500", "type: ", vnode.attrs.identity.type),
      m("p.text-gray-500", "First seen: ", formatTimeDifference(vnode.attrs.identity.firstSeen)),
      m("p.text-gray-500", "Last seen: ", formatTimeDifference(vnode.attrs.identity.lastSeen)),
      (()=>{
        if (vnode.attrs.identity.lat != 0 && vnode.attrs.identity.lon != 0) {
          return m("p.text-gray-500", "lat: ", Math.round(vnode.attrs.identity.lat / 1000) / 1000, m("span.ms-2", "lon: "), Math.round(vnode.attrs.identity.lon / 1000) / 1000)
        } 
      })()
    )
  }
}