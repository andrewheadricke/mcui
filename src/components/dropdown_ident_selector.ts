import m from 'mithril'
import AppState from '../lib/appstate'

let updateDropdown= function(vnode) {
  if (vnode.attrs.activator != null) {
    vnode.state.hidden = ""
    let bounds = vnode.attrs.activator.getBoundingClientRect()
    if (vnode.attrs.ignoreActivatorPosition == null) {
      vnode.state.position = "top:" + Math.round(bounds.y) + "px;left:" + Math.round(bounds.x) + "px;"
    }
  } else {
    vnode.state.hidden = "hidden"
    vnode.state.position = ""
  }
}

export default {
  oninit:(vnode)=>{
    vnode.state.hidden = "hidden"
    vnode.state.position = ""
    vnode.state.classes = ""
    if (vnode.attrs.classes) {
      vnode.state.classes = vnode.attrs.classes
    }
    updateDropdown(vnode)
  },
  onbeforeupdate:(vnode)=>{
    updateDropdown(vnode)
  },
  view: (vnode: any)=>{
    return m("div.z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-60 absolute " + vnode.state.hidden + " " + vnode.state.classes, {style: "box-shadow: 0px 0px 6px 6px rgba(0, 0, 0, 0.1);" + vnode.state.position },
      m("ul.py-2 text-sm text-gray-700",
        AppState.identityManager.getMyIdentities().map((identity)=>{
          return m("li",
            m("a.block px-4 py-2 hover:bg-gray-100 font-normal", {href:"#", onclick:(e)=>{
              e.preventDefault()
              vnode.attrs.onSelect(identity)
            }}, identity.name)
          )
        })
      )
    )
  }
}