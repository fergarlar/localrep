// Componente de Gráficos SVG Interactivos Premium para LocalRep
import { getReviews, getPublicClicks } from "../database.js";

export class AnalyticsChart {
  /**
   * Genera y monta un gráfico SVG interactivo de alta calidad en un contenedor.
   * @param {string} containerId ID del elemento contenedor HTML
   * @param {string} businessId ID del negocio actual
   */
  static render(containerId, businessId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Obtener y preparar datos históricos de los últimos 7 días
    const today = new Date();
    const daysData = [];
    const reviews = getReviews(businessId);
    const publicClicks = getPublicClicks(businessId);

    const weekdayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      // Filtrar reseñas y clics en este día específico
      const dayReviews = reviews.filter(r => {
        const date = new Date(r.created_at);
        return date >= d && date <= dayEnd;
      });

      const dayClicks = publicClicks.filter(c => {
        const date = new Date(c.created_at);
        return date >= d && date <= dayEnd;
      });

      daysData.push({
        date: d,
        label: weekdayNames[d.getDay()],
        dateStr: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        blockedAlerts: dayReviews.length,
        publicClicks: dayClicks.length
      });
    }

    // 2. Determinar escala Y máxima
    const maxVal = Math.max(
      ...daysData.map(d => Math.max(d.blockedAlerts, d.publicClicks)),
      5 // Valor mínimo de escala para evitar un gráfico plano
    );
    const yMax = Math.ceil(maxVal / 5) * 5; // Redondear al siguiente múltiplo de 5

    // 3. Definir dimensiones del SVG
    const width = 600;
    const height = 240;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Calcular puntos de coordenadas
    const pointsPublic = [];
    const pointsBlocked = [];

    daysData.forEach((day, index) => {
      const x = paddingLeft + (index / 6) * chartWidth;
      
      // Mapear valor Y (0 en Y es el tope del SVG, por lo que restamos de chartHeight)
      const yPub = paddingTop + chartHeight - (day.publicClicks / yMax) * chartHeight;
      const yBlk = paddingTop + chartHeight - (day.blockedAlerts / yMax) * chartHeight;

      pointsPublic.push({ x, y: yPub, val: day.publicClicks });
      pointsBlocked.push({ x, y: yBlk, val: day.blockedAlerts });
    });

