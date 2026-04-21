import BufferWriter from "./buffer_writer";
import { Packet } from "meshcore.js"

function packetSerialize(pkt: Packet): Uint8Array {
  let buffer_writer = new BufferWriter()
  buffer_writer.writeByte(pkt.header)

  if (pkt.getPayloadType() == Packet.PAYLOAD_TYPE_TRACE) {
    buffer_writer.writeByte(0)
  } else {
    if (pkt.prefixLength == 2) {
      let prefixAndPath = 0
      prefixAndPath |= (pkt.path.length & 0x3F)
      prefixAndPath |= (pkt.prefixLength - 1 & 0x03) << 6
      buffer_writer.writeByte(prefixAndPath)
    } else {
      buffer_writer.writeByte(pkt.path.length)
    }
  }
  
  if (pkt.getPayloadType() == Packet.PAYLOAD_TYPE_TRACE) {
    
  } else if (pkt.path.length > 0) {
    buffer_writer.writeBytes(pkt.path)
  }
  buffer_writer.writeBytes(pkt.payload)
  return buffer_writer.toBytes()
}

export {
  packetSerialize
}