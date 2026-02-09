import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../components/HomeView.vue'
import ExhibitionDetailView from '../components/ExhibitionDetailView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/exhibitions/:id',
    name: 'exhibition-detail',
    component: ExhibitionDetailView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router

