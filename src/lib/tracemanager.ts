import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js"
import BufferWriter from "./buffer_writer";
import { Packet } from 'meshcore.js'
import { packetSerialize } from "./packet_helper";
import AppState from '../lib/appstate'

class TraceManager {
  traces: Trace[]
  pendingTraces: {string: [Trace, number]}

  init() {
    this.traces = []
    this.pendingTraces = {} as {string: [Trace, number]}

    let storedTraces = localStorage.getItem("traces")
    if (storedTraces != null) {
      let tracesJson = JSON.parse(storedTraces)
      for (let a = 0; a < tracesJson.length; a++) {
        this.traces.push(Trace.parse(tracesJson[a]))
      }
    }
  }

  getStorageSize(): number {
    let tmpJson = localStorage.getItem("traces")
    if (tmpJson == null) {
      return 0
    } else {
      return tmpJson.length
    }
  }
  
  addTrace(name: string, path: string) {
    let newTrace = new Trace()
    newTrace.name = name
    newTrace.path = path

    this.traces.push(newTrace)

    this.saveToLocalStorage()
  }

  clearData() {
    this.traces = []
    localStorage.removeItem("traces")
  }

  importData(data) {
    if (data != null) {
      localStorage.setItem("traces", JSON.stringify(data))
    }
  }

  exportData() {
    let exportData = []
    for (let a = 0; a < this.traces.length; a++) {
      let t = Object.assign({}, this.traces[a])
      delete t._hops
      delete t._traceActive
      delete t._lastResult
      exportData.push(t)
    }
    return exportData
  }

  saveToLocalStorage() {
    let data = this.exportData()
    localStorage.setItem("traces", JSON.stringify(data))
    //localStorage.setItem("traces", JSON.stringify(this.traces))
  }

  getTraces(): Trace[] {
    return this.traces
  }

  removeTrace(trace: Trace) {
    for (let a = 0; a < this.traces.length; a++) {
      if (this.traces[a] == trace) {
        this.traces.splice(a, 1)
        break
      }
    }
    this.saveToLocalStorage()
  }

  clearHistory(trace: Trace) {
    trace.successes = 0
    trace.fails = 0
    this.saveToLocalStorage()
  }

  startTrace(t: Trace): Promise<any> {

    // generate random tag
    const array = new Uint8Array(4);
    window.crypto.getRandomValues(array);
    const dataView = new DataView(array.buffer);
    let tagNum = dataView.getUint32(0, true);

    console.log('starting trace for', t.name, "with tag", tagNum)

    let promiseResolve: (value: unknown)=>void
    let p = new Promise((resolve, reject)=>{
      promiseResolve = resolve
      delete this.pendingTraces[tagNum]
    })

    
    let pendingTraceMeta: [Trace, number, (value: unknown)=>void] = [t, 0, promiseResolve]
    this.pendingTraces[tagNum] = pendingTraceMeta

    t.startTrace(array, pendingTraceMeta)

    return p
  }

  traceComplete(d: any) {
    if (this.pendingTraces.hasOwnProperty(d.tag)) {
      let timeoutHandle = this.pendingTraces[d.tag][1]
      let trace = this.pendingTraces[d.tag][0]
      let promiseResolve = this.pendingTraces[d.tag][2]
      trace._traceActive = false
      trace._lastResult = true
      clearTimeout(timeoutHandle)
      delete this.pendingTraces[d.tag]
      //console.log("trace success", d.tag)
      trace.successes++

      for (let a = 0; a < d.pathSnrs.length;a++) {
        console.log(convertSnr(d.pathSnrs[a]))
      }
      console.log(d.lastSnr)

      this.saveToLocalStorage()
      promiseResolve(d)
    }
  }
}

class Trace {
  name: string
  path: string
  fails: number = 0
  successes: number = 0

  _hops: number = 0
  _traceActive: boolean = false
  _lastResult: boolean | null = null

  static parse(data: any): Trace {
    let t = new Trace()
    t.name = data.name
    t.path = data.path
    t.fails = data.fails
    t.successes = data.successes

    t._hops = t.path.length / 2
    return t
  }

  startTrace(tag: Uint8Array, pendingTraceMeta: [Trace, number, (value: unknown)=>void]) {
    this._traceActive = true
    let waitTime = (this.path.length / 2) + 1

    console.log('waiting', waitTime * 2, "seconds")

    const bufferWriter = new BufferWriter();
    bufferWriter.writeBytes(tag);
    bufferWriter.writeUInt32LE(0); // auth
    bufferWriter.writeByte(0) // flags

    let pathBytes = hexToBytes(this.path)
    bufferWriter.writeBytes(pathBytes) // path
    let payload = bufferWriter.toBytes()

    let header = 0
    let version = 0x00
    header |= (Packet.ROUTE_TYPE_DIRECT  & Packet.PH_ROUTE_MASK)
    header |= (Packet.PAYLOAD_TYPE_TRACE & Packet.PH_TYPE_MASK) << Packet.PH_TYPE_SHIFT;
    header |= (version   & Packet.PH_VER_MASK)  << Packet.PH_VER_SHIFT;

    let pkt = new Packet(header, [0,0], 0, payload)
    let pktBytes = packetSerialize(pkt)

    const data = new Uint8Array(pktBytes.length + 1);
    data[0] = 53
    data.set(pktBytes, 1)

    // send the packet
    AppState.radioStore.sendToRadioFrame(data)

    // set timeout
    pendingTraceMeta[1] = setTimeout(()=>{
      this.fails++
      this._traceActive = false
      this._lastResult = false
      pendingTraceMeta[2]({timeout: true})
    }, waitTime * 2000)
  }
}

export {
  TraceManager
} 

function convertSnr(snr: number) {
  let signedSnr
  if (snr > 127) {
    signedSnr = snr - 256
  } else {
    signedSnr = snr
  }
  //console.log(signedSnr)
  return signedSnr / 4.0
}