import { Identity } from "./identities";
import { Channel } from "./channels";
import BufferWriter from "./buffer_writer";
import { Packet } from "meshcore.js";
import { sha256 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { ecb } from '@noble/ciphers/aes.js';
import { convertPublicKeyToX25519 as edToX } from '@stablelib/ed25519';
import { x25519 } from "@noble/curves/ed25519.js";
import { hexToBytes } from "@noble/hashes/utils.js";
import { HistoryMessage } from './roommanager'

function buildGroupTxtPacket(senderIdentity: Identity, targetChannel: Channel, msg: string): Uint8Array {
  //console.log('buildGroupTxtPacket')
  //console.log(senderIdentity, targetChannel, msg)

  let timestamp: number = Math.round(Date.now()/1000)
  let flags: number = 0

  // first build appdata [timestamp + flags + msg]
  let bufferWriter = new BufferWriter()
  bufferWriter.writeUInt32LE(timestamp)
  bufferWriter.writeByte(flags)
  bufferWriter.writeString(senderIdentity.name + ": " + msg)
  let appData = bufferWriter.toBytes()

  if (appData.length % 16 != 0) {
    let blockCount = Math.floor(appData.length / 16)
    let tmpAppData = new Uint8Array((blockCount + 1) * 16)
    tmpAppData.set(appData)
    appData = tmpAppData
  }

  let aesecb = ecb(targetChannel.secret, {disablePadding: true})
  let cipherText = aesecb.encrypt(appData)
  //console.log(cipherText)

  let mac = hmac(sha256, targetChannel.secret, cipherText)
  //console.log(mac)

  // then payload [channel hash + ciphermac + appdata]  
  bufferWriter = new BufferWriter()
  bufferWriter.writeByte(targetChannel._channelHash)
  bufferWriter.writeBytes(mac.slice(0, 2))
  bufferWriter.writeBytes(cipherText)  
  let payloadBytes = bufferWriter.toBytes()

  //console.log(payloadBytes)

  // then packet [header + path + payload]
  let header = 0
  let pathLen = 0
  let version = 0x00
  header |= (Packet.ROUTE_TYPE_FLOOD     & Packet.PH_ROUTE_MASK)
  header |= (Packet.PAYLOAD_TYPE_GRP_TXT & Packet.PH_TYPE_MASK) << Packet.PH_TYPE_SHIFT;
  header |= (version                     & Packet.PH_VER_MASK)  << Packet.PH_VER_SHIFT;

  bufferWriter = new BufferWriter()
  bufferWriter.writeByte(header)
  bufferWriter.writeByte(pathLen)
  bufferWriter.writeBytes(payloadBytes)
  let pktBytes = bufferWriter.toBytes()

  // then wrap with a 53
  let frame = new Uint8Array(pktBytes.length + 1)
  frame[0] = 53
  frame.set(pktBytes, 1)

  //console.log(frame)

  return frame
}

function buildDirectTxtPacket(senderIdentity: Identity, recipientPublicKey: Uint8Array, msg: string): Uint8Array {
  let timestamp: number = Math.round(Date.now()/1000)
  let flags: number = 0

  // first build appdata [timestamp + flags + msg]
  let bufferWriter = new BufferWriter()
  bufferWriter.writeUInt32LE(timestamp)
  bufferWriter.writeByte(flags)
  bufferWriter.writeString(msg)
  let appData = bufferWriter.toBytes()

  if (appData.length % 16 != 0) {
    let blockCount = Math.floor(appData.length / 16)
    let tmpAppData = new Uint8Array((blockCount + 1) * 16)
    tmpAppData.set(appData)
    appData = tmpAppData
  }
  //console.log(appData)

  const xPub = edToX(recipientPublicKey);
      
  let sharedSecret = x25519.getSharedSecret(senderIdentity.privateKey.slice(0, 32), xPub);
  let secretKey = sharedSecret.slice(0, 16)

  //console.log(secretKey)

  let aesecb = ecb(secretKey, {disablePadding: true})
  let cipherText = aesecb.encrypt(appData)
  //console.log(cipherText)

  let mac = hmac(sha256, sharedSecret, cipherText)
  //console.log(mac)

  // then payload [channel hash + ciphermac + appdata]  
  bufferWriter = new BufferWriter()
  bufferWriter.writeByte(recipientPublicKey[0])
  bufferWriter.writeByte(senderIdentity.publicKey[0])
  bufferWriter.writeBytes(mac.slice(0, 2))
  bufferWriter.writeBytes(cipherText)
  let payloadBytes = bufferWriter.toBytes()

  //console.log(payloadBytes)

  let header = 0
  let pathLen = 0
  let version = 0x00
  header |= (Packet.ROUTE_TYPE_FLOOD     & Packet.PH_ROUTE_MASK)
  header |= (Packet.PAYLOAD_TYPE_TXT_MSG & Packet.PH_TYPE_MASK) << Packet.PH_TYPE_SHIFT;
  header |= (version                     & Packet.PH_VER_MASK)  << Packet.PH_VER_SHIFT;

  bufferWriter = new BufferWriter()
  bufferWriter.writeByte(header)
  bufferWriter.writeByte(pathLen)
  bufferWriter.writeBytes(payloadBytes)
  let pktBytes = bufferWriter.toBytes()

  // then wrap with a 53
  let frame = new Uint8Array(pktBytes.length + 1)
  frame[0] = 53
  frame.set(pktBytes, 1)

  return frame
}

function buildResponse(remotePublicKey: Uint8Array, localIdentity: Identity): Uint8Array {
  let RESP_SERVER_LOGIN_OK = 0x00
  let FIRMWARE_VER_LEVEL = 0x01
  let resp = new BufferWriter()
  resp.writeInt32LE(Math.round(Date.now() / 1000))
  resp.writeByte(RESP_SERVER_LOGIN_OK)
  resp.writeByte(0x00) // legacy
  resp.writeByte(0x00) // isAdmin = 1, permissions = 2 else 0
  resp.writeByte(0x02) // client permissions
  let rnd = new Uint8Array(4)
  window.crypto.getRandomValues(rnd)
  resp.writeBytes(rnd) // random values
  resp.writeByte(FIRMWARE_VER_LEVEL)
  let appData = resp.toBytes()

  if (appData.length % 16 != 0) {
    let blockCount = Math.floor(appData.length / 16)
    let tmpAppData = new Uint8Array((blockCount + 1) * 16)
    tmpAppData.set(appData)
    appData = tmpAppData
  }
  //console.log(appData)

  const xPub = edToX(remotePublicKey);
      
  let sharedSecret = x25519.getSharedSecret(localIdentity.privateKey.slice(0, 32), xPub);
  let secretKey = sharedSecret.slice(0, 16)

  //console.log(secretKey)

  let aesecb = ecb(secretKey, {disablePadding: true})
  let cipherText = aesecb.encrypt(appData)
  //console.log(cipherText)

  let mac = hmac(sha256, sharedSecret, cipherText)
  //console.log(mac)

  // then payload [channel hash + ciphermac + appdata]  
  let bufferWriter = new BufferWriter()
  bufferWriter.writeByte(remotePublicKey[0])
  bufferWriter.writeByte(localIdentity.publicKey[0])
  bufferWriter.writeBytes(mac.slice(0, 2))
  bufferWriter.writeBytes(cipherText)
  let payloadBytes = bufferWriter.toBytes()

  let header = 0
  let pathLen = 0
  let version = 0x00
  header |= (Packet.ROUTE_TYPE_FLOOD      & Packet.PH_ROUTE_MASK)
  header |= (Packet.PAYLOAD_TYPE_RESPONSE & Packet.PH_TYPE_MASK) << Packet.PH_TYPE_SHIFT;
  header |= (version                      & Packet.PH_VER_MASK)  << Packet.PH_VER_SHIFT;

  bufferWriter = new BufferWriter()
  bufferWriter.writeByte(header)
  bufferWriter.writeByte(pathLen)
  bufferWriter.writeBytes(payloadBytes)
  let pktBytes = bufferWriter.toBytes()

  // then wrap with a 53
  let frame = new Uint8Array(pktBytes.length + 1)
  frame[0] = 53
  frame.set(pktBytes, 1)

  return frame
}

function buildSyncMsg(localIdentity: Identity, remotePublicKey: Uint8Array, msg: HistoryMessage): Uint8Array {
  // post timestamp + flag + 4byte author pubkey, msg
  const TXT_TYPE_SIGNED_PLAIN = 2

  let appDataWriter = new BufferWriter()
  appDataWriter.writeInt32LE(msg.timestamp)
  let attempt = Math.floor(Math.random() * 256)
  let flag = (TXT_TYPE_SIGNED_PLAIN << 2) | (attempt & 3)
  appDataWriter.writeByte(flag)
  appDataWriter.writeBytes(hexToBytes(msg.author))
  const encoder = new TextEncoder()  
  appDataWriter.writeBytes(encoder.encode(msg.msg))

  let appData = appDataWriter.toBytes()

  if (appData.length % 16 != 0) {
    let blockCount = Math.floor(appData.length / 16)
    let tmpAppData = new Uint8Array((blockCount + 1) * 16)
    tmpAppData.set(appData)
    appData = tmpAppData
  }
  //console.log(appData)

  const xPub = edToX(remotePublicKey);
      
  let sharedSecret = x25519.getSharedSecret(localIdentity.privateKey.slice(0, 32), xPub);
  let secretKey = sharedSecret.slice(0, 16)

  //console.log(secretKey)

  let aesecb = ecb(secretKey, {disablePadding: true})
  let cipherText = aesecb.encrypt(appData)
  //console.log(cipherText)

  let mac = hmac(sha256, sharedSecret, cipherText)
  //console.log(mac)

  // then payload [channel hash + ciphermac + appdata]  
  let bufferWriter = new BufferWriter()
  bufferWriter.writeByte(remotePublicKey[0])
  bufferWriter.writeByte(localIdentity.publicKey[0])
  bufferWriter.writeBytes(mac.slice(0, 2))
  bufferWriter.writeBytes(cipherText)  
  let payloadBytes = bufferWriter.toBytes()

  let header = 0
  let pathLen = 0
  let version = 0x00
  header |= (Packet.ROUTE_TYPE_FLOOD    & Packet.PH_ROUTE_MASK)
  header |= (Packet.PAYLOAD_TYPE_TXT_MSG & Packet.PH_TYPE_MASK) << Packet.PH_TYPE_SHIFT;
  header |= (version                     & Packet.PH_VER_MASK)  << Packet.PH_VER_SHIFT;

  bufferWriter = new BufferWriter()
  bufferWriter.writeByte(header)
  bufferWriter.writeByte(pathLen)
  bufferWriter.writeBytes(payloadBytes)
  let pktBytes = bufferWriter.toBytes()

  // then wrap with a 53
  let frame = new Uint8Array(pktBytes.length + 1)
  frame[0] = 53
  frame.set(pktBytes, 1)

  return frame
}

export {
  buildGroupTxtPacket,
  buildDirectTxtPacket,
  buildResponse,
  buildSyncMsg
}