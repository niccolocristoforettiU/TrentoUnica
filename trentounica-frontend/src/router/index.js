// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/Home.vue';
import UserLogin from '@/views/Login.vue';
import UserRegister from '@/views/Register.vue';
import AppCalendar from "@/components/AppCalendar.vue";
import SearchBar from '@/components/SearchBar.vue';
import OrganizerDashboard from '@/views/OrganizerDashboard.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/login',
    name: 'Login',
    component: UserLogin,
  },
  {
    path: '/register',
    name: 'Register',
    component: UserRegister,
  },
  { 
    path: "/Appcalendar",
    name: 'AppCalendar',
    component: AppCalendar ,
  },
  { 
    path: "/SearchBar",
    name: 'SearchBar',
    component: SearchBar ,
  },
    {
    path: '/organizer-dashboard',
    name: 'OrganizerDashboard',
    component: OrganizerDashboard,
    meta: { requiresAuth: true, role: 'organizer' }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Middleware per proteggere le rotte
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  if (to.meta.role && userRole !== to.meta.role) {
    return next('/');
  }

  next();
});


export default router;