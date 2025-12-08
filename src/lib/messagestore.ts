import { Identity, IdentityManager } from './identities'
import { sha256 } from '@noble/hashes/sha2.js'
import BufferedWriter from './buffer_writer'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

class MessageStore {
  //messages: Message[]
  uniqueMsgHashes: Map<string, boolean>

  groupMessages: {}
  directMessages: {}

  init(identityManager: IdentityManager){
    //this.messages = []
    this.uniqueMsgHashes = new Map<string, boolean>
    this.groupMessages = {}
    this.directMessages = {}    
    this.groupMessages = {"Public":[]}

    // maybe load from localstorage
    let tmpJson = localStorage.getItem("directchats")
    if (tmpJson != null) {
      let keys = JSON.parse(tmpJson)
      for (let a = 0; a < keys.length; a++) {
        let remoteIdentityKey = keys[a].slice(0,64)
        let localIdentityKey = keys[a].slice(64)

        let remoteIdentity = identityManager.getIdentity(remoteIdentityKey)
        let localIdentity = identityManager.getIdentity(localIdentityKey)
        this.directMessages[keys[a]] = {sender: remoteIdentity, recipient: localIdentity, msgs: []}
      }
    }

    /*
    for (let a = 0; a < 50; a++) {
      let m = new Message()
      m.senderName = "Billy"
      m.msg = "Hi there"
      m.channel = "Public"
      this.groupMessages["Public"].push(m)
    }
    let counter = 0
    setInterval(()=>{
      counter++
      let tmpM = new Message()
      tmpM.senderName = "Billy"
      tmpM.msg = "Hi there " + counter
      tmpM.channel = "Public"
      this.groupMessages["Public"].push(tmpM)
      m.redraw()
    }, 5000)

    let firstName = [
      "Alice",
      "Bob",
      "Catherine",
      "David",
      "Emily",
      "Frank",
      "Grace",
      "Henry",
      "Ivy",
      "Jack"
    ]
    let lastName = [
      "Smith",
      "Johnson",
      "Davis",
      "Wilson",
      "Brown",
      "Miller",
      "Taylor",
      "Moore",
      "White",
      "Green"
    ]

    let sender = new Identity()
    let recipient = new Identity()
    let rando = 0
    for (let a = 0; a < 150; a++) {
      if (rando <= 0) {
        rando = Math.floor(Math.random() * 20)
        //console.log(rando)
        sender = new Identity()
        recipient = new Identity()
        sender.name = firstName[Math.floor(Math.random() * 10)] + " " + lastName[Math.floor(Math.random() * 10)]
        let array = new Uint8Array(16)
        window.crypto.getRandomValues(array);
        sender.publicKey = array
        sender.updateRgb()
        recipient.name = firstName[Math.floor(Math.random() * 10)] + " " + lastName[Math.floor(Math.random() * 10)]
        array = new Uint8Array(16)
        window.crypto.getRandomValues(array);
        recipient.publicKey = array
        recipient.updateRgb()
      } else {
        rando--
      }
      
      this.addDirectMessage(sender, recipient, Math.round(Date.now()/1000) + a, "hi there")
    }*/
  }

  getStorageSize(): number {
    let tmpJson = localStorage.getItem("directchats")
    if (tmpJson == null) {
      return 0
    } else {
      return tmpJson.length
    }
  }

  addGroupMessage(channel: string, senderName: string, timestamp: number, msg: string): Message {
    let newMsg = new Message()

    newMsg.channel = channel
    newMsg.senderName = senderName
    newMsg.timestamp = timestamp
    newMsg.msg = msg

    let msgHash = newMsg.getHash()
    if (this.uniqueMsgHashes.has(msgHash) == false) {
      if (this.groupMessages.hasOwnProperty(channel)) {
        this.groupMessages[channel].push(newMsg)
      } else {
        this.groupMessages[channel] = [ newMsg ]
      }
      this.uniqueMsgHashes.set(msgHash, true)
    }    

    return newMsg
  }

  addDirectMessage(sender: Identity, recipient: Identity, timestamp: number, msg: string): Message {
    let newMsg = new Message()

    newMsg.sender = sender
    newMsg.recipient = recipient
    newMsg.timestamp = timestamp
    newMsg.msg = msg

    let msgHash = newMsg.getHash()
    if (this.uniqueMsgHashes.has(msgHash) == false) {
      let key = sender.getPublicKeyHex() + recipient.getPublicKeyHex()
      if (this.directMessages.hasOwnProperty(key)) {
        this.directMessages[key].msgs.push(newMsg)
      } else {
        this.directMessages[key] = { sender: sender, recipient: recipient, msgs: [ newMsg ] }
      }
      this.uniqueMsgHashes.set(msgHash, true)
    }

    this.saveToLocalStorage()
    return newMsg
  }

  /*getAllMessages(): Message[] {
    return this.messages
  }*/

  getMessagesFor(channelName): Message[] {
    if (this.groupMessages.hasOwnProperty(channelName)) {
      return this.groupMessages[channelName]
    } else {
      return []
    }
  }

  getAllDirectMessages(): {} {
    return this.directMessages
  }

  getDirectMessagesFor(directChatKey: string): Message[] {
    return this.directMessages[directChatKey].msgs.sort((a, b)=>a.timestamp - b.timestamp)
  }

  newDirectChat(remoteIdentity: Identity) {
    this.directMessages[remoteIdentity.getShortPublicKeyHex()] = { sender: remoteIdentity, msgs: []}
  }

  addLocalIdentToDirectChat(existingHalfKey: string, localIdent: Identity) {
    let chatDetails = this.directMessages[existingHalfKey]
    chatDetails.recipient = localIdent

    delete this.directMessages[existingHalfKey]

    let key = chatDetails.sender.getPublicKeyHex() + chatDetails.recipient.getPublicKeyHex()
    if (this.directMessages.hasOwnProperty(key)) {
      throw new Error("chat already exists")
    } else {
      this.directMessages[key] = chatDetails
    }

    //console.log(this.directMessages)
    this.saveToLocalStorage()
  }

  saveToLocalStorage() {
    let tmpKeys = []
    for (let prop in this.directMessages) {
      if (prop.length == 128) {
        tmpKeys.push(prop)
      }
    }
    localStorage.setItem("directchats", JSON.stringify(tmpKeys))
  }
}

class Message {
  timestamp: number
  senderName: string
  sender: Identity  
  recipient: Identity
  channel: string
  msg: string

  getHash(): string {

    let bufferedWriter = new BufferedWriter()

    bufferedWriter.writeUInt32LE(this.timestamp)
    if (this.channel) {
      bufferedWriter.writeString(this.channel)
      bufferedWriter.writeString(this.senderName)
    } else {
      bufferedWriter.writeBytes(this.sender.publicKey)
      bufferedWriter.writeBytes(this.recipient.publicKey)
    }
    bufferedWriter.writeString(this.msg)
    let hash = sha256(bufferedWriter.toBytes())
    return bytesToHex(hash.slice(0, 16))
  }
}

export {
  MessageStore
}