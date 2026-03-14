import { Buffer } from "buffer"

class Meshtastic {
  
  nodes: {nodeId: MeshtasticNode}
  cachedColors: {nodeId: {fg: string, bg: string, f: string}}
  cache_sorted: MeshtasticNode[]

  init() {
    this.nodes = {} as {nodeId: MeshtasticNode}
    this.cachedColors = {} as {nodeId: {fg: string, bg: string, f: string}}
    this.cache_sorted = []

    let tmpJson = localStorage.getItem("meshtastic")
    if (tmpJson != null) {
      let objJson = JSON.parse(tmpJson)
      for (let nodeId in objJson) {
        let tmpNode = new MeshtasticNode()
        tmpNode.parse(objJson[nodeId])
        this.nodes[nodeId] = tmpNode
      }
    }
  }

  clearData() {
    this.nodes = {} as {nodeId: MeshtasticNode}
    localStorage.removeItem("meshtastic")
    this.cache_sorted = []
  }

  getStorageSize(): number {
    let tmpJson = localStorage.getItem("meshtastic")
    if (tmpJson == null) {
      return 0
    } else {
      return tmpJson.length
    }
  }

  exportData() {
    return this.nodes
  }

  importData(data) {
    if (data != null) {
      localStorage.setItem("meshtastic", JSON.stringify(data))
    }
  }

  hasNodes(): boolean {
    return Object.keys(this.nodes).length != 0
  }

  parseAdvertFromMsg(author: string, msg: string): MeshtasticNode {
    let mn = new MeshtasticNode()
    mn.longName = author

    let parts = msg.split('\n')
    
    mn.id = parts[0].substring(1)
    let re = /[0-9A-Fa-f]{8}/g;
    if (!re.test(mn.id)) {
      return null
    }

    let partIdx = 1
    if (parts.length > partIdx && parts[partIdx].length <= 4) {
      mn.shortName = parts[partIdx]
      partIdx++
    }
    if (parts.length > partIdx && parts[partIdx].length == 44) {
      let tmpPubKey = Buffer.from(parts[partIdx], 'base64')
      if (tmpPubKey.length == 32) {
        mn.publicKey = parts[partIdx]
      } else {
        console.log("Looks like invalid publicKey for meshtastic node")
      }
      partIdx++
    }
    if (parts.length > partIdx && parts[partIdx].length == 16) {
      let location = Buffer.from(parts[partIdx], 'base64')
      let dataView = new DataView(location.buffer);
      let lat = dataView.getInt32(0, false) / 10000000
      let lon = dataView.getInt32(4, false) / 10000000
      let altitude = dataView.getInt16(8, false)
      mn.location = [lat, lon, altitude]
    }

    mn.firstSeen = Math.round(Date.now()/1000)
    mn.lastSeen = mn.firstSeen

    if (mn.shortName == null) {
      mn.shortName = mn.id.substring(4)
    }

    return mn
  }

  addOrUpdateNode(newNode: MeshtasticNode) {
    let existingNode = this.nodes[newNode.id]
    if (existingNode == null) {
      this.nodes[newNode.id] = newNode
    } else {
      newNode.firstSeen = existingNode.firstSeen
      this.nodes[newNode.id] = newNode
    }
    this.saveToLocalStorage()
    this.cache_sorted = []
  }

  nodeCount(): number {
    return Object.keys(this.nodes).length
  }

  getAllNodes(sorted: boolean): MeshtasticNode[] {
    if (sorted) {
      if (this.cache_sorted.length == 0) {
        this.sortNodes()
      }
      return this.cache_sorted
    } else {
      let results = []
      for (let nodeId in this.nodes) {
        results.push(this.nodes[nodeId])
      }
      return results
    }
  }

  sortNodes() {
    for (let nodeId in this.nodes) {
      this.cache_sorted.push(this.nodes[nodeId])
    }
    this.cache_sorted.sort((a, b) => b.lastSeen < a.lastSeen ? -1 : 1)
  }

  saveToLocalStorage() {
    let meshtasticJson = JSON.stringify(this.nodes)
    localStorage.setItem("meshtastic", meshtasticJson)
  }

  getCachedColors(hex): {fg: string, bg: string, f: string} {

    if (this.cachedColors.hasOwnProperty(hex)) {
      return this.cachedColors[hex]
    } else {
      let fg = hexToRgb(getFg((hex)))
      let bgRgb = hexToRgb(hex.substring(2))
      let bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b)
      let f = Object.assign({}, bgHsl)
      f.l = 90
      let tmpColors = {fg: hslToString(rgbToHsl(fg.r, fg.g, fg.b)), bg: hslToString(bgHsl), f: hslToString(f)}
      this.cachedColors[hex] = tmpColors
      return tmpColors
    }
  }
}

class MeshtasticNode {
  id: string
  longName: string
  shortName: string
  publicKey: string
  location: [number, number, number]
  firstSeen: number
  lastSeen: number

  parse(data) {
    this.id = data.id
    this.longName = data.longName
    this.shortName = data.shortName
    this.publicKey = data.publicKey
    if (data.location != null) {
      this.location = data.location
    }
    this.firstSeen = data.firstSeen
    this.lastSeen = data.lastSeen

    if (this.shortName == null) {
      this.shortName = this.id.substring(4)
    }
  }

  getShortPublicKey(): string {
    if (this.publicKey == null) {
      return ""
    }
    return this.publicKey.substring(0, 8) + "..." + this.publicKey.substring(this.publicKey.length - 8)
  }
}


function hslToString(hslObj) {
  return "hsl(" + hslObj.h + "," + hslObj.s + "%," + hslObj.l + "%)"
}

function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b) {

  // Normalize R, G, B to the 0-1 range
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
      // Achromatic (grey)
      h = s = 0;
  } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
          case r:
              h = (g - b) / d + (g < b ? 6 : 0);
              break;
          case g:
              h = (b - r) / d + 2;
              break;
          case b:
              h = (r - g) / d + 4;
              break;
      }
      h /= 6;
  }

  // Convert H, S, L to the desired ranges (0-360 for H, 0-100 for S and L) and round
  return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
  };
}

function getFg(hex) {
  let num = parseInt(hex, 16)

  // Extract RGB components
  const r = (num >> 16) & 0xFF;
  const g = (num >> 8)  & 0xFF;
  const b = num         & 0xFF;

  // Calculate relative luminance (per ITU-R BT.601)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

  // Decide foreground color (black or white)
  return brightness > 0.5 ? "#000000" : "#FFFFFF";
}

export {
  Meshtastic,
  MeshtasticNode
}