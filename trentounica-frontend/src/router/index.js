// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/Home.vue';
import UserLogin from '@/views/Login.vue';
import UserRegister from '@/views/Register.vue';

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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;