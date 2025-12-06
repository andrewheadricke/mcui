import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js"
import { Identity, IdentityManager } from "./identities"
import { buildSyncMsg } from "./txtbuilder"
import AppState from "./appstate"

class RoomManager {
  rooms: {string: Room}

  init(identityManager: IdentityManager) {
    this.rooms = {} as {string: Room} 

    // load from localStorage
    let savedRooms = localStorage.getItem("rooms")
    if (savedRooms != null) {
      let tmpRooms = JSON.parse(savedRooms)
      for(let publicKey in tmpRooms) {
        let r = new Room()
        let hostIdentity = identityManager.getIdentity(publicKey)
        r.hostIdentity = hostIdentity
        r.parseHistory(tmpRooms[publicKey])
        this.rooms[publicKey] = r
      }
    }

    //console.log(this)
  }

  getRoom(roomOwnerIdentity: Identity): Room {
    if (this.rooms.hasOwnProperty(roomOwnerIdentity.getPublicKeyHex())) {
      return this.rooms[roomOwnerIdentity.getPublicKeyHex()]
    } else {
      let newRoom = new Room()
      newRoom.hostIdentity = roomOwnerIdentity
      this.rooms[roomOwnerIdentity.getPublicKeyHex()] = newRoom
      return newRoom
    }
  }

  saveToLocalStorage() {
    let jsonToSave = {}

    for (let publicKey in this.rooms) {
      jsonToSave[publicKey] = this.rooms[publicKey].history
    }

    localStorage.setItem("rooms", JSON.stringify(jsonToSave))
  }
}

class Room {
  hostIdentity: Identity
  activeSyncs: {string: number} = {} as {string: number} // publicKey: activeSyncTimestamp
  history: HistoryMessage[] = []

  addMessage(timestamp: string, author: string, msg: string) {    
    let m = new HistoryMessage()
    m.timestamp = parseInt(timestamp)
    hexToBytes(author)
    m.author = author
    if (msg.length == 0) {
      throw new Error("no message")
    }
    m.msg = msg
    this.history.push(m)
    return m
  }

  pinMessage(timestamp: string, author: string, msg: string) {
    let m = this.addMessage(timestamp, author, msg)
    m.isPinned = true
  }

  parseHistory(data) {
    for (let a = 0; a < data.length; a++) {
      let h = new HistoryMessage()
      h.timestamp = data[a].timestamp
      h.author = data[a].author
      h.msg = data[a].msg
      this.history.push(h)
    }
  }

  startSync(remotePublicKey: Uint8Array, syncTimestamp: number) {
    let remotePublicKeyHex = bytesToHex(remotePublicKey)    
    if (this.activeSyncs[remotePublicKeyHex]) {
      return
    }

    console.log("start sync for ", remotePublicKeyHex, syncTimestamp)
    
    let msgToSend: HistoryMessage = null
    for (let a = 0; a < this.history.length; a++) {
      if (this.history[a].timestamp <= syncTimestamp) {
        continue
      }
      msgToSend = this.history[a]
    }
    if (msgToSend == null) {
      console.log("no more messages to sync")
      return
    }

    console.log("sending msg")
    this.activeSyncs[remotePublicKeyHex] = msgToSend.timestamp
    //console.log(this)
    let testSyncMsg = buildSyncMsg(this.hostIdentity, remotePublicKey, msgToSend)
    //console.log(testSyncMsg)
    AppState.radioStore.sendToRadioFrame(testSyncMsg)

    delete this.activeSyncs[remotePublicKeyHex]
  }
}

class HistoryMessage {
  timestamp: number
  author: string
  msg: string
  isPinned: boolean
}

export {
  RoomManager,
  Room,
  HistoryMessage
}