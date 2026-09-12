import './assets/main.css'
import './assets/rich-content.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { clearLegacyBrowserContent } from './services/localDb'
import { installCodeCopyHandler } from './utils/richHtml'

// 代码块「复制」按钮的点击委托，全局只装一次
installCodeCopyHandler()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
const userStore = useUserStore()
await Promise.allSettled([userStore.initialize(), clearLegacyBrowserContent()])

app.use(router)
app.mount('#app')
