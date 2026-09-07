import './assets/main.css'
import './assets/rich-content.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { clearLegacyBrowserContent } from './services/localDb'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
const userStore = useUserStore()
await Promise.allSettled([userStore.initialize(), clearLegacyBrowserContent()])

app.use(router)
app.mount('#app')
