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
import TratteDashboard from '@/components/TratteDashboard.vue';
import EventForm from '@/components/EventForm.vue';
import MapLocation from '@/components/MapLocation.vue';
import OrganizerScanner from '@/components/OrganizerScanner.vue';
import ForgotPassword from '@/views/ForgotPassword.vue';
import ResetPassword from '@/views/ResetPassword.vue';
import OrganizerStats from '@/components/OrganizerStats.vue';
import AdminStatistiche from '@/components/AdminStatistiche.vue';
import AdminAttendanceHistogram from '@/components/AdminAttendanceHistogram.vue';
import OrganizerLocation from '@/components/OrganizerLocation.vue';
import TrattaScanner from '@/components/TrattaScanner.vue';
import MapTratte from '@/components/MapTratte.vue';

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
    path: '/organizer/statistiche',
    name: 'OrganizerStatistiche',
    component: OrganizerStats,
    meta: { requiresAuth: true, role: 'organizer' }
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
    path: '/admin/statistiche',
    name: 'AdminStatistiche',
    component: AdminStatistiche,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/statistiche/mappa',
    name: 'AdminStatMap',
    component: () => import('@/components/FlowMap.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/statistiche/istogramma',
    name: 'AdminStatHistogram',
    component: AdminAttendanceHistogram,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/organizer/event/:eventId/scan',
    name: 'OrganizerScanner',
    component: OrganizerScanner,
    props: true,
    meta: { requiresAuth: true, role: 'organizer' }
  },
  {
    path: '/trasporti/dashboard',
    name: 'TratteDashboard',
    component: TratteDashboard,
    meta: { requiresAuth: true, roles: ['trasporti', 'admin'] },
  },
  {
    path: '/organizer/event/:eventId/edit',
    name: 'EditEvent',
    component: EventForm,
    props: true,
    meta: { requiresAuth: true, role: 'organizer' }
  },
  {
    path: '/organizer/locations',
    name: 'OrganizerLocations',
    component: OrganizerLocation,
    meta: { requiresAuth: true, role: 'organizer' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPassword
  },
  {
    path: '/tratta-scanner/:trattaId/scan',
    name: 'TrattaScanner',
    component: TrattaScanner,
    props: true,
    meta: { requiresAuth: true, role: 'trasporti' }
  },
  {
    path: "/trasporti/mapTratte",
    name: 'MapTratte',
    component: MapTratte ,
      meta: { requiresAuth: true, roles: ['trasporti', 'admin'] },
  },
  {
    path: '/error',
    name: 'ErrorPage',
    component: () => import('@/views/Error.vue'),
    props: route => ({ message: route.query.message })
  },
  {
    path: '/:catchAll(.*)',
    redirect: { name: 'ErrorPage', query: { message: 'Pagina non trovata.' } }
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

  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    return next('/');
  }

  next();
});

export default router;