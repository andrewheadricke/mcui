import m from 'mithril'

import AppState from '../lib/appstate'
import Sidebar from './sidebar'
import MobileTopBar from './mobiletopbar'

import RadioSection from '../components/radio'
import MapSection from '../components/map'
import IdentitiesSection from '../components/identities'
import DirectSection from '../components/direct'
import ContactsSection from '../components/contacts'
import ChannelsSection from '../components/channels'
import MobileBottomNav from './mobilebottomnav'
import NeighborsSection from './neighbors'
import LinksSection from './links'
import TracesSection from './traces'
import MobileSlideOver from './mobile_slideover'
import RoomsSection from './rooms'
import Modal from './modal'
import SettingsSection from './settings'

import ChannelView from "./channelview"

let getSectionComponent = function() {
  if (AppState.currentSection == "Radio") {
    return RadioSection
  } else if (AppState.currentSection == "Identities") {
    return IdentitiesSection
  } else if (AppState.currentSection == "Map") {
    return MapSection
  } else if (AppState.currentSection == "Direct") {
    return DirectSection
  } else if (AppState.currentSection == "Contacts") {
    return ContactsSection
  } else if (AppState.currentSection == "Channels") {
    return ChannelsSection
  } else if (AppState.currentSection == "Channel") {
    return ChannelView
  } else if (AppState.currentSection == "Neighbors") {
    return NeighborsSection
  } else if (AppState.currentSection == "Links") {
    return LinksSection
  } else if (AppState.currentSection == "Traces") {
    return TracesSection
  } else if (AppState.currentSection == "Rooms") {
    return RoomsSection
  } else if (AppState.currentSection == "Settings") {
    return SettingsSection
  }
}

export default {
  oninit: (vnode: any)=>{
  },
  onbeforeupdate: (vnode: any)=>{
  },
  view: (vnode: any)=>{
    return [
      m("div.flex flex-1 overflow-hidden",
        m(Sidebar),
        m("div.flex-1 flex flex-col w-full mb-20 md:mb-0",
          m(MobileTopBar),
          m("main.flex-1 overflow-y-auto",
            m(getSectionComponent())
          )
        )
      ),
      m(MobileBottomNav),
      m(MobileSlideOver),
      (()=>{
        if (AppState.getActiveModal()) {
          return m(Modal)
        }
      })()
    ]
  }
}