import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
import 'element-plus/dist/index.css'

import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'


const app = createApp(App);
Object.keys(ElementPlusIconsVue).forEach(key => {
    app.component(key, ElementPlusIconsVue[key as keyof typeof ElementPlusIconsVue]);
});
app.use(ElementPlus).mount('#app')
