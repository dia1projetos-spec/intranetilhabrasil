// VERSÃO: 2026-01-13 23:45 - ARQUIVO CORRIGIDO
import { auth, db, firebaseConfig } from './firebase-config.js';
import { 
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp,
    getDoc,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Elementos do DOM
const userName = document.getElementById('userName');
const currentDate = document.getElementById('currentDate');
const btnLogout = document.getElementById('btnLogout');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');

// Modais
const modalDiretor = document.getElementById('modalDiretor');
const modalProfessor = document.getElementById('modalProfessor');
const modalAluno = document.getElementById('modalAluno');
const modalTurma = document.getElementById('modalTurma');

// Botões
const btnAddDiretor = document.getElementById('btnAddDiretor');
const btnAddProfessor = document.getElementById('btnAddProfessor');
const btnAddAluno = document.getElementById('btnAddAluno');
const btnAddTurma = document.getElementById('btnAddTurma');

// Forms
const formDiretor = document.getElementById('formDiretor');
const formProfessor = document.getElementById('formProfessor');
const formAluno = document.getElementById('formAluno');
const formTurma = document.getElementById('formTurma');

// Tabelas
const diretoresTableBody = document.getElementById('diretoresTableBody');
const professoresTableBody = document.getElementById('professoresTableBody');
const alunosTableBody = document.getElementById('alunosTableBody');
const turmasGrid = document.getElementById('turmasGrid');

// Stats
const totalDiretores = document.getElementById('totalDiretores');
const totalProfessores = document.getElementById('totalProfessores');
const totalAlunos = document.getElementById('totalAlunos');
const totalTurmas = document.getElementById('totalTurmas');

// Verificar autenticação
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const userType = localStorage.getItem('userType');
    if (userType !== 'diretor') {
        window.location.href = 'index.html';
        return;
    }
    
    // Carregar nome do usuário
    const userDoc = await getDoc(doc(db, 'diretores', user.uid));
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

// Modal Controls
function openModal(modal) {
    modal.classList.add('show');
}

function closeModal(modal) {
    modal.classList.remove('show');
}

// Fechar modais ao clicar fora
[modalDiretor, modalProfessor, modalAluno, modalTurma].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// Botões de fechar modal
document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = btn.dataset.modal;
        if (modalId) {
            closeModal(document.getElementById(modalId));
        }
    });
});

// Abrir modais
btnAddDiretor.addEventListener('click', () => openModal(modalDiretor));
btnAddProfessor.addEventListener('click', () => openModal(modalProfessor));
btnAddAluno.addEventListener('click', () => openModal(modalAluno));
btnAddTurma.addEventListener('click', () => openModal(modalTurma));

