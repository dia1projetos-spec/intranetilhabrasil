import { auth, db } from './firebase-config.js';
import { 
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Elementos do DOM
const userName = document.getElementById('userName');
const currentDate = document.getElementById('currentDate');
const btnLogout = document.getElementById('btnLogout');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');

// Stats
const frequencia = document.getElementById('frequencia');
const mediaGeral = document.getElementById('mediaGeral');
const totalDisciplinas = document.getElementById('totalDisciplinas');
const totalMensagens = document.getElementById('totalMensagens');

let alunoData = null;

// Verificar autenticação
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const userType = localStorage.getItem('userType');
    if (userType !== 'responsavel') {
        window.location.href = 'index.html';
        return;
    }
    
    // Carregar nome do usuário e dados do aluno
    const userDoc = await getDoc(doc(db, 'responsaveis', user.uid));
    if (userDoc.exists()) {
        userName.textContent = userDoc.data().nome;
        
        // Carregar dados do aluno
        const alunoId = userDoc.data().alunoId;
        if (alunoId) {
            await loadAlunoData(alunoId);
        }
    }
    
    // Carregar dados
    loadData();
});

// Configurar data atual
const hoje = new Date();
const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
currentDate.textContent = hoje.toLocaleDateString('pt-BR', opcoes);

// Navegação
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos
        navItems.forEach(nav => nav.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        
        // Adicionar active ao clicado
        item.classList.add('active');
        const sectionId = item.dataset.section;
        document.getElementById(sectionId).classList.add('active');
        
        // Atualizar título
        pageTitle.textContent = item.textContent.trim();
    });
});

// Logout
btnLogout.addEventListener('click', async () => {
    try {
        await signOut(auth);
        localStorage.clear();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao sair:', error);
        alert('Erro ao fazer logout.');
    }
});

// Carregar dados do aluno
async function loadAlunoData(alunoId) {
    try {
        const alunoDoc = await getDoc(doc(db, 'alunos', alunoId));
        
        if (alunoDoc.exists()) {
            alunoData = { id: alunoDoc.id, ...alunoDoc.data() };
            
            // Atualizar informações do aluno
            const studentInfo = document.getElementById('studentInfo');
            studentInfo.innerHTML = `
                <div class="student-info-grid">
                    <div class="info-item">
                        <span class="info-label">Nome:</span>
                        <span class="info-value">${alunoData.nome}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Turma:</span>
                        <span class="info-value">${alunoData.turma || 'Não atribuída'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data de Nascimento:</span>
                        <span class="info-value">${alunoData.dataNascimento || 'Não informada'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="badge badge-success">Ativo</span>
                    </div>
                </div>
            `;
            
            // Atualizar seção detalhada do aluno
            const studentDetails = document.getElementById('studentDetails');
            studentDetails.innerHTML = `
                <div class="details-card">
                    <h3>Dados Pessoais</h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <strong>Nome Completo:</strong>
                            <p>${alunoData.nome}</p>
                        </div>
                        <div class="detail-item">
                            <strong>Turma:</strong>
                            <p>${alunoData.turma || 'Não atribuída'}</p>
                        </div>
                        <div class="detail-item">
                            <strong>Data de Nascimento:</strong>
                            <p>${alunoData.dataNascimento || 'Não informada'}</p>
                        </div>
                        <div class="detail-item">
                            <strong>Data de Cadastro:</strong>
                            <p>${alunoData.dataCadastro?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="details-card">
                    <h3>Informações Acadêmicas</h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <strong>Frequência:</strong>
                            <p>100% (Em desenvolvimento)</p>
                        </div>
                        <div class="detail-item">
                            <strong>Média Geral:</strong>
                            <p>0.0 (Em desenvolvimento)</p>
                        </div>
                        <div class="detail-item">
                            <strong>Situação:</strong>
                            <p><span class="badge badge-success">Ativo</span></p>
                        </div>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do aluno:', error);
    }
}

// Carregar dados
async function loadData() {
    updateStats();
}

// Atualizar estatísticas
async function updateStats() {
    try {
        // Por enquanto valores mockados - serão implementados com notas e frequência
        frequencia.textContent = '100%';
        mediaGeral.textContent = '0.0';
        totalDisciplinas.textContent = '0';
        totalMensagens.textContent = '0';
        
        // Atualizar frequência detalhada
        document.getElementById('presencaTotal').textContent = '100%';
        document.getElementById('diasPresentes').textContent = '0';
        document.getElementById('totalDias').textContent = '0';
        document.getElementById('totalFaltas').textContent = '0';
        
    } catch (error) {
        console.error('Erro ao atualizar stats:', error);
    }
}

console.log('Dashboard do Responsável carregado!');
