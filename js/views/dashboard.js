// Módulo del Panel Administrativo (Client Dashboard) - /dashboard
import { getBusiness, getReviews, getMetrics, updateReviewStatus, saveWebhookUrl, getWebhookUrl } from "../database.js";
import { AnalyticsChart } from "../components/chart.js";
import { WebhookToast } from "../components/toast.js";

export class DashboardView {
  /**
   * Renderiza e inicializa el Dashboard en el elemento destino de forma asíncrona.
   * @param {HTMLElement} targetTarget Destino HTML
   * @param {string} businessId ID del negocio autenticado
   * @param {Function} onLogoutCallback Callback al cerrar sesión
   */
  static async render(targetTarget, businessId, onLogoutCallback) {
    const business = getBusiness(businessId);
    if (!business) {
      onLogoutCallback();
      return;
    }

    // Obtener webhook URL de forma asíncrona
    const webhookUrl = await getWebhookUrl(business.id);

    // Renderizar maquetación base del panel administrativo
    targetTarget.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex flex-col gap-8">
        
        <!-- CABECERA PRINCIPAL -->
        <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
          <div class="flex items-center gap-3.5">
            ${business.logo_url ? `
              <div class="h-12 w-12 flex items-center justify-center">
                <img src="${business.logo_url.startsWith('http') || window.location.protocol === 'file:' ? business.logo_url : '/' + business.logo_url}" alt="${business.name}" class="h-full object-contain">
              </div>
            ` : `
              <div class="w-12 h-12 rounded-full bg-stone-900 text-stone-100 flex items-center justify-center font-heading font-extrabold text-lg shadow">
                ${business.name.substring(0, 2).toUpperCase()}
              </div>
            `}
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-heading">Panel de Control</span>
              <h1 class="text-2xl font-black text-stone-950 font-heading tracking-tight leading-none mt-0.5">${business.name}</h1>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <a href="#/review/${business.id}" target="_blank" 
              class="flex items-center gap-1.5 px-4 py-2 border border-stone-250 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-800 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              <span>Ver Embudo Público</span>
            </a>
            <button id="logout-btn" 
              class="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-stone-100 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer">
              Cerrar Sesión
            </button>
          </div>
        </header>

        <!-- BLOQUE DE MÉTRICAS CLAVE (Top) -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6" id="metrics-cards-container">
          <!-- Calificación Promedio -->
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start text-stone-400">
              <span class="text-xs uppercase tracking-wider font-semibold font-heading">Calificación Promedio</span>
              <span class="p-1.5 bg-stone-100 rounded-lg text-amber-500">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              </span>
            </div>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-stone-950 font-heading tracking-tight" id="metric-avg-rating">0.0</span>
              <span class="text-xs text-stone-400 font-sans">/ 5.0 (Historial total)</span>
            </div>
          </div>

          <!-- Reseñas Públicas Impulsadas -->
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start text-stone-400">
              <span class="text-xs uppercase tracking-wider font-semibold font-heading">Reseñas Públicas Impulsadas</span>
              <span class="p-1.5 bg-stone-100 rounded-lg text-emerald-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </span>
            </div>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-stone-950 font-heading tracking-tight" id="metric-public-clicks">0</span>
              <span class="text-xs text-stone-400 font-sans">Clics de 4-5★ a Google Maps</span>
            </div>
          </div>

          <!-- Alertas Detenidas a Tiempo -->
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start text-stone-400">
              <span class="text-xs uppercase tracking-wider font-semibold font-heading">Alertas Detenidas a Tiempo</span>
              <span class="p-1.5 bg-stone-100 rounded-lg text-stone-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </span>
            </div>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-stone-950 font-heading tracking-tight" id="metric-blocked-alerts">0</span>
              <span class="text-xs text-stone-400 font-sans" id="metric-pending-label">Formularios de 1-3★ capturados</span>
            </div>
          </div>
        </section>

        <!-- SECCIÓN DE GRÁFICO E INTEGRACIÓN WEBHOOK -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- GRÁFICO (Ocupa 2/3 columnas) -->
          <div class="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-bold text-stone-950 font-heading leading-none">Tendencias de Opinión</h3>
                <p class="text-xs text-stone-400 font-sans mt-1">Comparativa de clics públicos e internos de los últimos 7 días</p>
              </div>
              <div class="flex gap-4 text-[10px] uppercase font-bold tracking-wider font-heading">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded bg-stone-900 border border-stone-850"></span>
                  <span class="text-stone-700">Públicas (4-5★)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded bg-stone-400 border border-stone-300"></span>
                  <span class="text-stone-500">Críticas (1-3★)</span>
                </div>
              </div>
            </div>
            <div id="analytics-chart-container" class="w-full flex items-center justify-center py-2">
              <!-- El gráfico SVG interactivo se monta aquí -->
            </div>
          </div>

          <!-- INTEGRACIÓN WEBHOOK / CONFIGURACIÓN (Ocupa 1/3 columna) -->
          <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-5">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="p-1.5 bg-stone-950 text-white rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </span>
                <h3 class="text-lg font-bold text-stone-950 font-heading">Webhook n8n / Make</h3>
              </div>
              <p class="text-xs text-stone-500 leading-relaxed font-sans">
                Envía notificaciones de quejas (1-3★) en tiempo real a tu automatizador. Deja vacío para simular en local.
              </p>
              
              <div class="mt-2 space-y-3">
                <div>
                  <label for="webhook-url-input" class="block text-[10px] font-semibold text-stone-600 uppercase tracking-wider mb-1">URL del Webhook</label>
                  <input type="url" id="webhook-url-input" 
                    class="block w-full px-3 py-2.5 border border-stone-250 rounded-xl bg-white text-xs placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all font-sans text-stone-900"
                    placeholder="https://hook.eu2.make.com/..." 
                    value="${webhookUrl || ''}">
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-4">
              <button type="button" id="save-webhook-btn" 
                class="w-full py-2.5 bg-stone-950 hover:bg-stone-900 text-stone-100 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer">
                Guardar URL Webhook
              </button>
              
              <button type="button" id="test-webhook-btn" 
                class="w-full py-2.5 border border-stone-250 hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex justify-center items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span>Probar Envío Webhook</span>
              </button>
            </div>
          </div>
        </section>

        <!-- SECCIÓN BANDEJA DE ALERTAS CRÍTICAS (1-3 estrellas) -->
        <section class="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 class="text-lg font-bold text-stone-950 font-heading leading-none">Bandeja de Quejas Detenidas</h3>
              <p class="text-xs text-stone-400 font-sans mt-1">Alertas críticas privadas recibidas para retención interna</p>
            </div>
            <!-- Filtro de Inbox -->
            <div class="flex border border-stone-200 rounded-xl overflow-hidden text-xs font-semibold bg-stone-50">
              <button id="filter-all-btn" class="px-3.5 py-1.5 bg-stone-950 text-stone-100 transition-colors">Todos</button>
              <button id="filter-pending-btn" class="px-3.5 py-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 border-l border-stone-200 transition-colors">Pendientes</button>
            </div>
          </div>

          <!-- TABLA DE ALERTAS -->
          <div class="overflow-x-auto w-full border border-stone-200/60 rounded-xl mt-2">
            <table class="min-w-full divide-y divide-stone-200 text-left text-sm" id="alerts-table">
              <thead class="bg-stone-50 text-[10px] uppercase font-bold tracking-wider text-stone-500 font-heading">
                <tr>
                  <th class="px-4 py-3">Fecha</th>
                  <th class="px-4 py-3">Cliente</th>
                  <th class="px-4 py-3">Contacto</th>
                  <th class="px-4 py-3">Opinión</th>
                  <th class="px-4 py-3 max-w-xs">Comentario Privado</th>
                  <th class="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 bg-white font-sans text-stone-850" id="alerts-tbody">
                <!-- Se inyecta dinámicamente con JS -->
              </tbody>
            </table>
          </div>
        </section>

      </div>
    `;

    // --- ENLACES HTML ---
    const logoutBtn = targetTarget.querySelector("#logout-btn");
    const saveWebhookBtn = targetTarget.querySelector("#save-webhook-btn");
    const testWebhookBtn = targetTarget.querySelector("#test-webhook-btn");
    const webhookUrlInput = targetTarget.querySelector("#webhook-url-input");
    
    const filterAllBtn = targetTarget.querySelector("#filter-all-btn");
    const filterPendingBtn = targetTarget.querySelector("#filter-pending-btn");
    
    const tbody = targetTarget.querySelector("#alerts-tbody");

    // Variables de Filtro Local
    let currentFilter = "all"; // "all" o "pendiente"

    // Cerrar sesión
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("localrep_auth_business_id");
      onLogoutCallback();
    });

    // Guardar URL de Webhook
    saveWebhookBtn.addEventListener("click", async () => {
      const url = webhookUrlInput.value;
      const success = await saveWebhookUrl(business.id, url);
      if (success) {
        alertToast("Configuración guardada", "El Webhook ha sido configurado correctamente.");
      }
    });

    // Probar envío de Webhook
    testWebhookBtn.addEventListener("click", async () => {
      const payload = {
        event: "test_connection",
        business_id: business.id,
        business_name: business.name,
        message: "¡Conexión establecida con LocalRep!",
        rating: 5,
        customer_name: "Integración Stella Cucina",
        customer_phone: "+34 600 000 000",
        comment: "Excelente integración de canal de opiniones críticas, lista para producción.",
        timestamp: new Date().toISOString()
      };

      const url = webhookUrlInput.value;
      WebhookToast.show(payload, url);
    });

    // --- GESTIÓN DE FILTROS ---
    filterAllBtn.addEventListener("click", async () => {
      currentFilter = "all";
      filterAllBtn.className = "px-3.5 py-1.5 bg-stone-950 text-stone-100 transition-colors";
      filterPendingBtn.className = "px-3.5 py-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 border-l border-stone-200 transition-colors";
      await renderInbox();
    });

    filterPendingBtn.addEventListener("click", async () => {
      currentFilter = "pendiente";
      filterPendingBtn.className = "px-3.5 py-1.5 bg-stone-950 text-stone-100 transition-colors";
      filterAllBtn.className = "px-3.5 py-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors";
      await renderInbox();
    });

    // --- INICIALIZAR RENDERIZADO DEL PANEL ---
    (async () => {
      await syncMetricsAndChart();
      await renderInbox();
    })();

    // --- FUNCIONES INTERNAS REACTIVAS ---

    // 1. Sincronizar Tarjetas de Métricas y el Gráfico SVG
    async function syncMetricsAndChart() {
      const metrics = await getMetrics(business.id);
      
      // Actualizar valores en HTML
      document.getElementById("metric-avg-rating").textContent = metrics.averageRating.toFixed(1);
      document.getElementById("metric-public-clicks").textContent = metrics.publicClicksCount;
      document.getElementById("metric-blocked-alerts").textContent = metrics.blockedAlertsCount;

      const pendingLabel = document.getElementById("metric-pending-label");
      if (metrics.pendingAlertsCount > 0) {
        pendingLabel.innerHTML = `Formularios capturados (${metrics.pendingAlertsCount} <span class="text-amber-600 font-bold font-heading">Pendientes</span>)`;
      } else {
        pendingLabel.textContent = "Formularios de 1-3★ capturados";
      }

      // Renderizar el gráfico interactivo SVG
      AnalyticsChart.render("analytics-chart-container", business.id);
    }

    // 2. Renderizar Tabla de Opiniones Críticas
    async function renderInbox() {
      let reviews = await getReviews(business.id);

      // Aplicar filtro si corresponde
      if (currentFilter === "pendiente") {
        reviews = reviews.filter(r => r.status === "Pendiente");
      }

      if (reviews.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="px-4 py-12 text-center text-xs text-stone-400 font-sans">
              No hay opiniones registradas con los filtros seleccionados.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = reviews.map(review => {
        const dateObj = new Date(review.created_at);
        const formattedDate = dateObj.toLocaleDateString("es-ES", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        // Limpiar teléfono para API wa.me
        const cleanPhone = review.customer_phone.replace(/[^0-9+]/g, "").replace("+", "");
        const waLink = `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(review.customer_name)},%20gracias%20por%20visitarnos%20en%20${encodeURIComponent(business.name)}.%20Lamentamos%20los%20inconvenientes%20comentados%20en%20tu%20reseña...`;

        // Generar fila de la tabla
        return `
          <tr class="hover:bg-stone-50/50 transition-colors">
            <!-- Fecha -->
            <td class="px-4 py-3.5 text-xs text-stone-500 whitespace-nowrap">${formattedDate}</td>
            
