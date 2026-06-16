// Módulo de Embudo de Reseñas (Customer-Facing Review Funnel) - /review/:id
import { getBusiness, addReview, addPublicClick, getWebhookUrl } from "../database.js";
import { WebhookToast } from "../components/toast.js";

export class FunnelView {
  /**
   * Renderiza e inicializa la vista del Embudo de Calificación.
   * @param {HTMLElement} targetTarget Destino HTML
   * @param {string} businessId ID del negocio
   */
  static async render(targetTarget, businessId) {
    const business = getBusiness(businessId);

    // Si el negocio no existe, mostrar pantalla de error minimalista
    if (!business) {
      targetTarget.innerHTML = `
        <div class="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
          <div class="p-4 bg-stone-100 rounded-2xl mb-4 text-stone-500">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-stone-900 font-heading">Negocio no encontrado</h2>
          <p class="text-sm text-stone-500 mt-2 max-w-sm">
            El enlace que has ingresado parece no estar activo o es incorrecto. Por favor, contacta al administrador.
          </p>
          <a href="#/dashboard" class="mt-6 text-xs uppercase tracking-wider font-semibold bg-stone-950 text-stone-100 px-5 py-3 rounded-xl hover:bg-stone-900 active:scale-95 transition-all">
            Ir al Dashboard
          </a>
        </div>
      `;
      return;
    }

    // Inicializar variables de estado locales del embudo
    let currentSelectedRating = 0;

    // Renderizar maquetación base estructurada del embudo (Mobile-First)
    targetTarget.innerHTML = `
      <div class="min-h-[85vh] flex items-center justify-center px-4 py-8 animate-fade-in">
        <div class="w-full max-w-md bg-white border border-stone-200/85 shadow-xl rounded-2xl p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden">
          
          <!-- Capa de Fondo Decorativa Sutil -->
          <div class="absolute top-0 right-0 w-24 h-24 bg-stone-100 rounded-full blur-2xl -mr-6 -mt-6"></div>

          <!-- Cabecera con Logo y Nombre -->
          <div class="flex flex-col items-center text-center gap-3 relative z-10">
            ${business.logo_url ? `
              <div class="h-20 flex items-center justify-center mb-1">
                <img src="${business.logo_url.startsWith('http') || window.location.protocol === 'file:' ? business.logo_url : '/' + business.logo_url}" alt="${business.name}" class="h-full object-contain">
              </div>
            ` : `
              <div class="w-14 h-14 rounded-full bg-stone-950 text-white font-heading font-extrabold text-xl flex items-center justify-center shadow-lg uppercase tracking-wide">
                ${business.name.substring(0, 2)}
              </div>
            `}
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-bold uppercase tracking-widest text-stone-400 font-heading">Dinos tu opinión</span>
              <h2 class="text-2xl font-black text-stone-950 font-heading tracking-tight leading-none">${business.name}</h2>
            </div>
          </div>

          <!-- PANTALLA 1: SISTEMA DE CALIFICACIÓN POR ESTRELLAS -->
          <div id="funnel-rating-screen" class="flex flex-col items-center gap-5 py-4 relative z-10 transition-all duration-300">
            <p class="text-sm text-stone-500 text-center font-sans max-w-xs">
              ¿Cómo fue tu experiencia hoy con nosotros? Por favor, selecciona una puntuación:
            </p>

            <!-- Contenedor de Estrellas -->
            <div class="flex items-center gap-1.5 py-2" id="stars-row">
              ${[1, 2, 3, 4, 5].map(num => `
                <button type="button" data-value="${num}" class="star-btn p-1 text-stone-200 hover:text-amber-400 transition-colors focus:outline-none" aria-label="Calificar ${num} estrellas">
                  <svg class="w-10 h-10 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                </button>
              `).join("")}
            </div>

            <!-- Etiqueta Dinámica del Nivel de Puntuación -->
            <div class="h-6 flex items-center justify-center">
              <span id="rating-helper-text" class="text-xs uppercase tracking-widest font-extrabold text-stone-400 font-heading"></span>
            </div>
          </div>

          <!-- PANTALLA 2: FORMULARIO DE COMENTARIOS CRÍTICOS (Oculto inicialmente) -->
          <div id="funnel-form-screen" class="hidden flex flex-col gap-4 relative z-10 opacity-0 transition-opacity duration-400">
            <div class="border-t border-stone-100 pt-4 flex flex-col gap-1 text-center">
              <h3 class="text-md font-bold text-stone-900 font-heading">Queremos mejorar tu experiencia</h3>
              <p class="text-xs text-stone-500 font-sans">
                Lamentamos que tu visita no haya sido ideal. Ayúdanos contándonos qué falló. Tu opinión llegará directamente a la gerencia de forma privada.
              </p>
            </div>

            <form id="funnel-feedback-form" class="space-y-4">
              <!-- Nombre -->
              <div>
                <label for="form-name" class="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Nombre Completo</label>
                <input type="text" id="form-name" required
                  class="block w-full px-3.5 py-2.5 border border-stone-250 rounded-xl bg-stone-50/50 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all font-sans text-stone-900"
                  placeholder="ej. Juan Pérez">
              </div>

              <!-- Teléfono / WhatsApp -->
              <div>
                <label for="form-phone" class="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">WhatsApp / Teléfono</label>
                <input type="tel" id="form-phone" required
                  class="block w-full px-3.5 py-2.5 border border-stone-250 rounded-xl bg-stone-50/50 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all font-sans text-stone-900"
                  placeholder="ej. +34 600 000 000">
              </div>

              <!-- Comentario -->
              <div>
                <label for="form-comment" class="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">¿Qué podemos mejorar?</label>
                <textarea id="form-comment" rows="3" required
                  class="block w-full px-3.5 py-2.5 border border-stone-250 rounded-xl bg-stone-50/50 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all font-sans text-stone-900"
                  placeholder="Escribe tu opinión aquí..."></textarea>
              </div>

              <!-- Botones de Acción -->
              <div class="flex gap-2 pt-2">
                <button type="button" id="form-back-btn"
                  class="w-1/3 py-3 border border-stone-250 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center">
                  Atrás
                </button>
                <button type="submit" id="form-submit-btn"
                  class="w-2/3 py-3 bg-stone-950 text-stone-100 rounded-xl text-xs font-semibold hover:bg-stone-900 active:scale-95 transition-all cursor-pointer flex justify-center items-center gap-1.5">
                  <span>Enviar Comentario</span>
                  <svg id="form-spinner" class="hidden animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </button>
              </div>
            </form>
          </div>

          <!-- PANTALLA 3: AGRADECIMIENTO FINAL (Oculto inicialmente) -->
          <div id="funnel-success-screen" class="hidden flex flex-col items-center text-center gap-4 py-8 animate-fade-in">
            <div class="w-16 h-16 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center shadow-lg relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-900 opacity-20"></span>
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 class="text-2xl font-black text-stone-950 font-heading">¡Muchas gracias!</h3>
            <p class="text-sm text-stone-500 max-w-xs leading-relaxed">
              Valoramos enormemente tu opinión. Tus comentarios han sido enviados directamente al equipo directivo del negocio de forma confidencial. Nos pondremos en contacto contigo si es necesario para asegurar tu plena satisfacción.
            </p>
          </div>

          <!-- PANTALLA 4: REDIRECCIÓN PÚBLICA DE EXCELENCIA (Oculto inicialmente) -->
          <div id="funnel-redirect-screen" class="hidden flex flex-col items-center text-center gap-4 py-8 animate-fade-in">
            <div class="w-16 h-16 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
              <svg class="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            </div>
            <h3 class="text-2xl font-black text-stone-950 font-heading">¡Nos alegra tu opinión!</h3>
            <p class="text-sm text-stone-500 max-w-xs leading-relaxed">
              Nos alegra saber que has tenido una experiencia fantástica. Te estamos redirigiendo a nuestra ficha de Google Maps para que puedas compartir tu experiencia con toda la comunidad. ¡Nos ayuda muchísimo!
            </p>
            <div class="flex items-center gap-1 text-[11px] text-stone-400 font-sans mt-2">
              <span class="w-1.5 h-1.5 rounded-full bg-stone-300 animate-pulse"></span>
              <span>Redireccionando de forma segura...</span>
            </div>
          </div>

        </div>
      </div>
    `;

    // --- ENLACE A ELEMENTOS HTML ---
    const starsRow = targetTarget.querySelector("#stars-row");
    const starBtns = targetTarget.querySelectorAll(".star-btn");
    const helperText = targetTarget.querySelector("#rating-helper-text");
    
    const ratingScreen = targetTarget.querySelector("#funnel-rating-screen");
    const formScreen = targetTarget.querySelector("#funnel-form-screen");
    const successScreen = targetTarget.querySelector("#funnel-success-screen");
    const redirectScreen = targetTarget.querySelector("#funnel-redirect-screen");
    
    const feedbackForm = targetTarget.querySelector("#funnel-feedback-form");
    const formBackBtn = targetTarget.querySelector("#form-back-btn");
    const formSubmitBtn = targetTarget.querySelector("#form-submit-btn");
    const formSpinner = targetTarget.querySelector("#form-spinner");

    // Textos auxiliares según calificación
    const ratingLabels = {
      1: "Muy Malo",
      2: "Malo",
      3: "Regular / Aceptable",
      4: "Muy Bueno",
      5: "¡Excelente!"
    };

    // --- LÓGICA DE HOVER DE ESTRELLAS ---
    starBtns.forEach(btn => {
      btn.addEventListener("mouseenter", () => {
        const val = parseInt(btn.getAttribute("data-value"));
        highlightStars(val);
        helperText.textContent = ratingLabels[val] || "";
        helperText.className = "text-xs uppercase tracking-widest font-extrabold font-heading text-amber-500 transition-colors duration-150";
      });

      btn.addEventListener("mouseleave", () => {
        // Regresar a la selección actual
        highlightStars(currentSelectedRating);
        if (currentSelectedRating > 0) {
          helperText.textContent = ratingLabels[currentSelectedRating];
          helperText.className = "text-xs uppercase tracking-widest font-extrabold font-heading text-stone-900";
        } else {
          helperText.textContent = "";
          helperText.className = "text-xs uppercase tracking-widest font-extrabold font-heading text-stone-400";
        }
      });

      // --- LÓGICA DE CLIC EN ESTRELLA ---
      btn.addEventListener("click", async () => {
        const val = parseInt(btn.getAttribute("data-value"));
        currentSelectedRating = val;
        highlightStars(val);

        // Deshabilitar clics rápidos para evitar doble acción
        disableStarsRow();

        // 1. REGLA DE REDIRECCIÓN (4 o 5 estrellas)
        if (val === 4 || val === 5) {
          // Registrar clic de redirección pública
          await addPublicClick(businessId, val);

          // Transicionar a la pantalla de redirección
          ratingScreen.classList.add("hidden");
          redirectScreen.classList.remove("hidden");

          // Redirección sutil con retardo (1.2 segundos) para celebrar con el usuario
          setTimeout(() => {
            window.location.href = business.google_maps_url;
          }, 1200);
        }
        // 2. REGLA DE RETENCIÓN INTERNA (1, 2 o 3 estrellas)
        else {
          // Transición suave: desplaza estrellas y muestra formulario
          ratingScreen.classList.add("hidden");
          
          formScreen.classList.remove("hidden");
          setTimeout(() => {
            formScreen.classList.remove("opacity-0");
          }, 50);
        }
      });
    });

    // Retroceder del formulario a las estrellas
    formBackBtn.addEventListener("click", () => {
      // Reiniciar selección
      currentSelectedRating = 0;
      highlightStars(0);
      enableStarsRow();

      // Esconder formulario y volver a mostrar estrellas
      formScreen.classList.add("opacity-0");
      setTimeout(() => {
        formScreen.classList.add("hidden");
        ratingScreen.classList.remove("hidden");
      }, 300);
    });

    // Envío del Formulario Crítico
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Activar animación
      formSubmitBtn.disabled = true;
      formSpinner.classList.remove("hidden");

      const name = targetTarget.querySelector("#form-name").value;
      const phone = targetTarget.querySelector("#form-phone").value;
      const comment = targetTarget.querySelector("#form-comment").value;

      try {
        // Guardar opinión crítica (llamada remota/asíncrona)
        const newReview = await addReview(businessId, currentSelectedRating, name, phone, comment);

        // Obtener webhook URL de forma asíncrona
        const webhookUrl = await getWebhookUrl(businessId);
        
        // Crear el payload formalizado
        const payload = {
          event: "critical_feedback_received",
          business_id: businessId,
          business_name: business.name,
          review_id: newReview.id,
          rating: newReview.rating,
          customer_name: newReview.customer_name,
          customer_phone: newReview.customer_phone,
          comment: newReview.comment,
          timestamp: newReview.created_at,
          status: newReview.status
        };

        // Mostrar notificación de webhook en la interfaz administrativa
        WebhookToast.show(payload, webhookUrl);

        formSubmitBtn.disabled = false;
        formSpinner.classList.add("hidden");

        // Transicionar a pantalla de agradecimiento
        formScreen.classList.add("hidden");
        successScreen.classList.remove("hidden");
      } catch (err) {
        console.error("Error al registrar opinión crítica:", err);
        formSubmitBtn.disabled = false;
        formSpinner.classList.add("hidden");
      }
    });

    // --- FUNCIONES AUXILIARES INTERNAS ---
    
    // Iluminar estrellas hasta el nivel indicado
    function highlightStars(count) {
      starBtns.forEach(btn => {
        const val = parseInt(btn.getAttribute("data-value"));
        if (val <= count) {
          btn.className = "star-btn p-1 text-amber-400 transition-colors focus:outline-none";
        } else {
          btn.className = "star-btn p-1 text-stone-200 transition-colors focus:outline-none";
        }
      });
    }

    // Deshabilitar fila de estrellas
    function disableStarsRow() {
      starBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.pointerEvents = "none";
      });
    }

    // Habilitar fila de estrellas
    function enableStarsRow() {
      starBtns.forEach(btn => {
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
      });
    }
  }
}
export default FunnelView;
