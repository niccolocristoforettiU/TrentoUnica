// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/Home.vue';
import UserLogin from '@/views/Login.vue';
import UserRegister from '@/views/Register.vue';
import AppCalendar from "@/components/AppCalendar.vue";
import EventDetail from '@/components/EventDetail.vue';
import SearchBar from '@/components/SearchBar.vue';
import ClientDashboard from '@/components/ClientDashboard.vue';
import AdminDashboard from '@/components/AdminDashboard.vue';
import OrganizerDashboard from '@/components/OrganizerDashboard.vue';
import EventForm from '@/components/EventForm.vue';
import MapLocation from '@/components/MapLocation.vue';
import OrganizerScanner from '@/components/OrganizerScanner.vue';

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
    path: '/event/:id',
    name: 'EventDetail',
    component: EventDetail
  },
  { 
    path: "/map",
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
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/organizer/event/:eventId/scan',
    name: 'OrganizerScanner',
    component: OrganizerScanner,
    props: true, // 👈 ESSENZIALE!
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