import { Identity } from "./identities";
import { Channel } from "./channels";
import BufferWriter from "./buffer_writer";
import { Packet } from "meshcore.js";
import { sha256 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { ecb } from '@noble/ciphers/aes.js';
import { convertPublicKeyToX25519 as edToX } from '@stablelib/ed25519';
import { x25519 } from "@noble/curves/ed25519.js";

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

function buildDirectTxtPacket(senderIdentity: Identity, recipientIdentity: Identity, msg: string): Uint8Array {
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

  const xPub = edToX(recipientIdentity.publicKey);
      
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
  bufferWriter.writeByte(recipientIdentity.publicKey[0])
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

export {
  buildGroupTxtPacket,
  buildDirectTxtPacket
}