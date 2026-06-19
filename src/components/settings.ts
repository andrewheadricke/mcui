import m from 'mithril'
import AppState from '../lib/appstate'

let eraseAllLinks = ()=>{
  AppState.packetLogs.clearData()
}

let exportData = ()=>{

  let json = JSON.stringify(AppState.exportData())
  const blob = new Blob([json], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = "mcui_backup.json";

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let eraseAllData = ()=>{
  AppState.clearAllData()
}

let showImportDialog = ()=> {
  document.getElementById("fileInput").click()
}

export default {
  oninit: (vnode)=>{
    vnode.state.draftOurNodePrefix = AppState.packetLogs.ourNodePrefix
  },
  oncreate: (vnode)=>{
    document.getElementById('fileInput').addEventListener('change', function(event) {
      let inputEl = event.target as HTMLInputElement
      const file = inputEl.files[0]; // Get the first file from the list
      if (!file) {
        return;
      }

      const reader = new FileReader(); // Create a FileReader object

      // Define the onload event handler
      reader.onload = function(e) {
        const fileContents = e.target.result;
        let dataObj
        try {
          dataObj = JSON.parse(fileContents as string)
        } catch (e){
          console.log('error loading backup')
          return
        }
        AppState.importData(dataObj)
      };

      // Define the onerror event handler (optional, but good practice)
      reader.onerror = function(error) {
        console.error('Error reading file: ', error);
      };

      // Read the file as text
      reader.readAsText(file);
    })
  },
  view: (vnode)=>{
    return m("section.content-section flex flex-col h-full",
      m("div.p-6 md:p-8",
        m("h2.text-2xl md:text-3xl font-bold mb-4", "Settings"),
        m("div.text-gray-500", "Storage used: ", AppState.storageUsed),
        m("hr.mt-4 mb-4 text-gray-500"),
        m("div.mt-2",           
          m("label", "Our node prefix append for link paths:"),
          m("div.flex",
            m("input.rounded-l-md ms-2 bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6", {type:"text", placeholder:"e.g. 01ab", value: vnode.state.draftOurNodePrefix, oninput: (e)=>vnode.state.draftOurNodePrefix=e.target.value}),
            m("button.bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 rounded-r-md", {onclick:()=>AppState.packetLogs.setOurNodePrefix(vnode.state.draftOurNodePrefix)}, "Save")
          )
        ),
        m("div.mt-2", m("span.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick: AppState.packetLogs.disable1Byte()}, "Disable 1 byte links logging")),
        m("div.mt-2", m("span.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick: eraseAllLinks}, "Reset all links")),
        m("div.mt-4", m("span.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick: eraseAllData}, "Erase ALL DATA")),
        m("hr.mt-4 mb-4 text-gray-500"),
        m("div.mt-2", m("span.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick: exportData}, "Export settings/data")),
        m("div.mt-2", 
          m("input", {type:"file", id:"fileInput", style:"display: none;"}),
          m("span.bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full mt-2 cursor-pointer", {onclick: showImportDialog}, "Import settings/data")
        )
      )
    )
  }
}