            <!-- Nombre Cliente -->
            <td class="px-4 py-3.5 text-xs font-semibold text-stone-900">${review.customer_name}</td>
            
            <!-- Contacto WhatsApp -->
            <td class="px-4 py-3.5 text-xs whitespace-nowrap">
              <div class="flex items-center gap-1.5">
                <span class="text-stone-600">${review.customer_phone}</span>
                <a href="${waLink}" target="_blank" title="Chatear en WhatsApp"
                  class="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 transition-all">
                  <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.161.001 6.132 1.23 8.37 3.469 2.237 2.24 3.466 5.21 3.466 8.377 0 6.536-5.324 11.86-11.855 11.86-2.002-.001-3.973-.509-5.733-1.48L0 24zm6.292-4.147c1.62.964 3.238 1.472 4.903 1.473 5.485.002 9.948-4.461 9.95-9.95.002-2.659-1.031-5.161-2.909-7.04C16.417 2.457 13.918 1.42 11.26 1.42c-5.49 0-9.956 4.465-9.958 9.954-.001 1.77.472 3.497 1.368 5.03L1.696 20.3l4.653-1.22zM17.487 14.4c-.3-.15-1.78-.88-2.05-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.23-.65.08-1.54-.77-2.6-1.35-3.64-3.13-.27-.47-.27-.77-.07-.97.18-.18.4-.47.6-.7.2-.23.27-.38.4-.65.13-.27.07-.5-.03-.7-.1-.2-.8-1.92-1.1-2.63-.3-.7-.6-.6-.82-.6-.2-.01-.43-.01-.65-.01-.23 0-.6.08-.9.43-.3.35-1.15 1.13-1.15 2.75 0 1.63 1.18 3.19 1.35 3.42.18.23 2.33 3.56 5.65 5c.78.34 1.4.54 1.88.7.8.25 1.52.22 2.1.13.63-.1 1.77-.73 2.02-1.43.25-.7.25-1.3.17-1.43-.08-.13-.3-.23-.6-.38z"/></svg>
                </a>
              </div>
            </td>
 
