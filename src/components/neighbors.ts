import m from 'mithril'
import { bytesToHex } from '@noble/hashes/utils.js'
import AppState from '../lib/appstate'

export default {

  view: (vnode)=>{

    let data = AppState.packetLogs.getIngressStats()
    for (let prop in data) {
      if (typeof data[prop].publicKey == "object") {
        data[prop].publicKey = bytesToHex(data[prop].publicKey)
      }
    }
    let dataStr = JSON.stringify(data)

    return m("section.content-section block p-6 md:p-8",
      m("h2.text-2xl md:text-3xl font-bold mb-6", "Neighbors"),
      m("div.break-all", dataStr)
    )
  }
}