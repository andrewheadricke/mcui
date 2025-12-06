import * as ed25519 from "@noble/ed25519"
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js"
import { sha512 } from "@noble/hashes/sha2.js"
import { default as Advert, DeviceRole } from './advert'
import { Packet } from 'meshcore.js'
import { packetSerialize } from "./packet_helper";
import fnv1a from "fnv1a"
import { hslToRgb } from './utils'

class IdentityManager {

  uniquePubKeys: Map<string, Identity>
  identities: Identity[]
  contacts: Identity[]
  activeIdentity: number
  myIdentities: Identity[]
  cache_sorted_contacts: Identity[]

  init() {
    this.identities = []
    this.myIdentities = []
    this.contacts = []
    this.activeIdentity = -1
    this.uniquePubKeys = new Map<string, Identity>()
    this.cache_sorted_contacts = []

    let tmpIdents = localStorage.getItem("identities")
    if (tmpIdents != null) {
      let idents = JSON.parse(tmpIdents)
      for (let a = 0; a < idents.length; a++) {
        let i = new Identity()
        let err = i.Parse(idents[a])
        if (err == null) {
          this.uniquePubKeys.set(i.getPublicKeyHex(), i)
          this.identities.push(i)
          if (i.privateKey != null) {
            this.myIdentities.push(i)
          } else {
            this.contacts.push(i)
          }
        } else {
          console.log(err)
        }
      }
    }

    //console.log(this)
  }

  importPrivateKey(privateKeyHex: string): Identity | null {

    //console.log('importPrivateKey')

    let i = new Identity()
    const privateKey = hexToBytes(privateKeyHex)
    if (privateKey == null || privateKey.length != 64) {
      throw new Error("invalid private key")
    }

    i.privateKey = privateKey
    i.publicKey = derivePublicKey(privateKey)
    i.type = "CHAT"

    i.firstSeen = Math.round(Date.now() / 1000)

    //console.log(i.getPublicKeyHex())

    // check this identity doesn't already exist
    if (this.uniquePubKeys.has(i.getPublicKeyHex())) {
      return null
    }

    //console.log('adding identity')
    this.uniquePubKeys.set(i.getPublicKeyHex(), i)
    this.identities.push(i)
    this.myIdentities.push(i)

    this.saveIdentities()

    return i
  }

  addOrUpdate(advert: Advert) {
    // check this identity doesn't already exist
    //console.log(advert)
    //console.log(advert.getTypeString())
    let advertPublicKey = bytesToHex(advert.publicKey)
    if (this.uniquePubKeys.has(advertPublicKey)) {
      //console.log('already have contact, updating')
      let existingIdentity = this.getIdentity(advertPublicKey)
      existingIdentity.name = advert.appData.name
      existingIdentity.lat = advert.appData.location.lat
      existingIdentity.lon = advert.appData.location.lon
      existingIdentity.type = advert.getTypeString()
      existingIdentity.lastSeen = Math.round(Date.now()/1000)
      if (existingIdentity.firstSeen == null || existingIdentity.firstSeen == 0) {
        existingIdentity.firstSeen = existingIdentity.lastSeen || Math.round(Date.now()/1000)
      }
      //console.log(existingIdentity)
    } else {
      let i = new Identity()
      i.publicKey = advert.publicKey
      i.name = advert.appData.name
      if (advert.appData.location.lat != null && advert.appData.location.lat != 0) {
        i.lat = advert.appData.location.lat
      }
      if (advert.appData.location.lon != null && advert.appData.location.lon != 0) {
        i.lon = advert.appData.location.lon
      }
      i.type = advert.getTypeString()
      i.firstSeen = Math.round(Date.now()/1000)
      i.lastSeen = i.firstSeen

      let fnv = fnv1a(i.name)
      i._rgb = hslToRgb(fnv, 0.6, 0.5)

      this.identities.push(i)
      if (i.privateKey != null) {
        this.myIdentities.push(i)
      } else {
        this.contacts.push(i)
      }

      this.uniquePubKeys.set(i.getPublicKeyHex(), i)
    }
    
    this.saveIdentities()
    this.cache_sorted_contacts = []
  }

  getIdentity(publicKey: string): Identity {
    return this.uniquePubKeys.get(publicKey)!
  }

  removeIdentity(publicKey: string) {
    let wasRemoved = this.uniquePubKeys.delete(publicKey)
    if (!wasRemoved) {
      throw new Error("public key not found")
    }

    for (let a = 0; a < this.identities.length; a++){
      if (this.identities[a].getPublicKeyHex() == publicKey) {
        //console.log('remove from identities')
        this.identities.splice(a, 1)
        break
      }
    }
    for (let a = 0; a < this.myIdentities.length; a++){
      if (this.myIdentities[a].getPublicKeyHex() == publicKey) {
        //console.log('remove from myIdentities')
        this.myIdentities.splice(a, 1)
        break
      }
    }
    for (let a = 0; a < this.contacts.length; a++){
      if (this.contacts[a].getPublicKeyHex() == publicKey) {
        //console.log('remove from contacts')
        this.contacts.splice(a, 1)
        break
      }
    }
    this.saveIdentities()
    this.cache_sorted_contacts = []
  }

