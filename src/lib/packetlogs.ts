import { bytesToHex } from "@noble/hashes/utils.js"

class PacketLogs {
  encryptedPackets: PacketLog[]
  ingressStats: Map<number, IngressStats>
  links: {link: String, usage: number}

  init() {
    this.encryptedPackets = []
    this.ingressStats = new Map<number, IngressStats>
    this.links = {} as {link: String, usage: number}

    let tmpLinks = localStorage.getItem("links")
    if (tmpLinks != null) {
      this.links = JSON.parse(tmpLinks)
    }
  }

  getStorageSize(): number {
    let tmpJson = localStorage.getItem("links")
    if (tmpJson == null) {
      return 0
    } else {
      return tmpJson.length
    }
  }

  addLinks(path: Uint8Array) {
    if (path.length < 2) {
      return
    }
    for (let a = 0; a < path.length - 1; a++) {
      if (path[a] == path[a+1]) {
        continue
      }
      let key: string
      if (path[a] < path[a+1]) {
        key = bytesToHex(path.slice(a, a+1)) + bytesToHex(path.slice(a+1, a+2))
      } else {
        key = bytesToHex(path.slice(a+1, a+2)) + bytesToHex(path.slice(a, a+1))
      }
      if (key in this.links) {
        this.links[key] = this.links[key] + 1
      } else {
        this.links[key] = 1
      }
    }
    //console.log(this)
  }

  iterateLinks(cb: (link: string, usage: number) => any) {
    let returnValues: any = []
    let sortedLinks: any[] = Object.entries(this.links);
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
    localStorage.setItem("links", JSON.stringify(this.links))
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