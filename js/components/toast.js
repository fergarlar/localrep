// Componente Toast Premium de Simulación de Webhooks para LocalRep

export class WebhookToast {
  static container = null;

  static initContainer() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "webhook-toast-container";
      this.container.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 sm:px-0 pointer-events-none";
      document.body.appendChild(this.container);
    }
  }

  /**
   * Muestra un toast de webhook simulado o real con el payload JSON.
   * @param {Object} payload Datos enviados
   * @param {string} webhookUrl URL del Webhook (opcional)
   */
  static show(payload, webhookUrl = "") {
    this.initContainer();

    const isReal = !!webhookUrl;
    const toast = document.createElement("div");
    
    // Configuración visual del Panel Flotante
    toast.className = "glass-panel-dark text-stone-100 p-4 rounded-xl shadow-2xl border border-stone-800/80 flex flex-col gap-3 translate-y-10 opacity-0 pointer-events-auto transition-all duration-500 ease-out animate-fade-in";
    
    const formattedPayload = JSON.stringify(payload, null, 2);

    toast.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <span class="flex h-2.5 w-2.5 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isReal ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${isReal ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
          </span>
          <span class="text-xs uppercase tracking-widest font-semibold text-stone-400 font-heading">
            ${isReal ? 'Webhook Activado' : 'Webhook Simulado'}
          </span>
        </div>
        <button class="close-btn text-stone-400 hover:text-stone-100 transition-colors p-1" aria-label="Cerrar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="flex flex-col gap-1">
        <h4 class="text-sm font-semibold text-white">
          ${isReal ? 'Datos enviados con éxito' : 'Alerta Detenida (Listo para n8n/Make)'}
        </h4>
        <p class="text-xs text-stone-400 font-sans">
          ${isReal 
            ? `POST enviado a: <span class="break-all font-mono text-[10px] text-emerald-400">${webhookUrl}</span>`
            : 'Se detectó una calificación crítica (1-3★). Se ha simulado el envío del payload de automatización para evitar una reseña pública.'
          }
        </p>
      </div>

      <div class="relative bg-stone-950/80 rounded-lg p-2.5 border border-stone-800">
        <span class="absolute top-1 right-2 text-[9px] uppercase tracking-wider text-stone-500 font-mono">Payload JSON</span>
        <pre class="text-[10px] font-mono overflow-x-auto text-emerald-300/90 max-h-36 py-1 select-all leading-tight">${formattedPayload}</pre>
      </div>

      <!-- Barra de progreso de auto-cierre -->
      <div class="w-full bg-stone-800 h-1 rounded-full overflow-hidden">
        <div class="progress-bar bg-stone-400 h-full w-full transition-all duration-7000 ease-linear"></div>
      </div>
    `;

    // Agregar al contenedor
    this.container.appendChild(toast);

    // Iniciar animación de la barra de progreso
    const progressBar = toast.querySelector(".progress-bar");
    setTimeout(() => {
      progressBar.style.width = "0%";
    }, 50);

    // Manejar cierre manual
    const closeBtn = toast.querySelector(".close-btn");
    const removeToast = () => {
      toast.classList.remove("animate-fade-in");
      toast.classList.add("animate-fade-out");
      setTimeout(() => {
        toast.remove();
      }, 300);
    };

    closeBtn.addEventListener("click", removeToast);

    // Auto-cierre a los 7 segundos
    const autoCloseTimer = setTimeout(removeToast, 7000);

    // Cancelar temporizador si se cierra manualmente
    closeBtn.addEventListener("click", () => {
      clearTimeout(autoCloseTimer);
    });

    // --- ENVIAR WEBHOOK REAL SI EXISTE ---
    if (isReal) {
      fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        console.log("Webhook real disparado con éxito:", response);
      })
      .catch(error => {
        console.error("Error al disparar webhook real:", error);
        // Cambiar indicador a error
        const indicator = toast.querySelector(".bg-emerald-500");
        if (indicator) {
          indicator.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500";
        }
        const text = toast.querySelector(".text-emerald-400");
        if (text) {
          text.className = "break-all font-mono text-[10px] text-rose-400";
          text.innerHTML = `Fallo de conexión en Webhook`;
        }
      });
    }
  }
}
export default WebhookToast;
