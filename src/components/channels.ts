import m from 'mithril'
import { plus as svgPlus } from './svgs'
import AppState from '../lib/appstate'
import { formatTimeDifference } from "../lib/utils"
import ChannelView from './channelview'

let onCardClick = function(vnode){
  return {onclick:(e)=>{
    vnode.state.showNewChannelForm = true
    vnode.state.onCardClick = null
    vnode.state.pointer = ""
  }}
}

let newChannelCard = {
  oninit: (vnode)=>{
    vnode.state.pointer = "cursor-pointer"
    vnode.state.padding = "p-4"
    vnode.state.onCardClick = onCardClick(vnode)
    vnode.state.draftChannelName = ""
    vnode.state.showNewChannelForm = false

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("div.bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl " + vnode.state.padding + " text-center " + vnode.state.pointer, vnode.state.onCardClick,
      (()=>{
        if (vnode.state.showNewChannelForm == false) {
          return m("div",
            m("div.inline-block w-12 text-gray-600", m.trust(svgPlus)),
            m("p.text-gray-500", "New Channel")
          )
        } else {
          return m("div", 
            m("div.text-gray-500 mt-1", "Channel name:"),
            m("input.block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6", {type:"text", value: vnode.state.draftChannelName, oninput:(e)=>vnode.state.draftChannelName=e.target.value}),
            m("button.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick:(e)=>{
              AppState.channelManager.addChannel(vnode.state.draftChannelName, null)
              vnode.state.pointer = "cursor-pointer"
              vnode.state.onCardClick = onCardClick(vnode)
              vnode.state.showNewChannelForm = false
              vnode.state.draftChannelName = ""
            }}, "Add")
          )
        }
      })()      
    )
  }
}


export default {
  oninit: (vnode)=>{
    vnode.state.viewingChannel = null
    AppState.clearCurrentSectionParams()
  },
  onbeforeupdate: (vnode)=>{
    if (AppState.getCurrentSectionParams().sidebarClicked) {
      vnode.state.viewingChannel = null
      AppState.clearCurrentSectionParams()
    }
  },
  view: (vnode)=>{
    return m("section.content-section flex flex-col h-full",
      (()=>{
        if (vnode.state.viewingChannel == null) {
          return m("div.p-6 md:p-8",
            m("h2.text-2xl md:text-3xl font-bold mb-4", "Channels"),
            m("div.grid grid-cols-1 md:grid-cols-2 gap-6",
              AppState.channelManager.getChannels().map((channel)=>{
                let lastMsg = "Never"
                if (channel.lastMsg != null) {
                  lastMsg = formatTimeDifference(channel.lastMsg)
                }
                return m("div.bg-gray-800 rounded-xl p-6 border border-gray-700",
                  m("h3.text-xl font-bold text-mesh cursor-pointer", {onclick:(e)=>{
                    vnode.state.viewingChannel = channel
                  }}, channel.name),
                  m("p.text-sm text-gray-400", channel.participants.size, " participants • Last Message: ", lastMsg) 
                )
              }),
              m(newChannelCard)
            )
          )
        } else {
          return m(ChannelView, {channel: vnode.state.viewingChannel, closeChannelView: ()=>vnode.state.viewingChannel = null})
        }
      })()
    )
  }
}