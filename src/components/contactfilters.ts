import m from 'mithril'

export default {
  oninit:(vnode)=>{
    vnode.state.filterTxt = ""
  },
  view: (vnode)=>{
    return m("div.mb-2", 
      m("input.darkinput rounded text-gray-400 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500", {
        id: "filterInput",
        type:"text", 
        placeholder:"filter ^prefix", 
        value: vnode.state.filterTxt, 
        oninput:(e)=>{
          vnode.state.filterTxt = e.target.value
          vnode.attrs.onFilterChange(vnode.state.filterTxt)
        }
      })
    )
  }
}