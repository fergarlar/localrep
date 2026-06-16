// Módulo de Inicio de Sesión Seguro (Login) para LocalRep
import { authenticateBusiness } from "../database.js";

export class LoginView {
  /**
   * Renderiza e inicializa la vista de Login en el elemento destino.
   * @param {HTMLElement} targetTarget Destino HTML
   * @param {Object} appState Estado global de la app
   * @param {Function} onLoginCallback Callback al autenticar con éxito
   */
  static render(targetTarget, appState, onLoginCallback) {
    targetTarget.innerHTML = `
      <div class="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
        <div class="max-w-md w-full space-y-8 glass-panel p-8 sm:p-10 rounded-2xl shadow-xl">
          
          <!-- Cabecera de Identificación -->
          <div class="text-center">
            <div class="flex justify-center mb-3">
              <span class="inline-flex items-center justify-center p-3 rounded-xl bg-stone-900 text-stone-100 shadow-md">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </span>
            </div>
            <h2 class="text-3xl font-extrabold text-stone-950 font-heading tracking-tight">
              Ingresar a LocalRep
            </h2>
            <p class="mt-2.5 text-xs text-stone-500 font-sans">
              Accede a tu panel privado de gestión de reputación y opiniones
            </p>
          </div>

          <!-- Mensaje de Error (Inicialmente Oculto) -->
          <div id="login-error-alert" class="hidden flex items-center gap-2 p-3 text-xs bg-rose-50 border border-rose-250 text-rose-700 rounded-lg animate-float">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span id="login-error-msg">Usuario o contraseña incorrectos.</span>
          </div>

          <!-- Formulario de Entrada -->
          <form class="mt-6 space-y-5" id="login-form">
            <div class="space-y-4">
              
              <!-- Usuario -->
              <div>
                <label for="username-input" class="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Usuario
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </span>
                  <input id="username-input" name="username" type="text" required autocomplete="username"
                    class="block w-full pl-10 pr-4 py-3 border border-stone-250 rounded-xl bg-white/70 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all font-sans text-stone-900" 
                    placeholder="ej. admin">
                </div>
              </div>

              <!-- Contraseña -->
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label for="password-input" class="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Contraseña
                  </label>
                </div>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </span>
                  <input id="password-input" name="password" type="password" required autocomplete="current-password"
                    class="block w-full pl-10 pr-10 py-3 border border-stone-250 rounded-xl bg-white/70 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all font-sans text-stone-900" 
                    placeholder="••••••••">
                  <button type="button" id="toggle-password-btn" class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 transition-colors">
                    <svg id="eye-icon-show" class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    <svg id="eye-icon-hide" class="hidden w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Botón de Envío -->
            <button type="submit" id="submit-btn" 
              class="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-stone-100 bg-stone-950 hover:bg-stone-900 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-950 transition-all cursor-pointer">
              <span>Iniciar Sesión</span>
              <svg id="submit-spinner" class="hidden animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>
          </form>

        </div>
      </div>
    `;

    // --- MANEJO DE EVENTOS ---
    const form = targetTarget.querySelector("#login-form");
    const usernameInput = targetTarget.querySelector("#username-input");
    const passwordInput = targetTarget.querySelector("#password-input");
    const togglePasswordBtn = targetTarget.querySelector("#toggle-password-btn");
    const eyeShow = targetTarget.querySelector("#eye-icon-show");
    const eyeHide = targetTarget.querySelector("#eye-icon-hide");
    
    const errorAlert = targetTarget.querySelector("#login-error-alert");
    const errorMsg = targetTarget.querySelector("#login-error-msg");
    
    const submitBtn = targetTarget.querySelector("#submit-btn");
    const submitSpinner = targetTarget.querySelector("#submit-spinner");

    // Toggle de visibilidad de contraseña
    togglePasswordBtn.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      eyeShow.classList.toggle("hidden");
      eyeHide.classList.toggle("hidden");
    });

    // Envío del formulario
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      // Ocultar alerta de error previa
      errorAlert.classList.add("hidden");
      
      // Activar animación de carga
      submitBtn.disabled = true;
      submitSpinner.classList.remove("hidden");
      
      const username = usernameInput.value;
      const password = passwordInput.value;

      // Breve retraso artificial para sensación de seguridad y pulido premium (600ms)
      setTimeout(() => {
        const business = authenticateBusiness(username, password);

        submitBtn.disabled = false;
        submitSpinner.classList.add("hidden");

        if (business) {
          // Guardar estado del negocio autenticado
          appState.currentBusiness = business;
          localStorage.setItem("localrep_auth_business_id", business.id);
          
          // Lanzar callback
          onLoginCallback(business);
        } else {
          // Mostrar alerta de error con vibración sutil
          errorMsg.textContent = "Credenciales incorrectas. Verifica el usuario y la contraseña.";
          errorAlert.classList.remove("hidden");
          
          // Pequeño efecto de shake
          errorAlert.style.animation = "none";
          setTimeout(() => {
            errorAlert.style.animation = "float 3s ease-in-out infinite";
          }, 10);
        }
      }, 600);
    });
  }
}
export default LoginView;
