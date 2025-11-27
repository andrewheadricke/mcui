import { Connection, WebSocketConnection, WebBleConnection, WebSerialConnection, Constants, Packet } from "meshcore.js"
import m from 'mithril'
import AppState from './appstate'
import Advert from './advert'
import { decryptChannelMsg, decryptTxtMsg } from "../lib/decryption";
import { bytesToHex } from '@noble/hashes/utils.js';

class RadioStore {

  radios: Radio[]
  activeConnection: Connection
  waitingForHandshakeCompletion: boolean
  connectedRadio: Radio | null

  init() {
    this.radios = []
    this.waitingForHandshakeCompletion = true

    let tmpRadiosJson = localStorage.getItem("radios")
    if (tmpRadiosJson != null) {
      let tmpRadios = JSON.parse(tmpRadiosJson)
      for (let a = 0; a < tmpRadios.length; a++) {
        let r = new Radio()
        r.parse(tmpRadios[a])
        this.radios.push(r)
      }
    }
  }

  add(type: string, url: string | null): Radio {
    let r = new Radio()
    r.sendRawPacketSupport = false
    r.connectionType = type
    if (type == "websocket" && url != null) {
      r.websocketUrl = url
    }
    this.radios.push(r)
    this.saveToLocalStorage()
    return r
  }

  saveToLocalStorage() {
    let radiosJson = JSON.stringify(this.radios)
    localStorage.setItem("radios", radiosJson)
  }

