import BufferReader from "./buffer_reader";
import BufferWriter from "./buffer_writer";
import { Constants, Packet } from "meshcore.js"
import { convertSnr, encodeSnr } from "./snr";
import { packetSerialize } from "./packet_helper";

class ControlData {

  subType: number
  typeFilters: string[] = []
  prefixOnly: boolean
  tag: Uint8Array
  since: Uint8Array
  nodeType: number
  snr: number
  pubkey: Uint8Array

  static parseControlData(payload: Uint8Array): ControlData {
    let retVal: ControlData = new ControlData()

    const bufferReader = new BufferReader(payload);
    let flags = bufferReader.readByte()
    retVal.subType = (flags & 0xF0) >> 4
    if (retVal.subType == 0x08) {

      let typeFilter = bufferReader.readByte()
      if ((typeFilter & 4) >> 2 == 1) {
        retVal.typeFilters.push("repeaters")
      }
      retVal.prefixOnly = (flags & 0x01) == 1
      retVal.tag = bufferReader.readBytes(4)
      retVal.since = null
    } else if (retVal.subType == 0x09) {
      retVal.subType = 9
      retVal.nodeType = flags & 0x0F
      retVal.snr = convertSnr(bufferReader.readInt8())
      retVal.tag = bufferReader.readBytes(4)
      retVal.pubkey = bufferReader.readBytes(32)
    } else {
      console.error("unknown sub type")
      return
    }

    return retVal
  }

  createDiscoveryResponsePacket(snr: number, publicKey: Uint8Array): Uint8Array {
    //console.log("createDiscoveryResponsePacket")

    let bufferedWriter = new BufferWriter()
    let flags = 146 // 9 (4 higher bits) + 2 (4 lower bits)
    //flags |= 9 << 4
    //flags |= 2

    bufferedWriter.writeByte(flags)
    bufferedWriter.writeByte(encodeSnr(snr))
    bufferedWriter.writeBytes(this.tag)
    bufferedWriter.writeBytes(publicKey)

    let payload = bufferedWriter.toBytes()

    let header = 0
    let type = Packet.PAYLOAD_TYPE_CONTROL
    let version = 0x00
    header |= (Packet.ROUTE_TYPE_DIRECT & Packet.PH_ROUTE_MASK)
    header |= (type                     & Packet.PH_TYPE_MASK) << Packet.PH_TYPE_SHIFT;
    header |= (version                  & Packet.PH_VER_MASK)  << Packet.PH_VER_SHIFT;
    let pkt = new Packet(header, [0,0], 1, 0, payload)
    let pktBytes = packetSerialize(pkt)

    return pktBytes
  }
}

export default ControlData