import m from 'mithril'

function importIdentity(vnode) {
  let elImport = document.getElementById("txtPrivateKeyImport")
  if (elImport == null) {
    return
  }
  let elImportInput = elImport as HTMLInputElement
  let privateKeyHex = elImportInput.value
  let newIdentity = vnode.attrs.identityManager.importPrivateKey(privateKeyHex)

  if (newIdentity == null) {
    console.log("import failed")
  } else {
    vnode.state.keyInput = ""
    //console.log(newIdentity.GetPublicKeyHex())
  }  
}

export default {
  oninit: (vnode)=>{
    vnode.state.keyInput = ""
    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("div",
      m("input.rounded outline-none border border-gray-300 focus:border-blue-500 transition duration-300 ease-in-out w-1/2", {type:"text", id:"txtPrivateKeyImport", placeholder:"private key in hex format", value: vnode.state.keyInput}),
      m("button.ms-1 text-white bg-blue-700 hover:bg-blue-800 focus:ring-3 focus:ring-blue-300 font-bold rounded-lg text-sm px-5 py-2 me-2 mb-2 focus:outline-none", {type:"button", onclick: (e)=>importIdentity(vnode)}, "Import")
    )
  }
}
