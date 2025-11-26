import BufferWriter from "./buffer_writer";
import { Packet } from "meshcore.js"

function packetSerialize(pkt: Packet): Uint8Array {
  let buffer_writer = new BufferWriter()
  buffer_writer.writeByte(pkt.header)
  buffer_writer.writeByte(pkt.path.length)
  if (pkt.path.length > 0) {
    buffer_writer.writeBytes(pkt.path)
  }
  buffer_writer.writeBytes(pkt.payload)
  return buffer_writer.toBytes()
}

export {
  packetSerialize
}