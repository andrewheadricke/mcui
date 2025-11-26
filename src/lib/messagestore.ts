import { Identity } from './identities'
import { sha256 } from '@noble/hashes/sha2.js'
import BufferedWriter from './buffer_writer'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

class MessageStore {
  //messages: Message[]
  uniqueMsgHashes: Map<string, boolean>

  groupMessages: {}
  directMessages: {}

  init(){
    //this.messages = []
    this.uniqueMsgHashes = new Map<string, boolean>
    this.groupMessages = {}
    this.directMessages = {}

    // maybe load from localstorage?

    /*for (let a = 0; a < 50; a++) {
      let m = new Message()
      m.senderName = "Billy"
      m.msg = "Hi there"
      m.channel = "Public"
      this.messages.push(m)
    }*/

    /*let firstName = [
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
    for (let a = 0; a < 70; a++) {      
      if (rando <= 0) {
        rando = Math.floor(Math.random() * 7)
        //console.log(rando)
        sender = new Identity()
        recipient = new Identity()
        sender.name = firstName[Math.floor(Math.random() * 10)] + " " + lastName[Math.floor(Math.random() * 10)]
        if (a == 0) {
          sender.name = "[EViL] The Dutchman (tdeck)"
        }
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