// Cadastrar Diretor
formDiretor.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('diretorNome').value.trim();
    const email = document.getElementById('diretorEmail').value.trim();
    const senha = document.getElementById('diretorSenha').value;
    const telefone = document.getElementById('diretorTelefone').value.trim();
    const errorDiv = document.getElementById('diretorError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorDiv.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cadastrando...';
    
    try {
        // Criar uma segunda instância do Firebase com nome único
        const appName = `Secondary_${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);
        
        // Criar conta no Firebase Auth usando a instância secundária
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
        const uid = userCredential.user.uid;
        
        // Salvar dados no Firestore (usando a instância principal)
        await setDoc(doc(db, 'diretores', uid), {
            nome: nome,
            email: email,
            telefone: telefone || '',
            dataCadastro: serverTimestamp(),
            status: 'ativo'
        });
        
        // Adicionar atividade
        await addDoc(collection(db, 'atividades'), {
            tipo: 'cadastro_diretor',
            descricao: `Diretor ${nome} foi cadastrado`,
            timestamp: serverTimestamp()
        });
        
        // Deletar a instância secundária
        await secondaryApp.delete();
        
        alert('Diretor cadastrado com sucesso!');
        formDiretor.reset();
        closeModal(modalDiretor);
        
        // Recarregar listas (SEM reload da página)
        await loadDiretores();
        await updateStats();
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar Diretor';
        
    } catch (error) {
        console.error('Erro ao cadastrar diretor:', error);
        let errorMsg = 'Erro ao cadastrar diretor.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = 'Este e-mail já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = 'E-mail inválido.';
        } else if (error.code === 'auth/weak-password') {
            errorMsg = 'A senha deve ter pelo menos 6 caracteres.';
        }
        
        errorDiv.textContent = errorMsg;
        errorDiv.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar Diretor';
    }
});

// Cadastrar Professor
formProfessor.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('professorNome').value.trim();
    const email = document.getElementById('professorEmail').value.trim();
    const senha = document.getElementById('professorSenha').value;
    const telefone = document.getElementById('professorTelefone').value.trim();
    const errorDiv = document.getElementById('professorError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorDiv.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cadastrando...';
    
    try {
        // Criar uma segunda instância do Firebase com nome único
        const appName = `SecondaryProf_${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);
        
        // Criar conta no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
        const uid = userCredential.user.uid;
        
        // Salvar dados no Firestore
        await setDoc(doc(db, 'professores', uid), {
            nome: nome,
            email: email,
            telefone: telefone || '',
            dataCadastro: serverTimestamp(),
            status: 'ativo'
        });
        
        // Adicionar atividade
        await addDoc(collection(db, 'atividades'), {
            tipo: 'cadastro_professor',
            descricao: `Professor ${nome} foi cadastrado`,
            timestamp: serverTimestamp()
        });
        
        // Deletar instância secundária
        await secondaryApp.delete();
        
        alert('Professor cadastrado com sucesso!');
        formProfessor.reset();
        closeModal(modalProfessor);
        
        // Recarregar listas
        await loadProfessores();
        await updateStats();
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar Professor';
        
    } catch (error) {
        console.error('Erro ao cadastrar professor:', error);
        let errorMsg = 'Erro ao cadastrar professor.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = 'Este e-mail já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = 'E-mail inválido.';
        } else if (error.code === 'auth/weak-password') {
            errorMsg = 'A senha deve ter pelo menos 6 caracteres.';
        }
        
        errorDiv.textContent = errorMsg;
        errorDiv.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar Professor';
    }
});

