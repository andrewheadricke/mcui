import m from 'mithril'
import AppState from '../lib/appstate'
import { plus as svgPlus, trash as svgTrash, send as svgSend, spinner as svgSpinner, broom as svgBroom } from './svgs'
import { greenToRedViaYellow, percentageToGreenToRed } from '../lib/utils'


let onCardClick = (vnode)=>{
  return {
    onclick: (e)=>{
      vnode.state.pointer = ""
      vnode.state.onCardClick = null
      vnode.state.showNewTraceForm = true
    }
  }
}

let newTraceCard = {
  oninit: (vnode)=>{
    vnode.state.pointer = "cursor-pointer"
    vnode.state.padding = "p-4"
    vnode.state.onCardClick = onCardClick(vnode)
    vnode.state.draftName = ""
    vnode.state.draftPath = ""
    vnode.state.showNewTraceForm = false

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("div.bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl w-full lg:w-2/3 xl:w-1/2 " + vnode.state.padding + " text-center " + vnode.state.pointer, vnode.state.onCardClick,
      (()=>{
        if (vnode.state.showNewTraceForm == false) {
          return m("div",
            m("div.inline-block w-12 text-gray-600", m.trust(svgPlus)),
            m("p.text-gray-500", "New Trace")
          )
        } else {
          return m("div.text-left text-gray-500", 
            m("div", "Name"),
            m("div", m("input.text-black rounded px-3 py-1 w-full", {type:"text", oninput: (e)=>vnode.state.draftName=e.target.value, value: vnode.state.draftName})),
            m("div.mt-1", "Path (hex)"),
            m("div", m("input.text-black rounded px-3 py-1 w-full", {type:"text", oninput: (e)=>vnode.state.draftPath=e.target.value, value: vnode.state.draftPath})),
            m("button.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick:(e)=>{
              if (vnode.state.draftName == "" || vnode.state.draftPath == "") {
                console.log("missing values")
                return
              }
              AppState.traceManager.addTrace(vnode.state.draftName, vnode.state.draftPath)
              vnode.state.draftName = ""
              vnode.state.draftPath = ""
              vnode.state.showNewTraceForm = false
              vnode.state.onCardClick = onCardClick(vnode)
              vnode.state.pointer = "cursor-pointer"
            }}, "Add")
          )
        }
      })()      
    )
  }
}

export default {
  view: (vnode)=>{

    return m("section.content-section block p-6 md:p-8",
      m("h2.text-2xl md:text-3xl font-bold mb-6", "Traces"),
      m(newTraceCard),
      m("ul.mt-5",
        AppState.traceManager.getTraces().map((trace)=>{

          let ratio = Math.round((trace.successes / (trace.successes + trace.fails))  * 100)
          if (isNaN(ratio)) {
            ratio = 0
          }
          let color = percentageToGreenToRed(ratio / 100)

          return m("li.border-b-1 mb-2 p-2 border-gray-800 justify-top", 
            m("span.text-lg align-top text-gray-500", trace.name),
            m("span.inline-flex align-top relative top-1 items-center ms-2 rounded-md bg-primary/10 px-1 text-xs font-medium text-primary inset-ring inset-ring-gray-500/10", {style:"padding-top:3px;padding-bottom:3px;"}, "Hops: ", trace._hops),
            m("span.inline-flex align-top relative top-1 items-center ms-2 rounded-md px-1 text-xs font-medium inset-ring inset-ring-gray-500/10", {style:"padding-top:3px;padding-bottom:3px;color:" + color +";background-color:" + color + "11;"}, ratio, "%"),
            (()=>{
              if (trace._traceActive) {
                return m("div.inline-block ms-2 w-6 fill-black", m.trust(svgSpinner))
              } else {
                let status = null
                if (trace._lastResult == true) {
                  status = m("div.inline-block border-1 border-green-500 bg-green-500/20 rounded px-2 ms-2", "success")
                } else if (trace._lastResult == false) {
                  status = m("div.inline-block border-1 border-red-500 bg-red-500/20 rounded px-2 ms-2", "failed")
                }
                return m("div.inline-block",
                  m("div.inline-block ms-2 w-5 text-gray-500 cursor-pointer align-top relative top-1", {onclick:(e)=>{              
                    AppState.traceManager.startTrace(trace)
                    .then((result)=>{
                      console.log("trace", result)
                      AppState.traceManager.saveToLocalStorage()
                      m.redraw()
                    })              
                  }}, m.trust(svgSend)),
                  status
                )
              }
            })(),
            m("div.inline-block float-end align-top",
              m("div.inline-block ms-2 w-5 text-gray-500 cursor-pointer align-top relative", {style:"top:2px;", onclick:(e)=>AppState.traceManager.clearHistory(trace)}, m.trust(svgBroom)),
              m("div.inline-block ms-2 w-5 text-gray-500 cursor-pointer align-top", {onclick:(e)=>AppState.traceManager.removeTrace(trace)}, m.trust(svgTrash))
            )
          )
        })
      )
    )
  }
}