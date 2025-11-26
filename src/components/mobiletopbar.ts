import m from 'mithril'
import { bars } from './svgs'
import AppState from '../lib/appstate'

export default {
  view: (vnode)=>{
    return m("header.flex md:hidden items-center justify-between p-4 bg-gray-950 border-b border-gray-800",
      m("button.text-2xl cursor-pointer",
        m("div.h-8 w-8", {onclick: (e)=>AppState.toggleMobileSlideOver()}, m.trust(bars))
      ),
      m("h1.text-xl font-bold text-primary", "MCui"),
      m("div.inline-block w-8")
    )
  }
}