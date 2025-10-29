import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Opcional: habilite se precisar de métricas
import { getAuth } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";

// ATENÇÃO: em produção utilize variáveis de ambiente para proteger esta chave de API.
const firebaseConfig = {
  apiKey: "AIzaSyBxo0CPdArA-fjro3jDs-p5ISdpR8zwA-M",
  authDomain: "wt-servicos-app.firebaseapp.com",
  projectId: "wt-servicos-app",
  storageBucket: "wt-servicos-app.appspot.com",
  messagingSenderId: "659868807853",
  appId: "1:659868807853:web:322e102bba5158c2c1cc24",
  measurementId: "G-NPKD1SKNN9",
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((error) => {
    console.warn("Não foi possível habilitar a persistência offline do Firestore:", error);
  });
}

export { auth, db };
