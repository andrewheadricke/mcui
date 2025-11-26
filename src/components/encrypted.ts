import m from 'mithril'
import AppState from '../lib/appstate'

export default {

  view: (vnode)=>{

    return m("section.content-section block p-6 md:p-8",
      m("h2.text-2xl md:text-3xl font-bold mb-6", "Encrypted")
    )
  }
}