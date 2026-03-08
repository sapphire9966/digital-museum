import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../components/HomeView.vue'
import ExhibitionDetailView from '../components/ExhibitionDetailView.vue'
import CollectionsView from '../components/CollectionsView.vue'
import LearningView from '../components/LearningView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/exhibitions/id=:id',
    name: 'exhibition-detail',
    component: ExhibitionDetailView,
    props: true,
  },
  {
    path: '/collections',
    name: 'collections',
    component: CollectionsView,
  },
  {
    path: '/collections/:id',
    name: 'collection-detail',
    component: ExhibitionDetailView,
    props: true,
  },
  {
    path: '/learning',
    name: 'learning',
    component: LearningView,
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