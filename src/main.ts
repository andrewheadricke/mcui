import m from "mithril"

import AppState from './lib/appstate'
import Layout from "./components/layout"

AppState.init()
AppState.radioStore.tryAutoConnect()

m.mount(document.getElementById("app"), Layout)