  saveIdentities() {
    let exportList: any[] = []
    for (let a = 0; a < this.identities.length; a++) {
      exportList.push(this.identities[a].export())
    }
    //console.log(exportList)
    localStorage.setItem("identities", JSON.stringify(exportList))
  }

  getMyIdentities(): Identity[] {
    return this.myIdentities
  }

  getContacts(sorted: boolean): Identity[] {
    if (sorted) {
      if (this.cache_sorted_contacts.length == 0) {
        this.sortContacts()
      }
      return this.cache_sorted_contacts
    } else {
      return this.contacts
    }
  }

  sortContacts() {
    //console.log('sorting contacts')    
    for (let a = 0; a < this.contacts.length; a++) {
      this.cache_sorted_contacts.push(this.contacts[a])
    }
    this.cache_sorted_contacts.sort((a, b) => b.lastSeen < a.lastSeen ? -1 : 1)
  }

  getMyIdentitiesByFirstByte(firstByte: number): Identity[] {
    let results: Identity[] = []
    this.myIdentities.forEach((ident)=>{
      if (ident.publicKey[0] == firstByte) {
        results.push(ident)
      }
    })
    return results
  }

  getIdentitiesByFirstByte(firstByte: number): Identity[] {
    let results: Identity[] = []
    this.identities.forEach((ident)=>{
      if (ident.publicKey[0] == firstByte) {
        results.push(ident)
      }
    })
    return results
  }

  getRepeatersByFirstByte(firstByte: number): Identity[] {
    let results: Identity[] = []
    this.identities.forEach((ident)=>{
      if (ident.publicKey[0] == firstByte && ident.type == "REPEATER") {
        results.push(ident)
      }
    })
    return results
  }

  getRooms(): Identity[] {
    let results = []
    for (let a = 0; a < this.myIdentities.length; a++) {
      if (this.myIdentities[a].type == "ROOM") {
        results.push(this.myIdentities[a])
      }
    }
    return results
  }

  async generateNew() {
    // replace sha512
    if (window.crypto.subtle == null) {
      console.log('replacing crypto.subtle.sha512 with @noble/sha512 due to non https')
      ed25519.hashes.sha512Async = function(buf: Uint8Array): Promise<Uint8Array> {
        let digest = sha512(buf)
        return new Promise((resolve, reject)=>{
          resolve(digest)
        })
      }
    }
    const { secretKey } = await ed25519.keygenAsync();
    let digestArray = sha512(secretKey)

    const clamped = new Uint8Array(digestArray.slice(0, 32));
    clamped[0] &= 248;
    clamped[31] &= 63;
    clamped[31] |= 64;

    const meshcorePrivateKey = new Uint8Array(64);
    meshcorePrivateKey.set(clamped, 0);
    meshcorePrivateKey.set(digestArray.slice(32, 64), 32);

    this.importPrivateKey(bytesToHex(meshcorePrivateKey))
  }
}

class Identity {
  privateKey: Uint8Array
  publicKey: Uint8Array
  name: string
  lat: number = 0
  lon: number = 0

  firstSeen: number
  lastSeen: number
  transportMethod: string
  hops: number
  type: string
  advertPath: string
  autoAck: boolean = false

  _rgb: string

  Parse(identityObj: any): Error | null {
    if (identityObj.privateKey != null) {
      this.privateKey = hexToBytes(identityObj.privateKey)
      this.publicKey = derivePublicKey(this.privateKey)
    }
    if (this.publicKey == null && identityObj.publicKey.length > 0) {
      this.publicKey = hexToBytes(identityObj.publicKey)
    }
    this.name = identityObj.name
    if (identityObj.lat != null) {
      this.lat = identityObj.lat
    }
    if (identityObj.lon != null) {
      this.lon = identityObj.lon
    }
    if (identityObj.firstSeen != null) {
      this.firstSeen = identityObj.firstSeen
    }
    if (identityObj.lastSeen != null) {
      this.lastSeen = identityObj.lastSeen
    }
    if (identityObj.name == null) {
      this.name = ""
    }
    this.transportMethod = identityObj.transportMethod
    this.hops = identityObj.hops
    this.type = identityObj.type
    this.advertPath = identityObj.advertPath
    if (identityObj.autoAck != null) {
      this.autoAck = identityObj.autoAck
    }

    let fnv = fnv1a(this.name)
    this._rgb = hslToRgb(fnv, 0.6, 0.5)
    return null
  }

  getPublicKeyHex(): string {
    return bytesToHex(this.publicKey)
  }

  getShortPublicKeyHex(): string {
    let pubkeyHex = bytesToHex(this.publicKey)
    return pubkeyHex.slice(0, 8) + "..." + pubkeyHex.slice(pubkeyHex.length - 8)
  }

  updateRgb() {
    let fnv = fnv1a(this.name)
    this._rgb = hslToRgb(fnv, 0.6, 0.5)
  }

