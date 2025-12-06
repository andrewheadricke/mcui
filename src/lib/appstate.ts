import { IdentityManager } from "./identities";
import { ChannelManager } from "./channels";
import { PacketLogs } from "./packetlogs";
import { MessageStore } from "./messagestore";
import { RadioStore } from "./radiostore";
import { TraceManager } from "./tracemanager";
import { RoomManager } from "./roommanager";

let hasInit: boolean = false
let currentSection: string = "Radio"
let currentSectionParams: any = {}
let showMobileSliderOver: boolean = false
let activeModal = null

let radioStore: RadioStore
let identityManager: IdentityManager
let channelManager: ChannelManager
let packetLogs: PacketLogs
let messageStore: MessageStore
let traceManager: TraceManager
let roomManager: RoomManager

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
  messageStore.init(identityManager)
  traceManager = new TraceManager()
  traceManager.init()
  roomManager = new RoomManager()
  roomManager.init(identityManager)
}

let setCurrentSection = function(name: string, params: any = {}) {
  if (name == "Radio" || name == "Map" || name == "Identities" || name == "Direct" || name == "Contacts" || name == "Channels" || 
    name == "Neighbors" || name == "Links" || name == "Traces" || name == "Rooms") {
    currentSection = name
    currentSectionParams = params
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
  get roomManager() { return roomManager },
  setCurrentSection,
  toggleMobileSlideOver,
  get getShowMobileSlideOver() { return showMobileSliderOver },
  getCurrentSectionParams: ()=>currentSectionParams,
  clearCurrentSectionParams: ()=>currentSectionParams = {},
  getActiveModal: ()=>activeModal,
  setActiveModal: (modalVnode)=>activeModal=modalVnode
}
