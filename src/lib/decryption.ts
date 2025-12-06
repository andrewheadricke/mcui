import { sha256 } from "@noble/hashes/sha2.js"
import { x25519 } from "@noble/curves/ed25519.js";
import { convertPublicKeyToX25519 as edToX } from '@stablelib/ed25519';
import { ChannelManager, Channel } from "./channels";
import { Identity, IdentityManager } from "./identities";
import BufferWriter from "./buffer_writer";
import BufferReader from "./buffer_reader";
import { ecb } from '@noble/ciphers/aes.js';
import { hmac } from '@noble/hashes/hmac.js'
import { bytesToHex } from "@noble/hashes/utils.js";

function decryptChannelMsg(payload: Uint8Array, channelManager: ChannelManager): any {
  //console.log('decrypt channel msg', payload)

  let channelHash = payload[0]
  let cipherMac = payload.slice(1, 3)
  let cipherText = payload.slice(3)

  //console.log("channelHash", channelHash)
  let potentialChannels = channelManager.getChannelsByHash(channelHash)
  //console.log("potential channels", potentialChannels)

  let plainTextBytes: Uint8Array
  let plainText: string = ""
  let foundChannel: Channel | null = null

  for (let a = 0; a < potentialChannels.length; a++) {
    let secret = potentialChannels[a].secret

    let derivedCiperMac = hmac(sha256, secret, cipherText)
    if (derivedCiperMac[0] != cipherMac[0] || derivedCiperMac[1] != cipherMac[1]) {
      console.log('cipherMAC does not match for ', potentialChannels[a])
      continue
    }

    let aesecb = ecb(secret, {disablePadding: true})
    let tmpPlainTextBytes = aesecb.decrypt(cipherText)
  
    let tmpPlainText: string
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      tmpPlainText = decoder.decode(tmpPlainTextBytes.slice(5));
    } catch (err) {
      continue
    }
    
    plainTextBytes = tmpPlainTextBytes
    plainText = tmpPlainText
    foundChannel = potentialChannels[a]

    break
  }

  if (foundChannel == null) {
    let reason = ""
    if (potentialChannels.length == 0) {
      reason = "unknown channel 0x" + byteToHex(channelHash)
    } else {
      let potentialChannelString = potentialChannels.map((chan)=>chan.name).join(",")
      reason = "unable to decrypt data on potential channels " + potentialChannelString
    }    
    return {success: false, reason: reason}
  } else {
    //console.log('valid key found!')
  }

  // parse prefix bytes
  let flagsAndAttempt = plainTextBytes[5]

  const timestamp = plainTextBytes[0] | 
    (plainTextBytes[1] << 8) | 
    (plainTextBytes[2] << 16) | 
    (plainTextBytes[3] << 24);

  //console.log(timestamp)
  //console.log(flagsAndAttempt)
  //console.log(plainText)

  const nullIndex = plainText.indexOf('\0');
  if (nullIndex >= 0) {
    plainText = plainText.substring(0, nullIndex);
  }

  const colonIndex = plainText.indexOf(': ');
  let sender: string | undefined;
  let content: string;

  if (colonIndex > 0) {
    sender = plainText.substring(0, colonIndex);
    content = plainText.substring(colonIndex + 2);
  } else {
      content = plainText;
  }

  return {
    success: true,
    channel: foundChannel,
    data: {
      timestamp,
      flags: flagsAndAttempt,
      sender,
      message: content
    }
  };
}

