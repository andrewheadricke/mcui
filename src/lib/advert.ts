import * as ed25519 from "@noble/ed25519"
import BufferReader from "./buffer_reader";
import BufferWriter from "./buffer_writer";

export enum DeviceRole {
  ChatNode = 0x01,
  Repeater = 0x02,
  RoomServer = 0x03,
  Sensor = 0x04
}

export enum AdvertFlags {
  HasLocation = 0x10,
  HasFeature1 = 0x20,
  HasFeature2 = 0x40,
  HasName = 0x80
}

class AppData {
  flags: number;
  deviceRole: DeviceRole
  hasLocation: boolean
  hasName: boolean
  location: {
    lat: number
    lon: number
  }
  name: string
}

class Advert {

    static ADV_TYPE_NONE = 0;
    static ADV_TYPE_CHAT = 1;
    static ADV_TYPE_REPEATER = 2;
    static ADV_TYPE_ROOM = 3;

    static ADV_LATLON_MASK = 0x10;
    static ADV_BATTERY_MASK = 0x20;
    static ADV_TEMPERATURE_MASK = 0x40;
    static ADV_NAME_MASK = 0x80;

    publicKey: Uint8Array
    timestamp: number
    signature: Uint8Array
    appData: AppData

    static buildAdvertFromScratch(publicKey: Uint8Array, timestamp: number, deviceRole: DeviceRole, name: string): Advert {
      let a = new Advert()
      a.publicKey = publicKey;
      a.timestamp = timestamp;
      a.appData = new AppData()
      a.appData.deviceRole = deviceRole
      if (name.length > 0) {
        a.appData.name = name
        a.appData.hasName = true
      }
      a.appData.hasLocation = false
      return a
    }

    static fromBytes(bytes) {

      let a = new Advert()
      a.appData = new AppData()
      a.appData.location = {lat: 0, lon: 0}

      // read bytes
      const bufferReader = new BufferReader(bytes);
      a.publicKey = bufferReader.readBytes(32);
      a.timestamp = bufferReader.readUInt32LE();
      a.signature = bufferReader.readBytes(64);
      a.parseAppData(bufferReader.readRemainingBytes());
        
      return a
    }

    getFlags() {
        return this.appData.flags;
    }

    getType() {
        const flags = this.getFlags();
        return flags & 0x0F;
    }

    getTypeString(): string {
        const type = this.getType();
        if(type === Advert.ADV_TYPE_NONE) return "NONE";
        if(type === Advert.ADV_TYPE_CHAT) return "CHAT";
        if(type === Advert.ADV_TYPE_REPEATER) return "REPEATER";
        if(type === Advert.ADV_TYPE_ROOM) return "ROOM";
        return "";
    }

    async isVerified() {

        let payloadBytes = this.getBytesForSignature()
        console.log("b", payloadBytes)

        // verify signature
        return await ed25519.verifyAsync(this.signature, payloadBytes, this.publicKey);
    }

    getAppDataBytes(): Uint8Array {
      const bufferWriter = new BufferWriter()
      let flags: number = this.appData.deviceRole
      
      if (this.appData.hasLocation) {
        flags = flags |= AdvertFlags.HasLocation
      }
      if (this.appData.hasName) {
        flags = flags |= AdvertFlags.HasName
      }

      if (flags == 0) {
        throw new Error('invalid flags')
      }

      bufferWriter.writeByte(flags)
      bufferWriter.writeString(this.appData.name)

      //let b = bufferWriter.toBytes()
      //console.log(b)

      return bufferWriter.toBytes()
    }

    getBytesForSignature(): Uint8Array {
      const bufferWriter = new BufferWriter();
      bufferWriter.writeBytes(this.publicKey);
      bufferWriter.writeUInt32LE(this.timestamp);
      bufferWriter.writeBytes(this.getAppDataBytes());
      return bufferWriter.toBytes()
    }

    getBytesForPayload(): Uint8Array {
      const bufferWriter = new BufferWriter();
      bufferWriter.writeBytes(this.publicKey);
      bufferWriter.writeUInt32LE(this.timestamp);
      bufferWriter.writeBytes(this.signature);
      bufferWriter.writeBytes(this.getAppDataBytes())
      return bufferWriter.toBytes()
    }

    parseAppData(data: Uint8Array) {

      // read app data
      const bufferReader = new BufferReader(data);
      this.appData.flags = bufferReader.readByte();

      // parse lat lon
      if(this.appData.flags & Advert.ADV_LATLON_MASK){
          this.appData.location.lat = bufferReader.readInt32LE();
          this.appData.location.lon = bufferReader.readInt32LE();
      }

      // parse name (remainder of app data)
      if(this.appData.flags & Advert.ADV_NAME_MASK){
        this.appData.name = bufferReader.readString();
      }

    }
}

export default Advert;
