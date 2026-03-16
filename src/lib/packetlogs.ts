import { bytesToHex } from "@noble/hashes/utils.js"
import { Buffer } from "buffer"

class PacketLogs {
  encryptedPackets: PacketLog[]
  ingressStats: Map<number, IngressStats>
  links1b: {link: String, usage: number}
  links2b: {link: String, usage: number}

  init() {
    this.encryptedPackets = []
    this.ingressStats = new Map<number, IngressStats>
    this.links1b = {} as {link: String, usage: number}
    this.links2b = {} as {link: String, usage: number}

    let tmpLinks = localStorage.getItem("links1b")
    if (tmpLinks != null) {
      this.links1b = JSON.parse(tmpLinks)
    }
    tmpLinks = localStorage.getItem("links2b")
    if (tmpLinks != null) {
      this.links2b = JSON.parse(tmpLinks)
    }
  }

  getStorageSize(): number {
    let l1: number, l2: number
    let tmpJson = localStorage.getItem("links1b")
    if (tmpJson != null) {
      l1 = tmpJson.length
    }
    tmpJson = localStorage.getItem("links2b")
    if (tmpJson != null) {
      l2 = tmpJson.length
    }
    return l1 + l2
  }

  addLinks(path: Uint8Array, prefixLength: number) {
    if (path.length < 2) {
      return
    }
    //console.log(path, prefixLength)
    for (let a = 0; a <= path.length - (prefixLength * 2); a+=prefixLength) {
      let hashA = Buffer.from(path.slice(a, a + prefixLength))
      let hashB = Buffer.from(path.slice(a + prefixLength, a + prefixLength + prefixLength))
      //console.log(hashA, hashB)
      let key: string
      let cmpResult = Buffer.compare(hashA, hashB)
      if (cmpResult == 0) {
        continue
      } else if (cmpResult == 1) {
        key = hashB.toString('hex') + hashA.toString('hex')
      } else {
        key = hashA.toString('hex') + hashB.toString('hex')
      }
      //console.log('key', key)
      if (prefixLength == 1) {
        if (key in this.links1b) {
          this.links1b[key] = this.links1b[key] + 1
        } else {
          this.links1b[key] = 1
        }
      } else if (prefixLength == 2) {
        if (key in this.links2b) {
          this.links2b[key] = this.links2b[key] + 1
        } else {
          this.links2b[key] = 1
        }
      }
    }
    //console.log(this)
  }

  iterateLinks(hashMode: number, cb: (link: string, usage: number) => any) {
    let returnValues: any = []
    let sortedLinks: any[]
    if (hashMode == 0) {
      sortedLinks = Object.entries(this.links1b);
    } else if (hashMode == 1) {
      sortedLinks = Object.entries(this.links2b);
    }
    sortedLinks.sort((a, b)=> b[1] - a[1])

    sortedLinks.forEach((link)=>{
      let result = cb(link[0], link[1])
      if (result != null) {
        returnValues.push(result)
      }
    });
    
    return returnValues
  }

  saveToLocalStorage() {
    localStorage.setItem("links1b", JSON.stringify(this.links1b))
    localStorage.setItem("links2b", JSON.stringify(this.links2b))
  }

  clearData() {
    this.links1b = {} as {link: String, usage: number}
    localStorage.removeItem("links1b")
    this.links2b = {} as {link: String, usage: number}
    localStorage.removeItem("links2b")
    localStorage.removeItem("links")
  }

  importData(data) {
    if (data != null) {
      localStorage.setItem("links", JSON.stringify(data))
    }
  }

  exportData() {
    return {links1b: this.links1b, links2b: this.links2b}
  }

  addEncryptedPacket(path: Uint8Array, rawPkt: Uint8Array) {
    let pl = new PacketLog()
    pl.path = path
    pl.timestamp = Date.now()
    pl.rawBytes = rawPkt
    this.encryptedPackets.push(pl)
  }

  getLogs(): PacketLog[] {
    return this.encryptedPackets
  }

  addIngressPacket(routeTypeString: string, path: Uint8Array, publicKey: Uint8Array | undefined | null) {
    let ip: IngressStats | undefined

    if (routeTypeString != "FLOOD") {
      return
    }

    let finalHop: number
    if (path.length > 0) {
      finalHop = path[path.length-1]
    } else if (publicKey instanceof Uint8Array) {
      finalHop = publicKey[0]
    } else {
      return
    }

    ip = this.ingressStats.get(finalHop)
    if (ip == undefined) {
      ip = new IngressStats()
      ip.directs = 0
      ip.floods = 0
      this.ingressStats.set(finalHop, ip)
    }
    ip.floods++
    if (publicKey != undefined && publicKey[0] == finalHop) {
      ip.publicKey = publicKey
    }
    //console.log(this.ingressStats)
  }

  addIngressDirectPacket(){

  }

  getIngressStats(): any {
    return Object.fromEntries(this.ingressStats)
  }
}

class IngressStats {
  publicKey: Uint8Array
  directs: number
  floods: number
}

class PacketLog {
  timestamp: number
  path: Uint8Array
  rawBytes: Uint8Array
}

export {
  PacketLogs,
  PacketLog
}