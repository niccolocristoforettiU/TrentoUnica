// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/Home.vue';
import UserLogin from '@/views/Login.vue';
import UserRegister from '@/views/Register.vue';
import AppCalendar from "@/components/AppCalendar.vue";
import SearchBar from '@/components/SearchBar.vue';
import ClientDashboard from '@/components/ClientDashboard.vue';
import AdminDashboardPage from '@/views/AdminDashboardPage.vue';OrganizerDashboard
import OrganizerDashboard from '@/components/OrganizerDashboard.vue';

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
    path: '/client/dashboard',
    name: 'ClientDashboard',
    component: ClientDashboard,
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/organizer/dashboard',
    name: 'OrganizerDashboard',
    component: OrganizerDashboard,
    meta: { requiresAuth: true, role: 'organizer' },
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboardPage',
    component: AdminDashboardPage,
    meta: { requiresAuth: true, role: 'admin' },
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const role = to.meta.role;
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (requiresAuth && (!token || userRole !== role)) {
    return next('/login');
  }

  next();
});

export default router;