            <!-- Estrellas Calificación -->
            <td class="px-4 py-3.5 whitespace-nowrap">
              <div class="flex items-center gap-0.5 text-amber-400">
                ${Array.from({ length: 5 }).map((_, idx) => `
                  <svg class="w-3.5 h-3.5 ${idx < review.rating ? 'fill-current' : 'text-stone-200 fill-current'}" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                `).join("")}
              </div>
            </td>
 
            <!-- Comentario Privado -->
            <td class="px-4 py-3.5 text-xs text-stone-600 max-w-xs break-words leading-relaxed">${review.comment}</td>
 
            <!-- Badge de Estado Interactivo -->
            <td class="px-4 py-3.5 text-center whitespace-nowrap">
              <button data-id="${review.id}" data-status="${review.status}"
                class="badge-transition px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-extrabold font-heading ${
                  review.status === "Atendido"
                    ? "bg-stone-100 text-stone-500 cursor-default"
                    : "bg-amber-100 hover:bg-stone-900 hover:text-stone-100 text-amber-800 cursor-pointer active:scale-95 shadow-sm"
                }">
                ${review.status}
              </button>
            </td>
          </tr>
        `;
      }).join("");
 
      // Configurar eventos para los badges de estado interactivos
      const badges = tbody.querySelectorAll("button[data-status='Pendiente']");
      badges.forEach(badge => {
        badge.addEventListener("click", async () => {
          const id = badge.getAttribute("data-id");
          
          // Actualizar estado en base de datos
          await updateReviewStatus(id, "Atendido");
 
          // Mostrar micro-transición visual en el botón
          badge.classList.remove("bg-amber-100", "text-amber-800", "hover:bg-stone-900", "hover:text-stone-100");
          badge.classList.add("bg-stone-100", "text-stone-500", "scale-90");
          badge.textContent = "Atendido";
          badge.style.pointerEvents = "none";
          badge.disabled = true;
 
          // Sincronizar el dashboard completo con retardo suave
          setTimeout(async () => {
            await syncMetricsAndChart();
            await renderInbox();
            alertToast("Alerta Actualizada", "El caso crítico ha sido marcado como Atendido con éxito.");
          }, 350);
        });
      });
    }
 
    // Alerta sutil flotante tipo Toast simplificada
    function alertToast(title, message) {
      const alert = document.createElement("div");
      alert.className = "fixed top-5 right-5 z-50 glass-panel-dark text-stone-100 px-4 py-3 rounded-xl shadow-xl border border-stone-850 flex flex-col gap-0.5 translate-y-10 opacity-0 animate-fade-in";
      alert.innerHTML = `
        <h4 class="text-xs font-bold text-white font-heading uppercase tracking-wide">${title}</h4>
        <p class="text-[11px] text-stone-400 font-sans">${message}</p>
      `;
      document.body.appendChild(alert);
      setTimeout(() => {
        alert.classList.remove("animate-fade-in");
        alert.classList.add("animate-fade-out");
        setTimeout(() => alert.remove(), 300);
      }, 3000);
    }
  }
}
export default DashboardView;
