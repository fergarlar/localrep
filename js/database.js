// Base de Datos local persistente en localStorage para LocalRep
const DB_VERSION = "1.0.0";

// Estructuras de datos base
const DEFAULT_BUSINESSES = [
  {
    id: "stellaensenada",
    name: "Stella Cucina al Forno",
    google_maps_url: "https://www.google.com/search?sca_esv=46988bc39be06c17&rlz=1C5CHFA_enMX963MX975&sxsrf=ANbL-n5ytEmCfcPQlg2b0nzgXsrPaxZgeA:1780159596490&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOWSMeyrTDZ6OSvuz2ahvt7h-VS3FROSRXUoN6kzcADZgk_bNaqo8YKyJkWu95LIkw15JjThg5pR57W57tsjs4jG2C3FtG3JGtM5FjjsXgdBrldOwfA%3D%3D&q=Stella,+Cucina+Al+Forno+Opiniones&sa=X&ved=2ahUKEwi6tJGju-GUAxWsLEQIHcS9PXcQ0bkNegQINRAH&biw=1440&bih=727&dpr=2",
    logo_url: "", 
    username: "stella",
    password: "stella123",
    webhook_url: ""
  },
  {
    id: "cafe-del-sol",
    name: "Café del Sol",
    google_maps_url: "https://maps.app.goo.gl/hXfR9DqFf3F5jX3T7", // URL de reseñas simulada/real
    logo_url: "", // Usaremos placeholder dinámico premium
    username: "admin",
    password: "admin123",
    webhook_url: ""
  },
  {
    id: "la-parrilla-gourmet",
    name: "La Parrilla Gourmet",
    google_maps_url: "https://maps.app.goo.gl/9GqM7GvR4fJ3V9Y4A",
    logo_url: "",
    username: "parrilla",
    password: "la123parrilla",
    webhook_url: ""
  }
];

// Datos semilla de opiniones para poblar el Dashboard
const getSeedReviews = () => {
  const reviews = [];
  const today = new Date();
  
  // Nombres y teléfonos realistas en español
  const clients = [
    { name: "Sofía Martínez", phone: "+34 612 345 678", comment: "El capuchino tardó más de 15 minutos en llegar y estaba casi frío. El servicio de mesa estuvo algo distraído hoy." },
    { name: "Alejandro Gómez", phone: "+34 699 888 777", comment: "La tarta de queso de frutos rojos estaba demasiado congelada en el centro. El sabor era rico, pero la textura no." },
    { name: "Mateo Rodríguez", phone: "+34 633 444 555", comment: "La música de fondo estaba extremadamente alta adentro, apenas podíamos hablar. Le pedimos que la bajaran pero no hicieron caso." },
    { name: "Lucía Fernández", phone: "+34 677 123 456", comment: "El cruasán de mantequilla tenía un sabor un poco rancio. Ojalá los horneen frescos cada mañana." },
    { name: "Diego López", phone: "+34 688 222 333", comment: "Servicio muy lento para cobrar. Estuve esperando casi 10 minutos con la tarjeta en la mano y el camarero hablando con otra persona." }
  ];

  // Crear reseñas críticas distribuidas para todos los negocios
  ["stellaensenada", "cafe-del-sol"].forEach(bId => {
    clients.forEach((client, i) => {
      const reviewDate = new Date();
      reviewDate.setDate(today.getDate() - (i + 1));
      
      // Personalizar quejas si es el restaurante italiano real Stella
      let customComment = client.comment;
      if (bId === "stellaensenada") {
        customComment = client.comment
          .replace("El capuchino", "La lasaña de carne")
          .replace("La tarta de queso de frutos rojos", "El tiramisú tradicional")
          .replace("El cruasán de mantequilla", "El pan focaccia al horno");
      }

      reviews.push({
        id: `rev-crit-${bId}-${i + 1}`,
        business_id: bId,
        rating: Math.floor(Math.random() * 2) + 1, // 1 o 2 estrellas
        customer_name: client.name,
        customer_phone: client.phone,
        comment: customComment,
        status: i < 2 ? "Atendido" : "Pendiente",
        created_at: reviewDate.toISOString()
      });
    });
  });

  return reviews;
};

// Clics públicos semilla (Reseñas de 4-5 estrellas que fueron redirigidas a Google Maps)
const getSeedPublicClicks = () => {
  const clicks = [];
  const today = new Date();
  const distribution = [8, 12, 6, 14, 10, 15, 9]; // Clics por día (de hoy a 7 días atrás)
  
  ["stellaensenada", "cafe-del-sol"].forEach(bId => {
    distribution.forEach((count, daysAgo) => {
      for (let i = 0; i < count; i++) {
        const clickDate = new Date();
        clickDate.setDate(today.getDate() - daysAgo);
        clickDate.setHours(Math.floor(Math.random() * 12) + 9); 
        clickDate.setMinutes(Math.floor(Math.random() * 60));

        clicks.push({
          id: `clk-${bId}-${daysAgo}-${i}`,
          business_id: bId,
          rating: Math.random() > 0.3 ? 5 : 4,
          created_at: clickDate.toISOString()
        });
      }
    });
  });

  return clicks;
};

