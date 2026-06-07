import m from "mithril"

import AppState from './lib/appstate'
import Layout from "./components/layout"

declare global {
  interface Window { CMD_SEND_RAW_PACKET: number; }
}

window.CMD_SEND_RAW_PACKET = 65

AppState.init()
AppState.radioStore.tryAutoConnect()

m.mount(document.getElementById("app"), Layout)