  export(): any {
    let tmpExport: any = Object.assign({}, this)
    if (this.privateKey != null) {
      tmpExport.privateKey = bytesToHex(this.privateKey)
    }
    if (this.privateKey == null) {
      tmpExport.publicKey = bytesToHex(this.publicKey)
    } else {
      delete tmpExport.publicKey
    }
    delete tmpExport._rgb

    return tmpExport
  }

  sign(message: Uint8Array) {
  
    //const publicKey = this.publicKey//derivePublicKey(this.privateKey)
    const ed25519_l = BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed");

    // hash the prefix/nonce (privatekey[32:64] + message)
    let hasher = sha512.create()
    let b = new Uint8Array(32 + message.length)
    b.set(this.privateKey.slice(32, 64))
    b.set(message, 32)
    let digest:Uint8Array = hasher.update(b).digest()
    let r = ed25519.etc.mod(leBytesToNumber(digest), ed25519_l)
    const R = ed25519.Point.BASE.multiply(r).toBytes()

    // hash the R, PublicKey, message
    // multiply by privatekey[0:32] (seed)
    hasher = sha512.create()
    b = new Uint8Array(32 + 32 + message.length)
    b.set(R)
    b.set(this.publicKey, 32)
    b.set(message, 64)
    digest = hasher.update(b).digest()
    const k = ed25519.etc.mod(leBytesToNumber(digest), ed25519_l)
    const a = leBytesToNumber(this.privateKey.slice(0, 32))
    const S = ed25519.etc.mod(r + k * a, ed25519_l)
    const Sbytes = numberToLEBytes(S, 32);

    let signature = new Uint8Array(64)
    signature.set(R)
    signature.set(Sbytes, 32)

    return signature
  }

  buildAdvertPacket(routeType: number): Uint8Array {
    //console.log('build advert packet')

    //console.log(this)
    let deviceRole: DeviceRole
    if (this.type == "CHAT") {
      deviceRole = DeviceRole.ChatNode
    } else if (this.type == "ROOM") {
      deviceRole = DeviceRole.RoomServer
    } else if (this.type == "REPEATER") {
      deviceRole = DeviceRole.Repeater
    }
    let advert = Advert.buildAdvertFromScratch(this.publicKey, Math.floor(Date.now()/1000), deviceRole, this.name)
    advert.signature = this.sign(advert.getBytesForSignature())
    
    //console.log(advert)

    let header = 0
    let type = Packet.PAYLOAD_TYPE_ADVERT
    let version = 0x00
    header |= (routeType & Packet.PH_ROUTE_MASK)
    header |= (type      & Packet.PH_TYPE_MASK) << Packet.PH_TYPE_SHIFT;
    header |= (version   & Packet.PH_VER_MASK)  << Packet.PH_VER_SHIFT;

    let pkt = new Packet(header, [0,0], 0, advert.getBytesForPayload())
    //console.log(pkt)

    return packetSerialize(pkt)
  }

  toggleAutoAck() {
    if (this.autoAck) {
      this.autoAck = false
    } else {
      this.autoAck = true
    }
  }

  getAckIfNeeded(fromPath: Uint8Array, ack: Uint8Array, ): Uint8Array | null {

    if (this.autoAck == undefined || this.autoAck == false) {
      return null
    }

    //console.log(fromPath)
    //console.log(fromPath.reverse())

    let header = 0
    let type = Packet.PAYLOAD_TYPE_ACK
    let version = 0x00
    header |= (Packet.ROUTE_TYPE_DIRECT & Packet.PH_ROUTE_MASK)
    header |= (type                     & Packet.PH_TYPE_MASK) << Packet.PH_TYPE_SHIFT;
    header |= (version                  & Packet.PH_VER_MASK)  << Packet.PH_VER_SHIFT;
    let pkt = new Packet(header, [0,0], fromPath.reverse(), ack)
    let pktBytes = packetSerialize(pkt)
    let frame = new Uint8Array(pktBytes.length + 1)
    frame.set([53])
    frame.set(pktBytes, 1)
    return frame
  }
}

function derivePublicKey(privateKey: Uint8Array): Uint8Array {  
  const clampedScalar = privateKey.slice(0, 32)
  let scalarBigInt = 0n;
  for (let i = 0; i < 32; i++) {
    scalarBigInt += BigInt(clampedScalar[i]) << BigInt(8 * i);
  }
  let publicKeyPoint = ed25519.Point.BASE.multiply(scalarBigInt);
  let publicKeyBytes = publicKeyPoint.toBytes()

  return publicKeyBytes
}

function leBytesToNumber(bytes) {
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result += BigInt(bytes[i]) << (8n * BigInt(i));
  }
  return result;
}

function numberToLEBytes(value: bigint, byteLength: number): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  let temp = value;
  for (let i = 0; i < byteLength; i++) {
      bytes[i] = Number(temp & 0xFFn);
      temp >>= 8n;
  }
  return bytes;
}

export {
  IdentityManager,
  Identity
  //derivePublicKey
}