function decryptTxtMsg(payload: Uint8Array, identityManager: IdentityManager): any {
  let dest = payload[0]
  let src = payload[1]

  let cipherMac = payload.slice(2, 4)
  let cipherTextBytes = payload.slice(4)

  //console.log(byteToHex(src), byteToHex(dest))

  let potentialSenders = identityManager.getIdentitiesByFirstByte(src)
  let potentialRecipients = identityManager.getMyIdentitiesByFirstByte(dest)
  
  //console.log(potentialSenders)
  //console.log(potentialRecipients)

  let plainText: string = ""
  let plainTextBytes: Uint8Array
  let foundSender: Identity | null = null
  let foundRecipient: Identity | null = null

  for (let a = 0; a < potentialRecipients.length; a++) {
    let recipient = potentialRecipients[a]
    for (let b = 0; b < potentialSenders.length; b++) {
      let sender = potentialSenders[b]

      //console.log('decrypting ', sender, recipient)

      const xPub = edToX(sender.publicKey);
    
      let sharedSecret = x25519.getSharedSecret(recipient.privateKey.slice(0, 32), xPub);
      let secretKey = sharedSecret.slice(0, 16)

      let derivedCiperMac = hmac(sha256, sharedSecret, cipherTextBytes)
      if (derivedCiperMac[0] != cipherMac[0] || derivedCiperMac[1] != cipherMac[1]) {
        console.log('cipherMAC does not match for ', sender.name)
        //console.log("expected", cipherMac, "got", derivedCiperMac)
        continue
      }
    
      let aesecb = ecb(secretKey, {disablePadding: true})
      let tmpPlainTextBytes = aesecb.decrypt(cipherTextBytes)

      let tmpPlainText: string
      try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        tmpPlainText = decoder.decode(tmpPlainTextBytes.slice(5));
      } catch (err) {
        continue
      }

      plainTextBytes = tmpPlainTextBytes
      plainText = tmpPlainText
      foundRecipient = recipient
      foundSender = sender
      break
    }

    if (foundRecipient != null) {
      break
    }
  }
  
  if (foundRecipient == null) {
    // if we were unable to decrypt, lets get a list of all potential recipients, not just our identities
    return {success: false, data: {
      srcHash: src,
      destHash: dest,
      potentialRecipients: identityManager.getIdentitiesByFirstByte(dest), 
      potentialSenders: potentialSenders
    }}
  }

  const timestamp = plainTextBytes[0] | 
    (plainTextBytes[1] << 8) | 
    (plainTextBytes[2] << 16) | 
    (plainTextBytes[3] << 24);
  const flagsAndAttempt = plainTextBytes[4]  
  
  //console.log(plainText)

  const nullIndex = plainText.indexOf('\0');
  if (nullIndex >= 0) {
    plainText = plainText.substring(0, nullIndex);
  }

  // convert the shortened msg back into bytes
  const encoder = new TextEncoder();
  let trimmedMsgBytes = encoder.encode(plainText)

  let ackData = new BufferWriter()
  ackData.writeUInt32LE(timestamp)
  ackData.writeByte(flagsAndAttempt & 3)
  ackData.writeBytes(trimmedMsgBytes)
  ackData.writeBytes(foundSender?.publicKey)
  //console.log(ackData.toBytes())
  let ackHash = sha256(ackData.toBytes())

  return {
    success: true,
    data: {
      srcHash: src,
      destHash: dest,
      timestamp,
      flags: flagsAndAttempt,
      recipient: foundRecipient,
      sender: foundSender,
      message: plainText,
      ack: ackHash.slice(0, 4)
    }
  }; 
}

function decryptAnonReq(payload: Uint8Array, identityManager: IdentityManager): any {

  const bufferReader = new BufferReader(payload)
  let destinationHash = bufferReader.readByte()
  let senderPublicKey = bufferReader.readBytes(32)
  let cipherMac = bufferReader.readBytes(2)
  let cipherTextBytes = bufferReader.readRemainingBytes()

  let potentialRecipients = identityManager.getMyIdentitiesByFirstByte(destinationHash)
  
  let plainTextBytes: Uint8Array
  let foundRecipient: Identity | null = null

  for (let a = 0; a < potentialRecipients.length; a++) {
    let recipient = potentialRecipients[a]

    //console.log('decrypting ', sender, recipient)

    const xPub = edToX(senderPublicKey);
  
    let sharedSecret = x25519.getSharedSecret(recipient.privateKey.slice(0, 32), xPub);
    let secretKey = sharedSecret.slice(0, 16)

    let derivedCiperMac = hmac(sha256, sharedSecret, cipherTextBytes)
    if (derivedCiperMac[0] != cipherMac[0] || derivedCiperMac[1] != cipherMac[1]) {
      console.log('cipherMAC does not match for ', bytesToHex(senderPublicKey))
      //console.log("expected", cipherMac, "got", derivedCiperMac)
      continue
    }
  
    let aesecb = ecb(secretKey, {disablePadding: true})
    let tmpPlainTextBytes = aesecb.decrypt(cipherTextBytes)

    plainTextBytes = tmpPlainTextBytes
    foundRecipient = recipient
    break
  }
  
  if (foundRecipient == null) {
    // if we were unable to decrypt, lets get a list of all potential recipients, not just our identities
    return {success: false, data: {
      srcHash: senderPublicKey[0],
      destHash: destinationHash,
      potentialRecipients: identityManager.getIdentitiesByFirstByte(destinationHash)
    }}
  }

  const timestamp = plainTextBytes[0] | 
    (plainTextBytes[1] << 8) | 
    (plainTextBytes[2] << 16) | 
    (plainTextBytes[3] << 24);
  const syncTimestamp = plainTextBytes[4] | 
    (plainTextBytes[5] << 8) | 
    (plainTextBytes[6] << 16) | 
    (plainTextBytes[7] << 24);
  const password = plainTextBytes.slice(8)
  //console.log(password)

  let ackData = new BufferWriter()
  ackData.writeUInt32LE(timestamp)
  ackData.writeBytes(password)
  ackData.writeBytes(senderPublicKey)
  //console.log(ackData.toBytes())
  let ackHash = sha256(ackData.toBytes())

  return {
    success: true,
    data: {
      srcHash: senderPublicKey[0],
      destHash: destinationHash,
      timestamp,
      recipient: foundRecipient,
      sender: senderPublicKey,
      syncTimestamp: syncTimestamp,
      password: password,
      ack: ackHash.slice(0, 4)
    }
  }; 
}

export {
  decryptChannelMsg,
  decryptTxtMsg,
  decryptAnonReq
}

function byteToHex(byte) {
  // Ensure the input is treated as an unsigned byte (0-255)
  const unsignedByte = byte & 0xFF; 
  // Convert the byte to its hexadecimal string representation
  // padStart(2, '0') ensures a two-character output (e.g., 5 becomes "05")
  return unsignedByte.toString(16).padStart(2, '0');
}
