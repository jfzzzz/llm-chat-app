import { createApp } from 'vue'
import ElementPlus from 'element-plus' // Import Element Plus
import 'element-plus/dist/index.css' // Import Element Plus CSS
import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus) // Use Element Plus
app.mount('#app')