  async connect(r: Radio) {
    
    if (r.connectionType == "websocket") {
      this.activeConnection = new WebSocketConnection(r.websocketUrl)
    } else if (r.connectionType == "ble") {
      let tmpConn = await WebBleConnection.open()
      if (tmpConn != null) {
        this.activeConnection = tmpConn
      }
    } else if (r.connectionType == "serial") {
      let tmpConn = await WebSerialConnection.open()
      if (tmpConn != null) {
        this.activeConnection = tmpConn
      }
    }

    if (this.activeConnection == null) {
      return
    }

    this.activeConnection.on("connected", () => {
      console.log("Connected");
      this.connectedRadio = r

      this.activeConnection.sendCommandAppStart()
      // first send CMD_APP_START
      // then send CMD_SEND_RAW_PACKET (53)
    })
    this.activeConnection.on("disconnected", () => {
      //console.log("disconnected");
      this.connectedRadio = null
      this.waitingForHandshakeCompletion = true
      m.redraw()
    })
    this.activeConnection.on(Constants.ResponseCodes.SelfInfo, (event)=>{
      //console.log("SelfInfo", event)
      r.username = event.name

      let sendBuf = new Uint8Array(1)
      sendBuf[0] = 53
      this.activeConnection.sendToRadioFrame(sendBuf)
      //m.redraw()
    })
    this.activeConnection.on(Constants.ResponseCodes.DeviceInfo, (event)=>{
      //console.log("DeviceInfo", event)
      r.firmware = event.firmwareVerString
      r.firmwareDate = event.firmware_build_date
      r.hardware = event.manufacturerModel
    })
    this.activeConnection.on(Constants.ResponseCodes.Ok, (event)=>{
      //console.log('got response code')
      //console.log(event)
      if (this.waitingForHandshakeCompletion) {
        //vnode.attrs.connWriter.getRawPacketSupport = ()=>true
        console.log('rawPacketSupported')
        r.sendRawPacketSupport = true
        this.waitingForHandshakeCompletion = false
        this.saveToLocalStorage()
        m.redraw()
      }
    })
    this.activeConnection.on(Constants.ResponseCodes.Err, (event)=>{
      //console.log('got response err')
      if (this.waitingForHandshakeCompletion) {
        if (event.errCode == 1) {
          //vnode.attrs.connWriter.getRawPacketSupport = ()=>false
          console.log('rawPacketNotSupported')
          this.saveToLocalStorage()
        }
        this.waitingForHandshakeCompletion = false
        m.redraw()
      }
    })
    this.activeConnection.on(Constants.PushCodes.TraceData, (event)=>{
      //console.log('TraceData', event)
      AppState.traceManager.traceComplete(event)
    })
    this.activeConnection.on(Constants.PushCodes.LogRxData, async (event) => {
      //console.log("LogRxData", event)

      let pkt: any = Packet.fromBytes(event.raw)
      let srcHashForPathIngress: Uint8Array | null = null
  
      //console.log(pkt)
      if (pkt.payload_type == Packet.PAYLOAD_TYPE_ADVERT) {
        let payload: any = pkt.parsePayload()
        const advert = await Advert.fromBytes(pkt.payload);
        //console.log(advert)

        if (payload.app_data.name == null || payload.app_data.name[0] == "\u0000") {
          console.log("ignoring invalid advert")
          console.log(pkt, payload, advert)
        } else {
          console.log("Advert from", payload.app_data.name)
          AppState.identityManager.addOrUpdate(advert)
          srcHashForPathIngress = advert.publicKey          
        }        
      } else if (pkt.payload_type == Packet.PAYLOAD_TYPE_TXT_MSG || pkt.payload_type == Packet.PAYLOAD_TYPE_GRP_TXT) {
        let decodeResult: any = {}
        if (pkt.payload_type == Packet.PAYLOAD_TYPE_GRP_TXT) {
          decodeResult = decryptChannelMsg(pkt.payload, AppState.channelManager)
          if (decodeResult.success) {
            console.log(decodeResult.channel.name + " [" + decodeResult.data.sender + "]: " + decodeResult.data.message)
            decodeResult.channel.addParticipant(decodeResult.data.sender, decodeResult.data.timestamp)
            AppState.channelManager.saveToLocalStorage()
            AppState.messageStore.addGroupMessage(decodeResult.channel.name, decodeResult.data.sender, decodeResult.data.timestamp, decodeResult.data.message)
          } else {
            console.log('encrypted group msg: ', decodeResult.reason)
          }
        } else if (pkt.payload_type == Packet.PAYLOAD_TYPE_TXT_MSG) {
          decodeResult = decryptTxtMsg(pkt.payload, AppState.identityManager)
          if (decodeResult.success) {
            let ackPkt = decodeResult.data.recipient.getAckIfNeeded(pkt.path, decodeResult.data.ack)
            if (ackPkt != null) {
              this.activeConnection.sendToRadioFrame(ackPkt)
            }
            console.log("From: " + decodeResult.data.sender.name + " -> " + decodeResult.data.recipient.name + ": " + decodeResult.data.message)
            AppState.messageStore.addDirectMessage(decodeResult.data.sender, decodeResult.data.recipient, decodeResult.data.timestamp, decodeResult.data.message)
          } else {
            console.log('encrypted direct msg', "path=" + bytesToHex(pkt.path), decodeResult.data)
            srcHashForPathIngress = new Uint8Array([decodeResult.data.srcHash])
          }
        }
        
        if (decodeResult.success == false) {
          AppState.packetLogs.addEncryptedPacket(pkt.path, pkt.payload)
        }      
      } else if (pkt.payload_type == Packet.PAYLOAD_TYPE_ACK) {    
        let tmp = pkt.parsePayload()
        console.log("heard ack", bytesToHex(tmp.ack_code))
      } 
  
      // add ingress path tracking
      AppState.packetLogs.addIngressPacket(pkt.getRouteTypeString(), pkt.path, srcHashForPathIngress)
      AppState.packetLogs.addLinks(pkt.path)
      AppState.packetLogs.saveToLocalStorage()
  
      //console.log(payload)
      m.redraw()
    })
  }

  isConnected() {
    return this.connectedRadio != null
  }

  getConnected() {
    return this.connectedRadio
  }

  getRadios(): Radio[] {
    return this.radios
  }

  sendToRadioFrame(data: Uint8Array) {
    this.activeConnection.sendToRadioFrame(data)
  }

  removeRadio(r: Radio) {
    for (let a = 0; a < this.radios.length; a++) {
      if (r == this.radios[a]) {
        this.radios.splice(a, 1)
        break
      }
    }
    this.saveToLocalStorage()
  }

  tryAutoConnect() {
    for (let a = 0; a < this.radios.length; a++) {
      if (this.radios[a].autoConnect && this.radios[a].connectionType == "websocket") {
        this.connect(this.radios[a])
        break
      }
    }
  }
}

class Radio {
  connectionType: string
  username: string
  hardware: string
  firmware: string
  firmwareDate: string
  websocketUrl: string
  sendRawPacketSupport: boolean
  autoConnect: boolean

  parse(data: any) {
    Object.assign(this, data)
    if (this.sendRawPacketSupport == null) {
      this.sendRawPacketSupport = false
    }
  }

  toggleAutoConnect() {
    if (this.autoConnect) {
      this.autoConnect = false
    } else {
      this.autoConnect = true
    }
  }
}

export {
  RadioStore
}