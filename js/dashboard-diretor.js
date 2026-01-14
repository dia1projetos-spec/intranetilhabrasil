// VERSÃO: v1.3.2 - 2026-01-14 - DEBUG COMPLETO: Professores nas Notificações
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
    where,
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
        // Apenas mostrar erro se for realmente um erro (não warnings)
        if (error.code && error.code.startsWith('auth/')) {
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
        } else {
            // Outro tipo de erro - apenas logar sem mostrar ao usuário
            console.warn('Aviso durante cadastro:', error.message);
        }
        
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
        if (error.code && error.code.startsWith('auth/')) {
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
        } else {
            console.warn('Aviso durante cadastro:', error.message);
        }
        
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
        if (error.code && error.code.startsWith('auth/')) {
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
        } else {
            console.warn('Aviso durante cadastro:', error.message);
        }
        
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
        loadTurmas(),
        carregarNotificacoesEnviadas()
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
        const querySnapshot = await getDocs(collection(db, 'alunos'));
        
        alunosTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            alunosTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhum aluno cadastrado</td></tr>';
            return;
        }
        
        // Converter para array e ordenar alfabeticamente
        const alunos = [];
        querySnapshot.forEach((doc) => {
            alunos.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordenar por nome (ordem alfabética)
        alunos.sort((a, b) => a.nome.localeCompare(b.nome));
        
        // Adicionar à tabela
        alunos.forEach((aluno) => {
            const row = document.createElement('tr');
            const dataCadastro = aluno.dataCadastro?.toDate().toLocaleDateString('pt-BR') || 'N/A';
            
            row.innerHTML = `
                <td>${aluno.nome}</td>
                <td>${aluno.turma || 'Sem turma'}</td>
                <td>${aluno.responsavelNome}</td>
                <td>${dataCadastro}</td>
                <td><span class="badge badge-success">Ativo</span></td>
                <td class="table-actions">
                    <button class="btn-info" onclick="editarAluno('${aluno.id}')">Editar</button>
                    <button class="btn-danger" onclick="deletarAluno('${aluno.id}')">Excluir</button>
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
                    <button class="btn-primary" onclick="verAlunosTurma('${doc.id}', '${turma.nome}')">Ver Alunos</button>
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


// ============================================
// LISTA DE ALUNOS (ORDEM ALFABÉTICA)
// ============================================

async function loadListaAlunos() {
    try {
        const alunosSnapshot = await getDocs(collection(db, 'alunos'));
        const listaAlunosTableBody = document.getElementById('listaAlunosTableBody');
        
        if (!listaAlunosTableBody) return;
        
        listaAlunosTableBody.innerHTML = '';
        
        if (alunosSnapshot.empty) {
            listaAlunosTableBody.innerHTML = '<tr><td colspan="4" class="no-data">Nenhum aluno cadastrado</td></tr>';
            return;
        }
        
        // Converter para array e ordenar alfabeticamente
        const alunos = [];
        alunosSnapshot.forEach((doc) => {
            alunos.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordenar por nome
        alunos.sort((a, b) => a.nome.localeCompare(b.nome));
        
        // Adicionar à tabela
        alunos.forEach((aluno) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${aluno.nome}</td>
                <td>${aluno.responsavelNome || 'N/A'}</td>
                <td>${aluno.turma || 'Sem turma'}</td>
                <td><span class="badge badge-success">Ativo</span></td>
            `;
            listaAlunosTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar lista de alunos:', error);
    }
}


// Ver alunos de uma turma
window.verAlunosTurma = async function(turmaId, turmaNome) {
    try {
        // Buscar alunos da turma
        const alunosSnapshot = await getDocs(collection(db, 'alunos'));
        const alunosDaTurma = [];
        
        alunosSnapshot.forEach((doc) => {
            const aluno = doc.data();
            if (aluno.turma === turmaNome) {
                alunosDaTurma.push(aluno.nome);
            }
        });
        
        // Ordenar alfabeticamente
        alunosDaTurma.sort((a, b) => a.localeCompare(b));
        
        // Buscar professor responsável (se houver)
        // Por enquanto não temos essa funcionalidade, então vamos deixar como "Não atribuído"
        const professorResponsavel = 'Não atribuído';
        
        // Montar mensagem
        let mensagem = `TURMA: ${turmaNome}\n\n`;
        mensagem += `Professor Responsável: ${professorResponsavel}\n\n`;
        mensagem += `ALUNOS (${alunosDaTurma.length}):\n`;
        
        if (alunosDaTurma.length === 0) {
            mensagem += '- Nenhum aluno cadastrado nesta turma';
        } else {
            alunosDaTurma.forEach((nome, index) => {
                mensagem += `${index + 1}. ${nome}\n`;
            });
        }
        
        alert(mensagem);
        
    } catch (error) {
        console.error('Erro ao buscar alunos da turma:', error);
        alert('Erro ao carregar alunos da turma');
    }
};


// ============================================
// SISTEMA DE NOTIFICAÇÕES
// ============================================

const notifDestinatarios = document.getElementById('notifDestinatarios');
const notifProfessor = document.getElementById('notifProfessor');
const professorSelectGroup = document.getElementById('professorSelectGroup');
const btnEnviarNotificacao = document.getElementById('btnEnviarNotificacao');
const notifMensagem = document.getElementById('notifMensagem');

// Debug: verificar se elementos existem
console.log('🔍 Verificando elementos de notificação:');
console.log('notifDestinatarios:', notifDestinatarios ? '✅' : '❌');
console.log('notifProfessor:', notifProfessor ? '✅' : '❌');
console.log('professorSelectGroup:', professorSelectGroup ? '✅' : '❌');

// Mostrar/ocultar select de professor
if (notifDestinatarios) {
    notifDestinatarios.addEventListener('change', async (e) => {
        console.log('📝 Tipo selecionado:', e.target.value);
        if (e.target.value === 'individual') {
            professorSelectGroup.style.display = 'block';
            console.log('🔄 Carregando professores...');
            await carregarProfessoresNotif();
        } else {
            professorSelectGroup.style.display = 'none';
        }
    });
} else {
    console.error('❌ Select de destinatários não encontrado!');
}

// Carregar professores no select
async function carregarProfessoresNotif() {
    console.log('🔍 Iniciando carregamento de professores...');
    
    if (!notifProfessor) {
        console.error('❌ Select de professor não encontrado!');
        alert('ERRO: Select de professor não encontrado no HTML!');
        return;
    }
    
    try {
        notifProfessor.innerHTML = '<option value="">Carregando professores...</option>';
        
        console.log('📡 Buscando professores no Firestore...');
        const professoresSnapshot = await getDocs(collection(db, 'professores'));
        
        console.log('✅ Total de professores encontrados:', professoresSnapshot.size);
        
        notifProfessor.innerHTML = '<option value="">Selecione o professor...</option>';
        
        if (professoresSnapshot.empty) {
            console.warn('⚠️ Nenhum professor cadastrado!');
            notifProfessor.innerHTML = '<option value="">Nenhum professor cadastrado</option>';
            alert('Nenhum professor encontrado! Cadastre um professor primeiro.');
            return;
        }
        
        let count = 0;
        professoresSnapshot.forEach((doc) => {
            const professor = doc.data();
            console.log(`👨‍🏫 Professor ${count + 1}:`, professor.nome, '(ID:', doc.id, ')');
            
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = professor.nome;
            notifProfessor.appendChild(option);
            count++;
        });
        
        console.log(`✅ ${count} professores adicionados ao select!`);
        alert(`✅ ${count} professores carregados com sucesso!`);
        
    } catch (error) {
        console.error('❌ ERRO ao carregar professores:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Mensagem:', error.message);
        
        notifProfessor.innerHTML = '<option value="">ERRO ao carregar</option>';
        
        alert('❌ ERRO ao carregar professores!\n\n' + 
              'Código: ' + error.code + '\n' +
              'Mensagem: ' + error.message + '\n\n' +
              'Verifique as regras do Firestore!');
    }
}

// Enviar notificação
if (btnEnviarNotificacao) {
    btnEnviarNotificacao.addEventListener('click', async () => {
        const tipo = notifDestinatarios.value;
        const mensagem = notifMensagem.value.trim();
        
        if (!tipo) {
            alert('Selecione os destinatários');
            return;
        }
        
        if (!mensagem) {
            alert('Digite a mensagem da notificação');
            return;
        }
        
        if (tipo === 'individual' && !notifProfessor.value) {
            alert('Selecione um professor');
            return;
        }
        
        try {
            btnEnviarNotificacao.disabled = true;
            btnEnviarNotificacao.textContent = 'Enviando...';
            
            const notificacao = {
                tipo: tipo,
                mensagem: mensagem,
                remetenteId: auth.currentUser.uid,
                dataEnvio: serverTimestamp(),
                lida: false
            };
            
            if (tipo === 'individual') {
                notificacao.destinatarioId = notifProfessor.value;
                // Pegar nome do professor
                const profDoc = await getDoc(doc(db, 'professores', notifProfessor.value));
                notificacao.destinatarioNome = profDoc.data().nome;
            } else {
                notificacao.destinatarioNome = 'Todos os Professores';
            }
            
            // Salvar no Firestore
            await addDoc(collection(db, 'notificacoes'), notificacao);
            
            alert('✅ Notificação enviada com sucesso!');
            
            // Limpar campos
            notifDestinatarios.value = '';
            notifMensagem.value = '';
            professorSelectGroup.style.display = 'none';
            
            // Recarregar lista de notificações
            await carregarNotificacoesEnviadas();
            
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            alert('Erro ao enviar notificação');
        } finally {
            btnEnviarNotificacao.disabled = false;
            btnEnviarNotificacao.textContent = '📤 Enviar Notificação';
        }
    });
}

// Carregar notificações enviadas
async function carregarNotificacoesEnviadas() {
    try {
        const q = query(
            collection(db, 'notificacoes'),
            where('remetenteId', '==', auth.currentUser.uid),
            orderBy('dataEnvio', 'desc')
        );
        
        const notificacoesSnapshot = await getDocs(q);
        const notificacoesLista = document.getElementById('notificacoesLista');
        
        if (!notificacoesLista) return;
        
        notificacoesLista.innerHTML = '';
        
        if (notificacoesSnapshot.empty) {
            notificacoesLista.innerHTML = '<p class="no-data">Nenhuma notificação enviada</p>';
            return;
        }
        
        notificacoesSnapshot.forEach((doc) => {
            const notif = doc.data();
            const div = document.createElement('div');
            div.className = 'notificacao-item';
            
            const data = notif.dataEnvio?.toDate().toLocaleString('pt-BR') || 'Agora';
            
            div.innerHTML = `
                <div class="notif-header">
                    <strong>Para: ${notif.destinatarioNome}</strong>
                    <span class="notif-data">${data}</span>
                </div>
                <div class="notif-mensagem">${notif.mensagem}</div>
            `;
            
            notificacoesLista.appendChild(div);
        });
        
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
    }
}


// ============================================
// SISTEMA DE CALENDÁRIO
// ============================================

// Feriados Nacionais do Brasil (fixos e móveis calculados)
const feriadosBrasil = {
    "2025": [
        { data: "2025-01-01", nome: "Ano Novo" },
        { data: "2025-03-04", nome: "Carnaval" },
        { data: "2025-04-18", nome: "Sexta-feira Santa" },
        { data: "2025-04-21", nome: "Tiradentes" },
        { data: "2025-05-01", nome: "Dia do Trabalho" },
        { data: "2025-06-19", nome: "Corpus Christi" },
        { data: "2025-09-07", nome: "Independência" },
        { data: "2025-10-12", nome: "Nossa Senhora Aparecida" },
        { data: "2025-11-02", nome: "Finados" },
        { data: "2025-11-15", nome: "Proclamação da República" },
        { data: "2025-12-25", nome: "Natal" }
    ],
    "2026": [
        { data: "2026-01-01", nome: "Ano Novo" },
        { data: "2026-02-17", nome: "Carnaval" },
        { data: "2026-04-03", nome: "Sexta-feira Santa" },
        { data: "2026-04-21", nome: "Tiradentes" },
        { data: "2026-05-01", nome: "Dia do Trabalho" },
        { data: "2026-06-04", nome: "Corpus Christi" },
        { data: "2026-09-07", nome: "Independência" },
        { data: "2026-10-12", nome: "Nossa Senhora Aparecida" },
        { data: "2026-11-02", nome: "Finados" },
        { data: "2026-11-15", nome: "Proclamação da República" },
        { data: "2026-12-25", nome: "Natal" }
    ],
    "2027": [
        { data: "2027-01-01", nome: "Ano Novo" },
        { data: "2027-02-09", nome: "Carnaval" },
        { data: "2027-03-26", nome: "Sexta-feira Santa" },
        { data: "2027-04-21", nome: "Tiradentes" },
        { data: "2027-05-01", nome: "Dia do Trabalho" },
        { data: "2027-05-27", nome: "Corpus Christi" },
        { data: "2027-09-07", nome: "Independência" },
        { data: "2027-10-12", nome: "Nossa Senhora Aparecida" },
        { data: "2027-11-02", nome: "Finados" },
        { data: "2027-11-15", nome: "Proclamação da República" },
        { data: "2027-12-25", nome: "Natal" }
    ]
};

let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let diaSelecionado = null;

const btnMesAnterior = document.getElementById('btnMesAnterior');
const btnProximoMes = document.getElementById('btnProximoMes');
const calendarioTitulo = document.getElementById('calendarioTitulo');
const calendarioDias = document.getElementById('calendarioDias');
const modalEvento = document.getElementById('modalEvento');
const formEvento = document.getElementById('formEvento');

// Navegação
if (btnMesAnterior) btnMesAnterior.addEventListener('click', () => {
    mesAtual--;
    if (mesAtual < 0) {
        mesAtual = 11;
        anoAtual--;
    }
    renderizarCalendario();
});

if (btnProximoMes) btnProximoMes.addEventListener('click', () => {
    mesAtual++;
    if (mesAtual > 11) {
        mesAtual = 0;
        anoAtual++;
    }
    renderizarCalendario();
});

// Renderizar calendário
function renderizarCalendario() {
    if (!calendarioDias || !calendarioTitulo) return;
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    calendarioTitulo.textContent = `${meses[mesAtual]} ${anoAtual}`;
    
    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const diasMesAnterior = new Date(anoAtual, mesAtual, 0).getDate();
    
    calendarioDias.innerHTML = '';
    
    // Dias do mês anterior
    for (let i = primeiroDia - 1; i >= 0; i--) {
        const dia = document.createElement('div');
        dia.className = 'dia outro-mes';
        dia.innerHTML = `<span class="dia-numero">${diasMesAnterior - i}</span>`;
        calendarioDias.appendChild(dia);
    }
    
    // Dias do mês atual
    const hoje = new Date();
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const diaElement = document.createElement('div');
        diaElement.className = 'dia';
        
        const dataCompleta = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        // Verificar se é hoje
        if (dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear()) {
            diaElement.classList.add('hoje');
        }
        
        // Verificar se é feriado
        const feriado = verificarFeriado(dataCompleta);
        if (feriado) {
            diaElement.classList.add('feriado');
            diaElement.title = feriado.nome;
        }
        
        diaElement.innerHTML = `<span class="dia-numero">${dia}</span>`;
        
        // Click abre modal para criar compromisso (apenas dias do mês atual)
        diaElement.addEventListener('click', function(e) {
            e.stopPropagation();
            diaSelecionado = dataCompleta;
            const eventoDataInput = document.getElementById('eventoData');
            if (eventoDataInput) {
                eventoDataInput.value = dataCompleta;
            }
            const modal = document.getElementById('modalEvento');
            if (modal) {
                openModal(modal);
            } else {
                console.error('Modal de evento não encontrado!');
            }
        });
        
        // Carregar e mostrar compromissos do dia
        carregarCompromissosDia(dataCompleta, diaElement);
        
        calendarioDias.appendChild(diaElement);
    }
    
    // Completar com dias do próximo mês
    const totalDias = calendarioDias.children.length;
    const diasFaltantes = 42 - totalDias; // 6 semanas
    for (let dia = 1; dia <= diasFaltantes; dia++) {
        const diaElement = document.createElement('div');
        diaElement.className = 'dia outro-mes';
        diaElement.innerHTML = `<span class="dia-numero">${dia}</span>`;
        calendarioDias.appendChild(diaElement);
    }
}

// Verificar se data é feriado
function verificarFeriado(data) {
    const ano = data.split('-')[0];
    if (!feriadosBrasil[ano]) return null;
    return feriadosBrasil[ano].find(f => f.data === data);
}

// Carregar compromissos e mostrar dentro do dia
async function carregarCompromissosDia(data, diaElement) {
    try {
        const q = query(
            collection(db, 'eventos'),
            where('data', '==', data)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const compromissosDiv = document.createElement('div');
            compromissosDiv.className = 'dia-compromissos';
            
            let count = 0;
            snapshot.forEach((doc) => {
                if (count < 2) { // Mostrar no máximo 2 compromissos
                    const evento = doc.data();
                    const eventoDiv = document.createElement('div');
                    eventoDiv.className = 'mini-evento';
                    eventoDiv.innerHTML = `
                        <span class="mini-evento-icon">📌</span>
                        <span class="mini-evento-titulo">${evento.titulo}</span>
                    `;
                    eventoDiv.onclick = (e) => {
                        e.stopPropagation();
                        mostrarDetalhesEvento(doc.id, evento);
                    };
                    compromissosDiv.appendChild(eventoDiv);
                }
                count++;
            });
            
            if (count > 2) {
                const maisDiv = document.createElement('div');
                maisDiv.className = 'mini-evento-mais';
                maisDiv.textContent = `+${count - 2} mais`;
                compromissosDiv.appendChild(maisDiv);
            }
            
            diaElement.appendChild(compromissosDiv);
        }
    } catch (error) {
        console.error('Erro ao carregar compromissos:', error);
    }
}

// Mostrar detalhes do evento
function mostrarDetalhesEvento(eventoId, evento) {
    const detalhes = `
COMPROMISSO:
${evento.titulo}

${evento.hora ? 'Horário: ' + evento.hora : ''}
${evento.descricao ? '\n' + evento.descricao : ''}

Deseja excluir este compromisso?
    `;
    
    if (confirm(detalhes)) {
        excluirEvento(eventoId);
    }
}

// Mostrar eventos do dia
async function mostrarEventosDia(data) {
    diaSelecionado = data;
    const eventosDiaTitulo = document.getElementById('eventosDiaTitulo');
    const eventosLista = document.getElementById('eventosLista');
    
    if (!eventosDiaTitulo || !eventosLista) return;
    
    const dataObj = new Date(data + 'T00:00:00');
    eventosDiaTitulo.textContent = dataObj.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    eventosLista.innerHTML = '<p class="no-data">Carregando...</p>';
    
    const eventos = [];
    
    // Adicionar feriado se houver
    const feriado = verificarFeriado(data);
    if (feriado) {
        eventos.push({
            tipo: 'feriado',
            titulo: feriado.nome,
            descricao: 'Feriado Nacional'
        });
    }
    
    // Buscar compromissos
    try {
        const q = query(
            collection(db, 'eventos'),
            where('data', '==', data)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            eventos.push({
                id: doc.id,
                tipo: 'compromisso',
                ...doc.data()
            });
        });
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
    
    if (eventos.length === 0) {
        eventosLista.innerHTML = '<p class="no-data">Nenhum evento neste dia</p>';
        return;
    }
    
    eventosLista.innerHTML = '';
    eventos.forEach(evento => {
        const div = document.createElement('div');
        div.className = 'evento-item';
        div.innerHTML = `
            <span class="evento-tipo ${evento.tipo}">${evento.tipo === 'feriado' ? '🎉 Feriado' : '📌 Compromisso'}</span>
            <div class="evento-titulo">${evento.titulo}</div>
            ${evento.hora ? `<div class="evento-hora">⏰ ${evento.hora}</div>` : ''}
            ${evento.descricao ? `<div class="evento-descricao">${evento.descricao}</div>` : ''}
            ${evento.tipo === 'compromisso' ? `
                <div class="evento-actions">
                    <button class="btn-danger" onclick="excluirEvento('${evento.id}')">Excluir</button>
                </div>
            ` : ''}
        `;
        eventosLista.appendChild(div);
    });
}

// Criar evento
if (formEvento) {
    formEvento.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const titulo = document.getElementById('eventoTitulo').value.trim();
        const data = document.getElementById('eventoData').value;
        const hora = document.getElementById('eventoHora').value;
        const descricao = document.getElementById('eventoDescricao').value.trim();
        
        try {
            await addDoc(collection(db, 'eventos'), {
                titulo,
                data,
                hora: hora || null,
                descricao: descricao || '',
                criadoPor: auth.currentUser.uid,
                dataCriacao: serverTimestamp()
            });
            
            alert('✅ Compromisso criado com sucesso!');
            formEvento.reset();
            closeModal(modalEvento);
            renderizarCalendario();
            if (diaSelecionado) mostrarEventosDia(diaSelecionado);
            
        } catch (error) {
            console.error('Erro ao criar evento:', error);
            alert('Erro ao criar compromisso');
        }
    });
}

// Excluir evento
window.excluirEvento = async function(eventoId) {
    if (!confirm('Deseja excluir este compromisso?')) return;
    
    try {
        await deleteDoc(doc(db, 'eventos', eventoId));
        alert('Compromisso excluído!');
        renderizarCalendario();
        if (diaSelecionado) mostrarEventosDia(diaSelecionado);
    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir compromisso');
    }
};

// Inicializar calendário quando carregar a seção
const calendarioSection = document.getElementById('calendario');
if (calendarioSection) {
    renderizarCalendario();
}