    // 4. Crear el marcado del SVG
    let svgContent = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Degradado sutil para reseñas públicas (Charcoal) -->
          <linearGradient id="grad-public" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1c1917" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#1c1917" stop-opacity="0.0" />
          </linearGradient>
          <!-- Degradado sutil para alertas detenidas (Stone-gray) -->
          <linearGradient id="grad-blocked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a8a29e" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#a8a29e" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Líneas de cuadrícula horizontal -->
        ${[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = paddingTop + ratio * chartHeight;
          const valLabel = Math.round(yMax * (1 - ratio));
          return `
            <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#e7e5e4" stroke-width="1" stroke-dasharray="3,3" />
            <text x="${paddingLeft - 10}" y="${y + 4}" font-size="10" font-family="var(--font-sans)" fill="#78716c" text-anchor="end">${valLabel}</text>
          `;
        }).join("")}

        <!-- Área y línea de Alertas Detenidas (1-3 estrellas - Gris Piedra) -->
        <path d="M ${pointsBlocked[0].x} ${paddingTop + chartHeight} 
                 ${pointsBlocked.map(p => `L ${p.x} ${p.y}`).join(" ")} 
                 L ${pointsBlocked[pointsBlocked.length - 1].x} ${paddingTop + chartHeight} Z" 
              fill="url(#grad-blocked)" />
        <path d="${pointsBlocked.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ")}" 
              fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Área y línea de Reseñas Públicas Impulsadas (4-5 estrellas - Carbón Oscuro) -->
        <path d="M ${pointsPublic[0].x} ${paddingTop + chartHeight} 
                 ${pointsPublic.map(p => `L ${p.x} ${p.y}`).join(" ")} 
                 L ${pointsPublic[pointsPublic.length - 1].x} ${paddingTop + chartHeight} Z" 
              fill="url(#grad-public)" />
        <path d="${pointsPublic.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ")}" 
              fill="none" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Etiquetas de texto en el eje X -->
        ${daysData.map((day, idx) => {
          const x = paddingLeft + (idx / 6) * chartWidth;
          return `
            <text x="${x}" y="${height - 8}" font-size="10" font-family="var(--font-sans)" font-weight="500" fill="#78716c" text-anchor="middle">${day.label}</text>
          `;
        }).join("")}

        <!-- Nodos de datos interactivos -->
        ${daysData.map((_, idx) => {
          const pub = pointsPublic[idx];
          const blk = pointsBlocked[idx];
          return `
            <!-- Nodos Públicos -->
            <circle cx="${pub.x}" cy="${pub.y}" r="4" fill="#ffffff" stroke="#1c1917" stroke-width="2" class="transition-all duration-200" id="node-pub-${idx}" />
            <!-- Nodos Críticos -->
            <circle cx="${blk.x}" cy="${blk.y}" r="3.5" fill="#ffffff" stroke="#a8a29e" stroke-width="2" class="transition-all duration-200" id="node-blk-${idx}" />
          `;
        }).join("")}

        <!-- Zonas Calientes Invisibles para Hover (Facilita interacción táctil/ratón) -->
        ${daysData.map((day, idx) => {
          const x = paddingLeft + (idx / 6) * chartWidth - (chartWidth / 12);
          const colWidth = chartWidth / 6;
          return `
            <rect x="${x}" y="${paddingTop}" width="${colWidth}" height="${chartHeight}" 
                  fill="transparent" class="cursor-pointer" 
                  data-index="${idx}" />
          `;
        }).join("")}
      </svg>

      <!-- Contenedor del Tooltip Dinámico -->
      <div id="chart-tooltip" class="absolute pointer-events-none bg-stone-900 text-stone-100 text-xs px-3 py-2.5 rounded-lg shadow-xl border border-stone-850 opacity-0 transition-opacity duration-200 flex flex-col gap-1 z-30 min-w-[150px]">
      </div>
    `;

    // Asignar el contenido al contenedor
    container.className = "relative w-full h-[240px]";
    container.innerHTML = svgContent;

    // 5. Configurar lógica interactiva del Tooltip
    const tooltip = container.querySelector("#chart-tooltip");
    const hoverRegions = container.querySelectorAll("rect");

    hoverRegions.forEach(rect => {
      rect.addEventListener("mouseenter", (e) => {
        const idx = parseInt(rect.getAttribute("data-index"));
        const day = daysData[idx];
        const pub = pointsPublic[idx];
        const blk = pointsBlocked[idx];

        // Agrandar círculos activos
        const pubNode = container.querySelector(`#node-pub-${idx}`);
        const blkNode = container.querySelector(`#node-blk-${idx}`);
        if (pubNode) pubNode.setAttribute("r", "6");
        if (blkNode) blkNode.setAttribute("r", "5.5");

        // Rellenar y posicionar Tooltip
        tooltip.innerHTML = `
          <span class="font-bold text-[10px] uppercase text-stone-400 font-heading">${day.dateStr}</span>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-2 h-2 rounded-full bg-stone-950 border border-stone-800"></span>
            <span class="font-medium text-stone-200">Impulsadas: <strong>${day.publicClicks}</strong></span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-stone-450 border border-stone-300"></span>
            <span class="font-medium text-stone-300">Detenidas: <strong>${day.blockedAlerts}</strong></span>
          </div>
        `;

        // Calcular posición del tooltip
        const containerRect = container.getBoundingClientRect();
        // Centrar tooltip sobre el hotspot
        const tooltipX = pub.x - (150 / 2); 
        const tooltipY = Math.min(pub.y, blk.y) - 65; // Colocar arriba del punto más alto

        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
        tooltip.style.opacity = "1";
      });

      rect.addEventListener("mouseleave", (e) => {
        const idx = parseInt(rect.getAttribute("data-index"));
        
        // Restaurar tamaños de los círculos
        const pubNode = container.querySelector(`#node-pub-${idx}`);
        const blkNode = container.querySelector(`#node-blk-${idx}`);
        if (pubNode) pubNode.setAttribute("r", "4");
        if (blkNode) blkNode.setAttribute("r", "3.5");

        // Ocultar Tooltip
        tooltip.style.opacity = "0";
      });
    });
  }
}
export default AnalyticsChart;
