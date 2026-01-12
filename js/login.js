import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    sendPasswordResetEmail 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const btnLogin = document.getElementById('btnLogin');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const forgotPasswordLink = document.getElementById('forgotPassword');

// Função para mostrar erro
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Função para mostrar/ocultar loader
function setLoading(loading) {
    if (loading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        btnLogin.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        btnLogin.disabled = false;
    }
}

// Função para detectar tipo de usuário
async function detectUserType(uid) {
    // Verificar se é diretor
    const diretorDoc = await getDoc(doc(db, 'diretores', uid));
    if (diretorDoc.exists()) {
        return { type: 'diretor', data: diretorDoc.data(), redirect: 'dashboard-diretor.html' };
    }
    
    // Verificar se é professor
    const professorDoc = await getDoc(doc(db, 'professores', uid));
    if (professorDoc.exists()) {
        return { type: 'professor', data: professorDoc.data(), redirect: 'dashboard-professor.html' };
    }
    
    // Verificar se é responsável
    const responsavelDoc = await getDoc(doc(db, 'responsaveis', uid));
    if (responsavelDoc.exists()) {
        return { type: 'responsavel', data: responsavelDoc.data(), redirect: 'dashboard-responsavel.html' };
    }
    
    return null;
}

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validações
    if (!email || !password) {
        showError('Por favor, preencha todos os campos.');
        return;
    }
    
    setLoading(true);
    
    try {
        // Autenticar com Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Detectar tipo de usuário
        const userInfo = await detectUserType(user.uid);
        
        if (!userInfo) {
            // Usuário não encontrado em nenhuma coleção
            await auth.signOut();
            throw new Error('Usuário não cadastrado no sistema. Entre em contato com a administração.');
        }
        
        // Salvar informações no localStorage
        localStorage.setItem('userType', userInfo.type);
        localStorage.setItem('userName', userInfo.data.nome);
        localStorage.setItem('userEmail', userInfo.data.email);
        
        // Redirecionar para dashboard apropriado
        window.location.href = userInfo.redirect;
        
    } catch (error) {
        console.error('Erro no login:', error);
        
        let errorMsg = 'Erro ao fazer login. Tente novamente.';
        
        switch(error.code) {
            case 'auth/invalid-email':
                errorMsg = 'E-mail inválido.';
                break;
            case 'auth/user-disabled':
                errorMsg = 'Usuário desabilitado. Entre em contato com a administração.';
                break;
            case 'auth/user-not-found':
                errorMsg = 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                errorMsg = 'Senha incorreta.';
                break;
            case 'auth/invalid-credential':
                errorMsg = 'E-mail ou senha incorretos.';
                break;
            case 'auth/too-many-requests':
                errorMsg = 'Muitas tentativas. Tente novamente mais tarde.';
                break;
            default:
                if (error.message) {
                    errorMsg = error.message;
                }
        }
        
        showError(errorMsg);
        setLoading(false);
    }
});

// Handle Forgot Password
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showError('Por favor, digite seu e-mail no campo acima.');
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        showError('Erro ao enviar e-mail de recuperação.');
    }
});

// Verificar se já está logado
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userInfo = await detectUserType(user.uid);
        if (userInfo) {
            window.location.href = userInfo.redirect;
        }
    }
});
