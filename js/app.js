// Enrutador Principal, Inicializador y Gestor del Estado Global de LocalRep
import { initDatabase, getBusiness } from "./database.js";
import { FunnelView } from "./views/funnel.js";
import { LoginView } from "./views/login.js";
import { DashboardView } from "./views/dashboard.js";

// Estado global de la aplicación
const AppState = {
  currentBusiness: null,
  activeView: null
};

// Elemento contenedor principal del DOM
const appContainer = document.getElementById("app-root");

/**
 * Navega a una ruta específica, adaptando el formato según el protocolo (Vercel vs Local)
 * @param {string} path Ruta de destino (ej. '/dashboard' o '/review/cafe-del-sol')
 */
export const navigateTo = (path) => {
  if (window.location.protocol === "file:") {
    // Si se ejecuta en local abriendo el HTML, usar hashes para evitar errores de recarga
    window.location.hash = "#" + path;
  } else {
    // Si se ejecuta en un servidor web (ej. Vercel), usar la API de History HTML5
    window.history.pushState(null, "", path);
    handleRoute();
  }
};

/**
 * Resuelve y enruta la vista actual según la URL
 */
const handleRoute = () => {
  const hash = window.location.hash;
  const path = window.location.pathname;

  let viewName = "";
  let businessIdParam = "";

  // 1. Resolver ruta desde Hash (para compatibilidad file://)
  if (hash && hash.startsWith("#/")) {
    const parts = hash.substring(2).split("/");
    viewName = parts[0];
    businessIdParam = parts[1] || "";
  } 
  // 2. Resolver ruta desde Path (para servidores web limpios/Vercel)
  else {
    const parts = path.substring(1).split("/");
    viewName = parts[0];
    businessIdParam = parts[1] || "";
  }

  // Limpieza de barra final o consultas
  if (viewName) viewName = viewName.replace(/\/$/, "");

  // --- ENRUTADOR DINÁMICO ---
  
  // A. Ruta del Embudo de opiniones de clientes: /review/:business_id
  if (viewName === "review" && businessIdParam) {
    AppState.activeView = "review";
    FunnelView.render(appContainer, businessIdParam);
  }
  // B. Ruta del Panel Administrativo de negocio: /dashboard
  else if (viewName === "dashboard") {
    AppState.activeView = "dashboard";
    
    // Validar si ya hay una sesión iniciada persistida en localStorage
    const savedId = localStorage.getItem("localrep_auth_business_id");
    
    if (savedId) {
      const business = getBusiness(savedId);
      if (business) {
        AppState.currentBusiness = business;
        DashboardView.render(appContainer, business.id, handleLogout);
        return;
      }
    }

    // Si no está autenticado, renderizar login
    LoginView.render(appContainer, AppState, (authenticatedBusiness) => {
      // Callback de Login exitoso: Transición animada al dashboard
      AppState.currentBusiness = authenticatedBusiness;
      navigateTo("/dashboard");
    });
  } 
  // C. Ruta por defecto: Redirección al embudo de Stella Cucina al Forno
  else {
    navigateTo("/review/stellaensenada");
  }
};

/**
 * Callback para manejar el cierre de sesión del negocio
 */
const handleLogout = () => {
  AppState.currentBusiness = null;
  navigateTo("/dashboard");
};

// --- INICIALIZACIÓN ---
const init = () => {
  // Inicializar base de datos con datos semilla
  initDatabase();

  // Escuchar eventos de navegación
  window.addEventListener("popstate", handleRoute);
  window.addEventListener("hashchange", handleRoute);

  // Interceptar todos los clics en enlaces con atributo [data-link]
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (link) {
      e.preventDefault();
      navigateTo(link.getAttribute("href"));
    }
  });

  // Ejecutar el enrutamiento inicial
  handleRoute();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

