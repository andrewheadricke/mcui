import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js"
import * as ed25519 from "@noble/ed25519"

export class Ed25519SignatureVerifier {
  /**
   * Verify an Ed25519 signature for MeshCore advertisement packets
   * 
   * According to MeshCore protocol, the signed message for advertisements is:
   * timestamp (4 bytes LE) + flags (1 byte) + location (8 bytes LE, if present) + name (variable, if present)
   */
  static async verifyAdvertisementSignature(
    publicKey: Uint8Array,
    signature: Uint8Array,
    timestamp: number,
    appData: Uint8Array
  ): Promise<boolean> {
    try {      
      // Construct the signed message according to MeshCore format
      const message = this.constructAdvertSignedMessage(publicKey, timestamp, appData);
      
      // Verify the signature using noble-ed25519
      return await ed25519.verifyAsync(signature, message, publicKey);
    } catch (error) {
      console.error('Ed25519 signature verification failed:', error);
      return false;
    }
  }

  /**
   * Construct the signed message for MeshCore advertisements
   * According to MeshCore source (Mesh.cpp lines 242-248):
   * Format: public_key (32 bytes) + timestamp (4 bytes LE) + app_data (variable length)
   */
  static constructAdvertSignedMessage(
    publicKey: Uint8Array,
    timestamp: number,
    appData: Uint8Array
  ): Uint8Array {
    
    // Timestamp (4 bytes, little-endian)
    const timestampBytes = new Uint8Array(4);
    timestampBytes[0] = timestamp & 0xFF;
    timestampBytes[1] = (timestamp >> 8) & 0xFF;
    timestampBytes[2] = (timestamp >> 16) & 0xFF;
    timestampBytes[3] = (timestamp >> 24) & 0xFF;
    
    // Concatenate: public_key + timestamp + app_data
    const message = new Uint8Array(32 + 4 + appData.length);
    message.set(publicKey, 0);
    message.set(timestampBytes, 32);
    message.set(appData, 36);
    
    return message;
  }

  /**
   * Get a human-readable description of what was signed
   */
  static getSignedMessageDescription(
    publicKeyHex: string,
    timestamp: number,
    appDataHex: string
  ): string {
    return `Public Key: ${publicKeyHex} + Timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()}) + App Data: ${appDataHex}`;
  }

  /**
   * Get the hex representation of the signed message for debugging
   */
  static getSignedMessageHex(
    publicKey: Uint8Array,
    timestamp: number,
    appDataHex: string
  ): string {
    const appData = hexToBytes(appDataHex);
    const message = this.constructAdvertSignedMessage(publicKey, timestamp, appData);
    return bytesToHex(message);
  }

}