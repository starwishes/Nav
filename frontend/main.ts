import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/font/iconfont.css'
import '@/assets/css/base.css'
import '@/assets/css/content.scss'
import router from "./router";


import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from '@/plugins/i18n'

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)
createApp(App).use(router).use(ElementPlus).use(pinia).use(i18n).mount('#app')
