import m from 'mithril'
import { xmark as svgXmark, circleNodes as svgCircleNodes, route as svgRoute, radio as svgRadio, users as svgUsers } from './svgs'
import AppState from '../lib/appstate'

export default {
  view: (vnode)=>{
    let display = "hidden"
    if (AppState.getShowMobileSlideOver) { 
      display = ""
    }

    return m("div.fixed inset-0 z-2000 " + display,
      m("div.absolute inset-0 bg-black/70"),
      m("aside.absolute left-0 top-0 bottom-0 w-72 bg-gray-950 p-6",
        m("div.flex justify-between items-center",
          m("h1.text-2xl font-bold text-primary", "MCui"),          
          m("button.cursor-pointer text-gray-100", {onclick: (e)=>AppState.toggleMobileSlideOver()}, m("div.w-8", m.trust(svgXmark)))
        ),
        m("p.text-sm text-gray-500 mb-5", "A MeshCore compatible UI",
          m("span.float-right", "v", appVersion)
        ),
        m("nav.space-y-3",
          m("button.nav-btn w-full text-left px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium cursor-pointer", {onclick:(e)=>{
              AppState.toggleMobileSlideOver()
              AppState.setCurrentSection("Radio")
            }},
            m("div.inline-block w-6 me-2", m.trust(svgRadio)), 
            m("div.inline-block align-top", "Radios")
          ),
          m("button.nav-btn w-full text-left px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium cursor-pointer", {onclick:(e)=>{
              AppState.toggleMobileSlideOver()
              AppState.setCurrentSection("Links")
            }},
            m("div.inline-block w-6 me-2", m.trust(svgCircleNodes)), 
            m("div.inline-block align-top", "Links")
          ),
          m("button.nav-btn w-full text-left px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium cursor-pointer", {onclick:(e)=>{
              AppState.toggleMobileSlideOver()
              AppState.setCurrentSection("Traces")
            }},
            m("div.inline-block w-6 me-2", m.trust(svgRoute)), 
            m("div.inline-block align-top", "Traces")
          ),
          m("button.nav-btn w-full text-left px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium cursor-pointer", {onclick:(e)=>{
              AppState.toggleMobileSlideOver()
              AppState.setCurrentSection("Rooms")
            }},
            m("div.inline-block w-6 me-2", m.trust(svgUsers)), 
            m("div.inline-block align-top", "Rooms")
          )
        )
      )
    )
  }
}
  