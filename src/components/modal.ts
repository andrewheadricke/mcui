import m from 'mithril'
import AppState from '../lib/appstate'

export default {
  view: (vnode)=>{
    return m("div.fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent backdrop:bg-transparent",
      m("el-dialog-backdrop.fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"),
      m("div.flex min-h-full items-center justify-center p-4 text-center focus:outline-none sm:p-0",
        m("el-dialog-panel.relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 md:my-10 w-full sm:m-8 lg:m-20 xl:mx-100", {class:"h-[60vh]"},
          m(AppState.getActiveModal())
        )
      )
    )
  }
}