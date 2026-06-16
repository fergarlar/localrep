// Base de Datos local y en la nube (Dual Mode: localStorage / Firebase Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, where, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const DB_VERSION = "1.1.0";

// ============================================================================
// CONFIGURACIÓN DE TU BASE DE DATOS EN LA NUBE (FIREBASE FIRESTORE)
// ============================================================================
// Cuando crees tu base de datos gratuita en Firebase Console, copia y pega
// tu objeto de configuración "firebaseConfig" aquí. 
// Mientras este objeto esté vacío, la app usará automáticamente localStorage
// para que el demo funcione sin necesidad de configurar nada.
const firebaseConfig = {
  apiKey: "AIzaSyB3rlKL2v1iVsnR8MOqF0-UOQlSWPkHUU4",
  authDomain: "stella-localrep.firebaseapp.com",
  projectId: "stella-localrep",
  storageBucket: "stella-localrep.firebasestorage.app",
  messagingSenderId: "25619536920",
  appId: "1:25619536920:web:0a4e1d584cb25980c2f76d"
};

// Inicialización de Firebase
let db = null;
let useFirebase = false;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    useFirebase = true;
    console.log("🔥 Conectado con éxito a la base de datos Cloud Firestore en la nube.");
  } catch (error) {
    console.error("❌ Error al inicializar Firebase:", error);
  }
} else {
  console.log("ℹ️ Usando almacenamiento local (localStorage). Configura firebaseConfig en database.js para pasar a producción.");
}

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
    google_maps_url: "https://maps.app.goo.gl/hXfR9DqFf3F5jX3T7", 
    logo_url: "", 
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
  
  const clients = [
    { name: "Sofía Martínez", phone: "+34 612 345 678", comment: "El capuchino tardó más de 15 minutos en llegar y estaba casi frío. El servicio de mesa estuvo algo distraído hoy." },
    { name: "Alejandro Gómez", phone: "+34 699 888 777", comment: "La tarta de queso de frutos rojos estaba demasiado congelada en el centro. El sabor era rico, pero la textura no." },
    { name: "Mateo Rodríguez", phone: "+34 633 444 555", comment: "La música de fondo estaba extremadamente alta adentro, apenas podíamos hablar. Le pedimos que la bajaran pero no hicieron caso." },
    { name: "Lucía Fernández", phone: "+34 677 123 456", comment: "El cruasán de mantequilla tenía un sabor un poco rancio. Ojalá los horneen frescos cada mañana." },
    { name: "Diego López", phone: "+34 688 222 333", comment: "Servicio muy lento para cobrar. Estuve esperando casi 10 minutos con la tarjeta en la mano y el camarero hablando con otra persona." }
  ];

  ["stellaensenada", "cafe-del-sol"].forEach(bId => {
    clients.forEach((client, i) => {
      const reviewDate = new Date();
      reviewDate.setDate(today.getDate() - (i + 1));
      
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
        rating: Math.floor(Math.random() * 2) + 1, 
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

const getSeedPublicClicks = () => {
  const clicks = [];
  const today = new Date();
  const distribution = [8, 12, 6, 14, 10, 15, 9]; 
  
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

// Obtener todos los negocios (Configuración estática para logins instantáneos)
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
export const saveWebhookUrl = async (businessId, url) => {
  if (useFirebase) {
    try {
      const docRef = doc(db, "settings", businessId);
      await setDoc(docRef, { webhook_url: url.trim() }, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving webhook to Firestore:", e);
      return false;
    }
  } else {
    const businesses = getBusinesses();
    const index = businesses.findIndex(b => b.id === businessId);
    if (index !== -1) {
      businesses[index].webhook_url = url.trim();
      localStorage.setItem("localrep_businesses", JSON.stringify(businesses));
      return true;
    }
    return false;
  }
};

// Obtener URL de Webhook para un negocio
export const getWebhookUrl = async (businessId) => {
  if (useFirebase) {
    try {
      const docRef = doc(db, "settings", businessId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().webhook_url || "";
      }
      return "";
    } catch (e) {
      console.error("Error reading webhook from Firestore:", e);
      return "";
    }
  } else {
    const business = getBusiness(businessId);
    return business ? business.webhook_url : "";
  }
};

// Obtener opiniones críticas (1, 2, 3 estrellas) de un negocio
export const getReviews = async (businessId) => {
  if (useFirebase) {
    try {
      const q = query(collection(db, "reviews"), where("business_id", "==", businessId));
      const querySnapshot = await getDocs(q);
      const reviews = [];
      querySnapshot.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() });
      });
      return reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (e) {
      console.error("Error reading reviews from Firestore:", e);
      return [];
    }
  } else {
    initDatabase();
    const allReviews = JSON.parse(localStorage.getItem("localrep_reviews") || "[]");
    return allReviews
      .filter(r => r.business_id === businessId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
};

// Registrar nueva opinión crítica interna (1-3 estrellas)
export const addReview = async (businessId, rating, name, phone, comment) => {
  const newReviewData = {
    business_id: businessId,
    rating: parseInt(rating),
    customer_name: name.trim(),
    customer_phone: phone.trim(),
    comment: comment.trim(),
    status: "Pendiente",
    created_at: new Date().toISOString()
  };

  if (useFirebase) {
    try {
      const docRef = await addDoc(collection(db, "reviews"), newReviewData);
      return { id: docRef.id, ...newReviewData };
    } catch (e) {
      console.error("Error writing review to Firestore:", e);
    }
  }

  initDatabase();
  const allReviews = JSON.parse(localStorage.getItem("localrep_reviews") || "[]");
  const newReview = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...newReviewData
  };
  allReviews.push(newReview);
  localStorage.setItem("localrep_reviews", JSON.stringify(allReviews));
  return newReview;
};

// Obtener clics públicos redirigidos (4-5 estrellas)
export const getPublicClicks = async (businessId) => {
  if (useFirebase) {
    try {
      const q = query(collection(db, "public_clicks"), where("business_id", "==", businessId));
      const querySnapshot = await getDocs(q);
      const clicks = [];
      querySnapshot.forEach((doc) => {
        clicks.push({ id: doc.id, ...doc.data() });
      });
      return clicks;
    } catch (e) {
      console.error("Error reading clicks from Firestore:", e);
      return [];
    }
  } else {
    initDatabase();
    const allClicks = JSON.parse(localStorage.getItem("localrep_public_clicks") || "[]");
    return allClicks.filter(c => c.business_id === businessId);
  }
};

// Registrar redirección pública exitosa (4 o 5 estrellas)
export const addPublicClick = async (businessId, rating) => {
  const newClickData = {
    business_id: businessId,
    rating: parseInt(rating),
    created_at: new Date().toISOString()
  };

  if (useFirebase) {
    try {
      const docRef = await addDoc(collection(db, "public_clicks"), newClickData);
      return { id: docRef.id, ...newClickData };
    } catch (e) {
      console.error("Error writing click to Firestore:", e);
    }
  }

  initDatabase();
  const allClicks = JSON.parse(localStorage.getItem("localrep_public_clicks") || "[]");
  const newClick = {
    id: `clk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...newClickData
  };
  allClicks.push(newClick);
  localStorage.setItem("localrep_public_clicks", JSON.stringify(allClicks));
  return newClick;
};

// Actualizar el estado de una opinión crítica ("Pendiente" -> "Atendido")
export const updateReviewStatus = async (reviewId, newStatus) => {
  if (useFirebase) {
    try {
      const docRef = doc(db, "reviews", reviewId);
      await updateDoc(docRef, { status: newStatus });
      return { id: reviewId, status: newStatus };
    } catch (e) {
      console.error("Error updating review status in Firestore:", e);
      return null;
    }
  } else {
    initDatabase();
    const allReviews = JSON.parse(localStorage.getItem("localrep_reviews") || "[]");
    const index = allReviews.findIndex(r => r.id === reviewId);
    
    if (index !== -1) {
      allReviews[index].status = newStatus;
      localStorage.setItem("localrep_reviews", JSON.stringify(allReviews));
      return allReviews[index];
    }
    return null;
  }
};

// Calcular métricas agregadas en tiempo real para un negocio
export const getMetrics = async (businessId) => {
  const reviews = await getReviews(businessId); 
  const publicClicks = await getPublicClicks(businessId); 
  
  const totalInternalCount = reviews.length;
  const totalPublicCount = publicClicks.length;
  const totalReviewsCount = totalInternalCount + totalPublicCount;
  
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
