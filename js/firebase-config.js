// Firebase Configuration
// Credenciais do projeto Colégio Ilha Brasil

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyDUJF4Aa_g159ZtEcVaS8JbISlikG5eDHY",
    authDomain: "colegio-ilha-brasil.firebaseapp.com",
    projectId: "colegio-ilha-brasil",
    storageBucket: "colegio-ilha-brasil.firebasestorage.app",
    messagingSenderId: "412452991728",
    appId: "1:412452991728:web:e7891470a7ccb8e7324835"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, firebaseConfig };
