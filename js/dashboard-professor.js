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
const totalAlunos = document.getElementById('totalAlunos');
const totalTurmas = document.getElementById('totalTurmas');
const totalAulas = document.getElementById('totalAulas');
const totalMensagens = document.getElementById('totalMensagens');

// Verificar autenticação
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const userType = localStorage.getItem('userType');
    if (userType !== 'professor') {
        window.location.href = 'index.html';
        return;
    }
    
    // Carregar nome do usuário
    const userDoc = await getDoc(doc(db, 'professores', user.uid));
    if (userDoc.exists()) {
        userName.textContent = userDoc.data().nome;
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

// Carregar dados
async function loadData() {
    await Promise.all([
        loadAlunos(),
        loadTurmas(),
        updateStats()
    ]);
}

// Carregar alunos
async function loadAlunos() {
    try {
        const alunosSnapshot = await getDocs(collection(db, 'alunos'));
        const alunosTableBody = document.getElementById('alunosTableBody');
        
        alunosTableBody.innerHTML = '';
        
        if (alunosSnapshot.empty) {
            alunosTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhum aluno cadastrado</td></tr>';
            return;
        }
        
        alunosSnapshot.forEach((doc) => {
            const aluno = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${aluno.nome}</td>
                <td>${aluno.turma || 'Sem turma'}</td>
                <td>${aluno.responsavelNome}</td>
                <td><span class="badge badge-success">Ativo</span></td>
                <td class="table-actions">
                    <button class="btn-info" onclick="verDetalhes('${doc.id}')">Ver Detalhes</button>
                </td>
            `;
            
            alunosTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
    }
}

// Carregar turmas
async function loadTurmas() {
    try {
        const turmasSnapshot = await getDocs(collection(db, 'turmas'));
        const turmasGrid = document.getElementById('turmasGrid');
        
        turmasGrid.innerHTML = '';
        
        if (turmasSnapshot.empty) {
            turmasGrid.innerHTML = '<p class="no-data">Nenhuma turma cadastrada</p>';
            return;
        }
        
        turmasSnapshot.forEach((doc) => {
            const turma = doc.data();
            
            const card = document.createElement('div');
            card.className = 'turma-card';
            card.innerHTML = `
                <h3>${turma.nome}</h3>
                <div class="turma-info">
                    <div class="turma-info-item">
                        <span class="label">Ano:</span>
                        <span class="value">${turma.ano}</span>
                    </div>
                    <div class="turma-info-item">
                        <span class="label">Período:</span>
                        <span class="value">${turma.periodo}</span>
                    </div>
                    <div class="turma-info-item">
                        <span class="label">Alunos:</span>
                        <span class="value">${turma.totalAlunos || 0}/${turma.capacidade}</span>
                    </div>
                </div>
            `;
            
            turmasGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Erro ao carregar turmas:', error);
    }
}

// Atualizar estatísticas
async function updateStats() {
    try {
        const alunosSnapshot = await getDocs(collection(db, 'alunos'));
        const turmasSnapshot = await getDocs(collection(db, 'turmas'));
        
        totalAlunos.textContent = alunosSnapshot.size;
        totalTurmas.textContent = turmasSnapshot.size;
        totalAulas.textContent = '0';
        totalMensagens.textContent = '0';
        
    } catch (error) {
        console.error('Erro ao atualizar stats:', error);
    }
}

// Função global
window.verDetalhes = function(id) {
    alert('Funcionalidade de detalhes em desenvolvimento');
};

console.log('Dashboard do Professor carregado!');