// Inicialización de base de datos con migración automática forzada
export const initDatabase = () => {
  if (localStorage.getItem("localrep_db_initialized") !== "stella") {
    localStorage.removeItem("localrep_businesses");
    localStorage.removeItem("localrep_reviews");
    localStorage.removeItem("localrep_public_clicks");

    localStorage.setItem("localrep_businesses", JSON.stringify(DEFAULT_BUSINESSES));
    localStorage.setItem("localrep_reviews", JSON.stringify(getSeedReviews()));
    localStorage.setItem("localrep_public_clicks", JSON.stringify(getSeedPublicClicks()));
    
    localStorage.setItem("localrep_db_initialized", "stella");
    localStorage.setItem("localrep_db_version", DB_VERSION);
    console.log("Base de datos local actualizada con Stella Cucina al Forno.");
  }
};

// --- CONSULTAS Y ESCRITURAS ---

// Obtener todos los negocios
export const getBusinesses = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem("localrep_businesses") || "[]");
};

// Obtener un negocio específico
export const getBusiness = (id) => {
  const businesses = getBusinesses();
  return businesses.find(b => b.id === id) || null;
};

// Autenticar dueño de negocio
export const authenticateBusiness = (username, password) => {
  const businesses = getBusinesses();
  const found = businesses.find(
    b => b.username.toLowerCase() === username.toLowerCase().trim() && b.password === password
  );
  return found || null;
};

// Guardar URL de Webhook para un negocio
export const saveWebhookUrl = (businessId, url) => {
  const businesses = getBusinesses();
  const index = businesses.findIndex(b => b.id === businessId);
  if (index !== -1) {
    businesses[index].webhook_url = url.trim();
    localStorage.setItem("localrep_businesses", JSON.stringify(businesses));
    return true;
  }
  return false;
};

// Obtener URL de Webhook para un negocio
export const getWebhookUrl = (businessId) => {
  const business = getBusiness(businessId);
  return business ? business.webhook_url : "";
};

// Obtener opiniones críticas (1, 2, 3 estrellas) de un negocio
export const getReviews = (businessId) => {
  initDatabase();
  const allReviews = JSON.parse(localStorage.getItem("localrep_reviews") || "[]");
  return allReviews
    .filter(r => r.business_id === businessId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Recientes primero
};

// Registrar nueva opinión crítica interna (1-3 estrellas)
export const addReview = (businessId, rating, name, phone, comment) => {
  initDatabase();
  const allReviews = JSON.parse(localStorage.getItem("localrep_reviews") || "[]");
  
  const newReview = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    business_id: businessId,
    rating: parseInt(rating),
    customer_name: name.trim(),
    customer_phone: phone.trim(),
    comment: comment.trim(),
    status: "Pendiente",
    created_at: new Date().toISOString()
  };

  allReviews.push(newReview);
  localStorage.setItem("localrep_reviews", JSON.stringify(allReviews));
  return newReview;
};

// Obtener clics públicos redirigidos (4-5 estrellas)
export const getPublicClicks = (businessId) => {
  initDatabase();
  const allClicks = JSON.parse(localStorage.getItem("localrep_public_clicks") || "[]");
  return allClicks.filter(c => c.business_id === businessId);
};

// Registrar redirección pública exitosa (4 o 5 estrellas)
export const addPublicClick = (businessId, rating) => {
  initDatabase();
  const allClicks = JSON.parse(localStorage.getItem("localrep_public_clicks") || "[]");

  const newClick = {
    id: `clk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    business_id: businessId,
    rating: parseInt(rating),
    created_at: new Date().toISOString()
  };

  allClicks.push(newClick);
  localStorage.setItem("localrep_public_clicks", JSON.stringify(allClicks));
  return newClick;
};

// Actualizar el estado de una opinión crítica ("Pendiente" -> "Atendido")
export const updateReviewStatus = (reviewId, newStatus) => {
  initDatabase();
  const allReviews = JSON.parse(localStorage.getItem("localrep_reviews") || "[]");
  const index = allReviews.findIndex(r => r.id === reviewId);
  
  if (index !== -1) {
    allReviews[index].status = newStatus;
    localStorage.setItem("localrep_reviews", JSON.stringify(allReviews));
    return allReviews[index];
  }
  return null;
};

// Calcular métricas agregadas en tiempo real para un negocio
export const getMetrics = (businessId) => {
  const reviews = getReviews(businessId); // Críticas de 1-3 estrellas
  const publicClicks = getPublicClicks(businessId); // Clics de 4-5 estrellas
  
  // Total de opiniones registradas de cualquier tipo
  const totalInternalCount = reviews.length;
  const totalPublicCount = publicClicks.length;
  const totalReviewsCount = totalInternalCount + totalPublicCount;
  
  // Promedio ponderado real
  let averageRating = 0;
  if (totalReviewsCount > 0) {
    const sumInternal = reviews.reduce((sum, r) => sum + r.rating, 0);
    const sumPublic = publicClicks.reduce((sum, c) => sum + c.rating, 0);
    averageRating = (sumInternal + sumPublic) / totalReviewsCount;
  } else {
    averageRating = 0.0;
  }

  return {
    averageRating: parseFloat(averageRating.toFixed(1)),
    publicClicksCount: totalPublicCount,
    blockedAlertsCount: totalInternalCount,
    pendingAlertsCount: reviews.filter(r => r.status === "Pendiente").length
  };
};
