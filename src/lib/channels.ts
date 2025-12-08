import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js"
import { sha256 } from "@noble/hashes/sha2.js"

class ChannelManager {
  channels: Channel[]

  init() {
    this.channels = []

    let tmpChannels = localStorage.getItem("channels")
    if (tmpChannels == null) {
      let tmpChannel = new Channel()
      tmpChannel.participants = new Map<string, boolean>
      tmpChannel.name = "Public"
      tmpChannel.secret = hexToBytes("8b3387e9c5cdea6ac9e5edbaa115cd72")
      this.channels.push(tmpChannel)
      this.saveToLocalStorage()
    } else {
      let tmpChannelsObj = JSON.parse(tmpChannels)
      for (let a = 0; a < tmpChannelsObj.length; a++) {
        let c = new Channel()
        let err = c.parse(tmpChannelsObj[a])
        if (err != null) {
          console.error(err)          
        } else {
          this.channels.push(c)
        }
      }
    }
  }

  getStorageSize(): number {
    let tmpJson = localStorage.getItem("channels")
    if (tmpJson == null) {
      return 0
    } else {
      return tmpJson.length
    }
  }

  saveToLocalStorage() {
    let exportList: any[] = []
    for (let a = 0; a < this.channels.length; a++) {
      exportList.push(this.channels[a].export())
    }
    localStorage.setItem("channels", JSON.stringify(exportList))
  }

  getChannels(): Channel[] {
    return this.channels
  }

  addChannel(name: string, secret: string | undefined | null) {
    let c = new Channel()
    c.name = name
    if (name.startsWith("#")) {
      c.parse({name: name})
    } else if (secret == null) {
      throw new Error("channel missing secret")
    } else {
      c.secret = hexToBytes(secret)
    }
    this.channels.push(c)
    this.saveToLocalStorage()
  }

  getChannelsByHash(hash: number): Channel[] {
    let results: Channel[] = []
    for (let a = 0; a < this.channels.length; a++) {
      if (this.channels[a]._channelHash == hash) {
        results.push(this.channels[a])
      }
    }
    return results
  }

  removeChannel(name: string) {
    for (let a = 0; a < this.channels.length; a++) {
      if (this.channels[a].name == name) {
        this.channels.splice(a, 1)
        break
      }
    }
    this.saveToLocalStorage()
  }
}

class Channel {
  name: string
  secret: Uint8Array
  participants: Map<string, boolean>
  lastMsg: number

  _channelHash: number

  parse(data: any): Error | null {
    //console.log(data)
    this.name = data.name
    if (data.participants == null) {
      this.participants = new Map<string, boolean>
    } else {
      this.participants = new Map(data.participants.map((i): [string, boolean] => [i, true]));
    }

    this.lastMsg = data.lastMsg
    if (this.lastMsg == null) {
      this.lastMsg = 0
    }

    if (data.secret != null) {
      this.secret = hexToBytes(data.secret)
    }

    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(this.name)
    
    if (this.name.startsWith("#")) {
      this.secret = sha256(nameBytes).slice(0, 16)
    } else if (this.secret == null) {
      return new Error("channel missing secret")
    }

    let channelHash = sha256(this.secret)

    //console.log(channelHash)
    this._channelHash = channelHash[0]

    return null
  }

  export(): any {
    let tmpExport: any = {name: this.name, lastMsg: this.lastMsg}
    if (this.participants != null) {
      tmpExport.participants = Array.from(this.participants.keys())
    }
    if (this.secret != null) {
      tmpExport.secret = bytesToHex(this.secret)
    }
    //console.log(tmpExport)
    return tmpExport
  }

  addParticipant(name: string, timestamp: number) {
    if (name == null || name == "") {
      return
    }
    this.participants.set(name, true)
    if (timestamp > this.lastMsg) {
      this.lastMsg = timestamp
    }
  }
}

export {
  ChannelManager,
  Channel
}