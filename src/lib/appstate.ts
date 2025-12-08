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
let currentLocation = {lat: 0, lon: 0}
let storageSize = 0

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
  storageSize += radioStore.getStorageSize()
  identityManager = new IdentityManager()
  identityManager.init()
  storageSize += identityManager.getStorageSize()
  channelManager = new ChannelManager()
  channelManager.init()
  storageSize += channelManager.getStorageSize()
  packetLogs = new PacketLogs()
  packetLogs.init()
  storageSize += packetLogs.getStorageSize()
  messageStore = new MessageStore()
  messageStore.init(identityManager)
  storageSize += messageStore.getStorageSize()
  traceManager = new TraceManager()
  traceManager.init()
  storageSize += traceManager.getStorageSize()
  roomManager = new RoomManager()
  roomManager.init(identityManager)
  storageSize += roomManager.getStorageSize()

  //console.log(storageSize)
}

let setCurrentSection = function(name: string, params: any = {}) {
  if (name == "Radio" || name == "Map" || name == "Identities" || name == "Direct" || name == "Contacts" || name == "Channels" || 
    name == "Neighbors" || name == "Links" || name == "Traces" || name == "Rooms" || name == "Settings") {
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
  setActiveModal: (modalVnode)=>activeModal=modalVnode,
  get storageUsed() { return storageSize }
}
