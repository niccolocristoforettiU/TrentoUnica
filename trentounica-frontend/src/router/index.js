// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/Home.vue';
import UserLogin from '@/views/Login.vue';
import UserRegister from '@/views/Register.vue';
import AppCalendar from "@/components/AppCalendar.vue";
import SearchBar from '@/components/SearchBar.vue';
import ClientDashboard from '@/components/ClientDashboard.vue';
import AdminDashboardPage from '@/views/AdminDashboardPage.vue';
import OrganizerDashboard from '@/components/OrganizerDashboard.vue';
import EventForm from '@/components/EventForm.vue';
import MapLocation from '@/components/MapLocation.vue';


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
    path: "/MapLocation",
    name: 'MapLocation',
    component: MapLocation ,
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
    path: '/organizer/create-event',
    name: 'CreateEvent',
    component: EventForm,
    meta: { requiresAuth: true, role: 'organizer' }
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