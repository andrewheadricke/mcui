import m from 'mithril'
import AppState from '../lib/appstate'

let onCardClick = function(vnode){
  return {onclick:(e)=>{
    vnode.state.showNewChannelForm = true
    vnode.state.onCardClick = null
    vnode.state.pointer = ""
  }}
}

let newMessageForm = {
  oninit: (vnode)=>{
    vnode.state.draftTimestamp = ""
    vnode.state.draftAuthor = ""
    vnode.state.draftMsg = ""
  },
  view: (vnode)=>{
    return m("div.text-left text-gray-500", 
      m("div.flex space-x-2",
        m("div.grow",
          m("div", "Timestamp"),
          m("div", m("input.text-black rounded px-3 py-1", {type:"text", oninput: (e)=>vnode.state.draftTimestamp=e.target.value, value: vnode.state.draftTimestamp}))
        ),
        m("div.grow",
          m("div", "Author (4 byte hex)"),
          m("div", m("input.text-black rounded px-3 py-1", {type:"text", oninput: (e)=>vnode.state.draftAuthor=e.target.value, value: vnode.state.draftAuthor}))
        )
      ),
      m("div.mt-1", "Message"),
      m("div", m("input.text-black rounded px-3 py-1 w-full", {type:"text", oninput: (e)=>vnode.state.draftMsg=e.target.value, value: vnode.state.draftMsg})),
      m("button.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick:(e)=>{
        AppState.roomManager.getRoom(vnode.attrs.roomOwnerIdentity).pinMessage(vnode.state.draftTimestamp, vnode.state.draftAuthor, vnode.state.draftMsg)
        AppState.roomManager.saveToLocalStorage()
        vnode.state.draftTimestamp = ""
        vnode.state.draftAuthor = ""
        vnode.state.draftMsg = ""
      }}, "Add")
    )
  }
}

export default {
  oninit: (vnode)=>{
    vnode.state.expandRoomIdx = null
  },
  view: (vnode)=>{
    return m("section.content-section flex flex-col h-full",
      m("div.p-6 md:p-8",
        m("h2.text-2xl md:text-3xl font-bold mb-4", "Rooms"),
        m("div.grid grid-cols-1 md:grid-cols-2 gap-6",
          AppState.identityManager.getRooms().map((room, idx)=>{
            return m("div.bg-gray-800 rounded-xl p-6 border border-gray-700",
              m("h3.text-xl font-bold text-mesh cursor-pointer", {onclick:(e)=>{
                vnode.state.expandRoomIdx = idx
              }}, room.name),
              //m("p.text-sm text-gray-400", channel.participants.size, " participants • Last Message: ", lastMsg) 
              (()=>{
                if (vnode.state.expandRoomIdx == idx) {
                  return m("div",
                    m(newMessageForm, {roomOwnerIdentity: room})
                  )
                }
              })()
            )
          })
        ),
        (()=>{
          if (AppState.identityManager.getRooms().length == 0) {
            return m("div.text-gray-500 font-bold", "No room servers found")
          }
        })()
      )
    )
  }
}