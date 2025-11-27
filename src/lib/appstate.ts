import { IdentityManager } from "./identities";
import { ChannelManager } from "./channels";
import { PacketLogs } from "./packetlogs";
import { MessageStore } from "./messagestore";
import { RadioStore } from "./radiostore";
import { TraceManager } from "./tracemanager";

let hasInit: boolean = false
let currentSection: string = "Radio"
let showMobileSliderOver: boolean = false

let radioStore: RadioStore
let identityManager: IdentityManager
let channelManager: ChannelManager
let packetLogs: PacketLogs
let messageStore: MessageStore
let traceManager: TraceManager

let init = function() {
  if (hasInit) {
    throw new Error("appState already initialized")
  }
  hasInit = true
  currentSection = "Radio"
  showMobileSliderOver = false

  radioStore = new RadioStore()
  radioStore.init()
  identityManager = new IdentityManager()
  identityManager.init()
  channelManager = new ChannelManager()
  channelManager.init()
  packetLogs = new PacketLogs()
  packetLogs.init()
  messageStore = new MessageStore()
  messageStore.init()
  traceManager = new TraceManager()
  traceManager.init()
}

let setCurrentSection = function(name: string) {
  if (name == "Radio" || name == "Map" || name == "Identities" || name == "Direct" || name == "Contacts" || name == "Channels" || 
    name == "Neighbors" || name == "Links" || name == "Traces") {
    currentSection = name
  } else {
    throw new Error("unknown section name")
  }
}

let toggleMobileSlideOver = function() {
  if (showMobileSliderOver) {
    showMobileSliderOver = false
  } else {
    showMobileSliderOver = true
  }
}

export default {
  init,
  get radioStore() { return radioStore },
  get identityManager() { return identityManager },
  get channelManager() { return channelManager },
  get packetLogs() { return packetLogs },
  get messageStore() { return messageStore },
  get traceManager() { return traceManager },
  get currentSection() { return currentSection },
  setCurrentSection,
  toggleMobileSlideOver,
  get getShowMobileSlideOver() { return showMobileSliderOver }
}