// Cadastrar Aluno
formAluno.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('alunoNome').value.trim();
    const turma = document.getElementById('alunoTurma').value;
    const responsavel = document.getElementById('alunoResponsavel').value.trim();
    const emailResponsavel = document.getElementById('alunoEmailResponsavel').value.trim();
    const senhaResponsavel = document.getElementById('alunoSenhaResponsavel').value;
    const dataNascimento = document.getElementById('alunoDataNascimento').value;
    const errorDiv = document.getElementById('alunoError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorDiv.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cadastrando...';
    
    try {
        // Criar uma segunda instância do Firebase com nome único baseado em timestamp
        const appName = `SecondaryResp_${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);
        
        // Criar conta do responsável no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, emailResponsavel, senhaResponsavel);
        const uidResponsavel = userCredential.user.uid;
        
        // Salvar dados do responsável no Firestore
        await setDoc(doc(db, 'responsaveis', uidResponsavel), {
            nome: responsavel,
            email: emailResponsavel,
            dataCadastro: serverTimestamp(),
            status: 'ativo'
        });
        
        // Salvar dados do aluno no Firestore
        const alunoRef = await addDoc(collection(db, 'alunos'), {
            nome: nome,
            turma: turma,
            responsavelUid: uidResponsavel,
            responsavelNome: responsavel,
            dataNascimento: dataNascimento || '',
            dataCadastro: serverTimestamp(),
            status: 'ativo'
        });
        
        // Vincular aluno ao responsável
        await setDoc(doc(db, 'responsaveis', uidResponsavel), {
            alunoId: alunoRef.id,
            alunoNome: nome
        }, { merge: true });
        
        // Adicionar atividade
        await addDoc(collection(db, 'atividades'), {
            tipo: 'cadastro_aluno',
            descricao: `Aluno ${nome} foi cadastrado`,
            timestamp: serverTimestamp()
        });
        
        // Deletar instância secundária
        await secondaryApp.delete();
        
        alert('Aluno cadastrado com sucesso!');
        formAluno.reset();
        closeModal(modalAluno);
        
        // Recarregar listas
        await loadAlunos();
        await updateStats();
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar Aluno';
        
    } catch (error) {
        console.error('Erro ao cadastrar aluno:', error);
        let errorMsg = 'Erro ao cadastrar aluno.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = 'Este e-mail já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = 'E-mail inválido.';
        } else if (error.code === 'auth/weak-password') {
            errorMsg = 'A senha deve ter pelo menos 6 caracteres.';
        }
        
        errorDiv.textContent = errorMsg;
        errorDiv.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar Aluno';
    }
});

// Criar Turma
formTurma.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('turmaNome').value.trim();
    const ano = document.getElementById('turmaAno').value;
    const periodo = document.getElementById('turmaPeriodo').value;
    const capacidade = document.getElementById('turmaCapacidade').value;
    const errorDiv = document.getElementById('turmaError');
    
    errorDiv.classList.remove('show');
    
    try {
        await addDoc(collection(db, 'turmas'), {
            nome: nome,
            ano: parseInt(ano),
            periodo: periodo,
            capacidade: parseInt(capacidade) || 30,
            totalAlunos: 0,
            dataCriacao: serverTimestamp(),
            status: 'ativa'
        });
        
        // Adicionar atividade
        await addDoc(collection(db, 'atividades'), {
            tipo: 'criacao_turma',
            descricao: `Turma ${nome} foi criada`,
            timestamp: serverTimestamp()
        });
        
        alert('Turma criada com sucesso!');
        formTurma.reset();
        closeModal(modalTurma);
        loadTurmas();
        
    } catch (error) {
        console.error('Erro ao criar turma:', error);
        errorDiv.textContent = 'Erro ao criar turma.';
        errorDiv.classList.add('show');
    }
});

// Carregar todos os dados
async function loadData() {
    await Promise.all([
        loadDiretores(),
        loadProfessores(),
        loadAlunos(),
        loadTurmas()
    ]);
    updateStats();
}

// Carregar Diretores
async function loadDiretores() {
    try {
        const q = query(collection(db, 'diretores'), orderBy('dataCadastro', 'desc'));
        const querySnapshot = await getDocs(q);
        
        diretoresTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            diretoresTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhum diretor cadastrado</td></tr>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const diretor = doc.data();
            const row = document.createElement('tr');
            
            const dataCadastro = diretor.dataCadastro?.toDate().toLocaleDateString('pt-BR') || 'N/A';
            
            row.innerHTML = `
                <td>${diretor.nome}</td>
                <td>${diretor.email}</td>
                <td>${dataCadastro}</td>
                <td><span class="badge badge-success">Ativo</span></td>
                <td class="table-actions">
                    <button class="btn-info" onclick="editarDiretor('${doc.id}')">Editar</button>
                    <button class="btn-danger" onclick="deletarDiretor('${doc.id}')">Excluir</button>
                </td>
            `;
            
            diretoresTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar diretores:', error);
    }
}

// Carregar Professores
async function loadProfessores() {
    try {
        const q = query(collection(db, 'professores'), orderBy('dataCadastro', 'desc'));
        const querySnapshot = await getDocs(q);
        
        professoresTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            professoresTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhum professor cadastrado</td></tr>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const professor = doc.data();
            const row = document.createElement('tr');
            
            const dataCadastro = professor.dataCadastro?.toDate().toLocaleDateString('pt-BR') || 'N/A';
            
            row.innerHTML = `
                <td>${professor.nome}</td>
                <td>${professor.email}</td>
                <td>${dataCadastro}</td>
                <td><span class="badge badge-success">Ativo</span></td>
                <td class="table-actions">
                    <button class="btn-info" onclick="editarProfessor('${doc.id}')">Editar</button>
                    <button class="btn-danger" onclick="deletarProfessor('${doc.id}')">Excluir</button>
                </td>
            `;
            
            professoresTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar professores:', error);
    }
}

// Carregar Alunos
async function loadAlunos() {
    try {
        const q = query(collection(db, 'alunos'), orderBy('dataCadastro', 'desc'));
        const querySnapshot = await getDocs(q);
        
        alunosTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            alunosTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhum aluno cadastrado</td></tr>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const aluno = doc.data();
            const row = document.createElement('tr');
            
            const dataCadastro = aluno.dataCadastro?.toDate().toLocaleDateString('pt-BR') || 'N/A';
            
            row.innerHTML = `
                <td>${aluno.nome}</td>
                <td>${aluno.turma || 'Sem turma'}</td>
                <td>${aluno.responsavelNome}</td>
                <td>${dataCadastro}</td>
                <td><span class="badge badge-success">Ativo</span></td>
                <td class="table-actions">
                    <button class="btn-info" onclick="editarAluno('${doc.id}')">Editar</button>
                    <button class="btn-danger" onclick="deletarAluno('${doc.id}')">Excluir</button>
                </td>
            `;
            
            alunosTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
    }
}

// Carregar Turmas
async function loadTurmas() {
    try {
        const q = query(collection(db, 'turmas'), orderBy('dataCriacao', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // Atualizar select de turmas no form de aluno
        const alunoTurmaSelect = document.getElementById('alunoTurma');
        alunoTurmaSelect.innerHTML = '<option value="">Selecione a turma...</option>';
        
        turmasGrid.innerHTML = '';
        
        if (querySnapshot.empty) {
            turmasGrid.innerHTML = '<p class="no-data">Nenhuma turma cadastrada</p>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const turma = doc.data();
            
            // Adicionar ao select
            const option = document.createElement('option');
            option.value = turma.nome;
            option.textContent = turma.nome;
            alunoTurmaSelect.appendChild(option);
            
            // Adicionar card
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
                <div class="table-actions">
                    <button class="btn-info" onclick="editarTurma('${doc.id}')">Editar</button>
                    <button class="btn-danger" onclick="deletarTurma('${doc.id}')">Excluir</button>
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
        const diretoresSnapshot = await getDocs(collection(db, 'diretores'));
        const professoresSnapshot = await getDocs(collection(db, 'professores'));
        const alunosSnapshot = await getDocs(collection(db, 'alunos'));
        const turmasSnapshot = await getDocs(collection(db, 'turmas'));
        
        totalDiretores.textContent = diretoresSnapshot.size;
        totalProfessores.textContent = professoresSnapshot.size;
        totalAlunos.textContent = alunosSnapshot.size;
        totalTurmas.textContent = turmasSnapshot.size;
        
    } catch (error) {
        console.error('Erro ao atualizar stats:', error);
    }
}

// Funções globais (chamadas pelos botões inline)
window.deletarDiretor = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este diretor?')) return;
    
    try {
        // Deletar do Firestore
        await deleteDoc(doc(db, 'diretores', id));
        
        // NOTA: Não podemos deletar usuário do Authentication aqui porque
        // apenas o próprio usuário ou Admin SDK pode fazer isso.
        // O usuário continuará no Authentication mas sem acesso ao sistema
        // pois não terá documento no Firestore.
        
        alert('Diretor excluído com sucesso!');
        loadDiretores();
        updateStats();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir diretor.');
    }
};

window.deletarProfessor = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este professor?')) return;
    
    try {
        await deleteDoc(doc(db, 'professores', id));
        alert('Professor excluído com sucesso!');
        loadProfessores();
        updateStats();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir professor.');
    }
};

window.deletarAluno = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    
    try {
        await deleteDoc(doc(db, 'alunos', id));
        alert('Aluno excluído com sucesso!');
        loadAlunos();
        updateStats();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir aluno.');
    }
};

window.deletarTurma = async function(id) {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) return;
    
    try {
        await deleteDoc(doc(db, 'turmas', id));
        alert('Turma excluída com sucesso!');
        loadTurmas();
        updateStats();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir turma.');
    }
};

// ============================================
// FUNÇÕES DE EDIÇÃO
// ============================================

// Editar Diretor
window.editarDiretor = async function(id) {
    try {
        const diretorDoc = await getDoc(doc(db, 'diretores', id));
        if (!diretorDoc.exists()) {
            alert('Diretor não encontrado');
            return;
        }
        
        const diretor = diretorDoc.data();
        
        const nome = prompt('Nome:', diretor.nome);
        if (!nome) return;
        
        const telefone = prompt('Telefone:', diretor.telefone || '');
        
        await updateDoc(doc(db, 'diretores', id), {
            nome: nome,
            telefone: telefone || ''
        });
        
        alert('Diretor atualizado com sucesso!');
        loadDiretores();
        
    } catch (error) {
        console.error('Erro ao editar:', error);
        alert('Erro ao editar diretor.');
    }
};

// Editar Professor
window.editarProfessor = async function(id) {
    try {
        const professorDoc = await getDoc(doc(db, 'professores', id));
        if (!professorDoc.exists()) {
            alert('Professor não encontrado');
            return;
        }
        
        const professor = professorDoc.data();
        
        const nome = prompt('Nome:', professor.nome);
        if (!nome) return;
        
        const telefone = prompt('Telefone:', professor.telefone || '');
        
        await updateDoc(doc(db, 'professores', id), {
            nome: nome,
            telefone: telefone || ''
        });
        
        alert('Professor atualizado com sucesso!');
        loadProfessores();
        
    } catch (error) {
        console.error('Erro ao editar:', error);
        alert('Erro ao editar professor.');
    }
};

// Editar Aluno
window.editarAluno = async function(id) {
    try {
        const alunoDoc = await getDoc(doc(db, 'alunos', id));
        if (!alunoDoc.exists()) {
            alert('Aluno não encontrado');
            return;
        }
        
        const aluno = alunoDoc.data();
        
        const nome = prompt('Nome do Aluno:', aluno.nome);
        if (!nome) return;
        
        const dataNascimento = prompt('Data de Nascimento (YYYY-MM-DD):', aluno.dataNascimento || '');
        
        await updateDoc(doc(db, 'alunos', id), {
            nome: nome,
            dataNascimento: dataNascimento || ''
        });
        
        alert('Aluno atualizado com sucesso!');
        loadAlunos();
        
    } catch (error) {
        console.error('Erro ao editar:', error);
        alert('Erro ao editar aluno.');
    }
};

// Editar Turma
window.editarTurma = async function(id) {
    try {
        const turmaDoc = await getDoc(doc(db, 'turmas', id));
        if (!turmaDoc.exists()) {
            alert('Turma não encontrada');
            return;
        }
        
        const turma = turmaDoc.data();
        
        const nome = prompt('Nome da Turma:', turma.nome);
        if (!nome) return;
        
        const periodo = prompt('Período:', turma.periodo || '');
        const capacidade = prompt('Capacidade:', turma.capacidade || '30');
        
        await updateDoc(doc(db, 'turmas', id), {
            nome: nome,
            periodo: periodo || '',
            capacidade: parseInt(capacidade) || 30
        });
        
        alert('Turma atualizada com sucesso!');
        loadTurmas();
        
    } catch (error) {
        console.error('Erro ao editar:', error);
        alert('Erro ao editar turma.');
    }
};

