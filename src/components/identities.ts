import m from 'mithril'
import { plus as svgPlus, key as svgKey, circlePlus as svgCirclePlus } from './svgs'
import AppState from '../lib/appstate'
import IdentityCard from './identity_card'

let onCardClick = function(vnode){
  return {onclick:(e)=>{
  vnode.state.step++
  vnode.state.pointer = ""
  vnode.state.onCardClick = null
  }}
}

let newIdentityCard = {
  oninit: (vnode)=>{
    vnode.state.pointer = "cursor-pointer"
    vnode.state.padding = "p-12"
    vnode.state.onCardClick = onCardClick(vnode)
    vnode.state.step = 1
    vnode.state.draftImportKey = ""

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("div.bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl " + vnode.state.padding + " text-center " + vnode.state.pointer, vnode.state.onCardClick,
      (()=>{
        if (vnode.state.step == 1) {
          return m("div",
            m("div.inline-block w-12 text-gray-600 mb-2", m.trust(svgPlus)),
            m("p.text-gray-500", "Add Identity")
          )
        } else if (vnode.state.step == 2) {
          return m("div.flex justify-evenly",
            m("div.inline-block text-gray-600 mb-2 align-top pt-3 justify-items-center cursor-pointer", {onclick:(e)=>{vnode.state.step++;vnode.state.padding="p-3"}}, m("div.w-8", m.trust(svgKey)), "Import"),
            m("div.inline-block border-end border-1 h-20 mx-5 text-gray-700"),
            m("div.inline-block text-gray-600 mb-2 align-top pt-3 justify-items-center cursor-pointer", {onclick:async (e)=>{
              await AppState.identityManager.generateNew()
              vnode.state.pointer = "cursor-pointer"
              vnode.state.onCardClick = onCardClick(vnode)
              vnode.state.step = 1
            }}, m("div.w-8", m.trust(svgCirclePlus)), "New")
          )
        } else if (vnode.state.step == 3) {
          return m("div", 
            m("div.text-gray-500 mt-1", "Private Key Hex:"),
            m("input.block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6", {type:"text", value: vnode.state.draftImportKey, oninput:(e)=>vnode.state.draftImportKey=e.target.value}),
            m("button.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick:(e)=>{
              AppState.identityManager.importPrivateKey(vnode.state.draftImportKey)
              vnode.state.pointer = "cursor-pointer"
              vnode.state.onCardClick = onCardClick(vnode)
              vnode.state.step = 1
              vnode.state.padding = "p-12"
            }}, "Import")
          )
        }
      })()      
    )
  }
}

export default {
  view: (vnode)=>{
    return m("section.content-section block p-6 md:p-8",
      m("h2.text-2xl md:text-3xl font-bold mb-6", "My Identities"),
      m("div.grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
        AppState.identityManager.getMyIdentities().map((identity)=>{
          return m(IdentityCard, {identity: identity})          
        }),
        m(newIdentityCard)
      )
    )
  }
}