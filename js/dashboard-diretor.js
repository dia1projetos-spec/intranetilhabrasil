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
        // Criar uma segunda instância do Firebase para não deslogar o usuário atual
        const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
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
        // Criar uma segunda instância do Firebase
        const secondaryApp = initializeApp(firebaseConfig, 'SecondaryProf');
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
        // Criar uma segunda instância do Firebase
        const secondaryApp = initializeApp(firebaseConfig, 'SecondaryResp');
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
window.editarDiretor = function(id) {
    alert('Funcionalidade de edição em desenvolvimento');
};

window.deletarDiretor = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este diretor?')) return;
    
    try {
        await deleteDoc(doc(db, 'diretores', id));
        alert('Diretor excluído com sucesso!');
        loadDiretores();
        updateStats();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir diretor.');
    }
};

window.editarProfessor = function(id) {
    alert('Funcionalidade de edição em desenvolvimento');
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

window.editarAluno = function(id) {
    alert('Funcionalidade de edição em desenvolvimento');
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

window.editarTurma = function(id) {
    alert('Funcionalidade de edição em desenvolvimento');
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
// SISTEMA DE FEED E MENSAGENS
// ============================================

import { criarPost, carregarFeed, toggleCurtida, comentarPost, escutarFeed } from './feed.js';
import { 
    iniciarConversa, 
    enviarMensagem, 
    carregarConversas, 
    carregarMensagens,
    escutarMensagens,
    escutarConversas,
    listarUsuarios 
} from './mensagens.js';

// Modais de Feed e Mensagens
const modalPost = document.getElementById('modalPost');
const modalNovaConversa = document.getElementById('modalNovaConversa');
const btnAddPost = document.getElementById('btnAddPost');
const btnNovaConversa = document.getElementById('btnNovaConversa');
const formPost = document.getElementById('formPost');

// Variáveis globais
let conversaAtual = null;
let unsubscribeMensagens = null;

// Abrir modal de post
if (btnAddPost) {
    btnAddPost.addEventListener('click', () => openModal(modalPost));
}

// Abrir modal de nova conversa
if (btnNovaConversa) {
    btnNovaConversa.addEventListener('click', async () => {
        openModal(modalNovaConversa);
        await carregarUsuariosParaConversa();
    });
}

// Preview de imagem
const postImagemInput = document.getElementById('postImagem');
if (postImagemInput) {
    postImagemInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('imagemPreview').style.display = 'block';
                document.getElementById('imagemPreviewImg').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Criar post
if (formPost) {
    formPost.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const texto = document.getElementById('postTexto').value.trim();
        const imagemFile = document.getElementById('postImagem').files[0];
        const errorDiv = document.getElementById('postError');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!texto) {
            errorDiv.textContent = 'Digite algo para publicar!';
            errorDiv.classList.add('show');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publicando...';
        errorDiv.classList.remove('show');
        
        try {
            await criarPost(texto, imagemFile);
            
            alert('Publicação criada com sucesso!');
            formPost.reset();
            document.getElementById('imagemPreview').style.display = 'none';
            closeModal(modalPost);
            
            // Recarregar feed
            await loadFeed();
            
        } catch (error) {
            console.error('Erro ao criar post:', error);
            errorDiv.textContent = 'Erro ao criar publicação. Tente novamente.';
            errorDiv.classList.add('show');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publicar';
        }
    });
}

// Carregar Feed
async function loadFeed() {
    try {
        const feedContainer = document.getElementById('feedContainer');
        if (!feedContainer) return;
        
        feedContainer.innerHTML = '<p class="no-data">Carregando feed...</p>';
        
        const posts = await carregarFeed();
        
        if (posts.length === 0) {
            feedContainer.innerHTML = '<p class="no-data">Nenhuma publicação ainda. Seja o primeiro a postar!</p>';
            return;
        }
        
        feedContainer.innerHTML = '';
        
        posts.forEach(post => {
            feedContainer.appendChild(criarPostCard(post));
        });
        
    } catch (error) {
        console.error('Erro ao carregar feed:', error);
        const feedContainer = document.getElementById('feedContainer');
        if (feedContainer) {
            feedContainer.innerHTML = '<p class="no-data">Erro ao carregar feed.</p>';
        }
    }
}

// Criar card de post
function criarPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    
    const iniciaisAutor = post.autorNome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const jacu rtiu = post.curtidas && post.curtidas.includes(auth.currentUser?.uid);
    const totalCurtidas = post.curtidas ? post.curtidas.length : 0;
    const totalComentarios = post.comentarios ? post.comentarios.length : 0;
    
    let dataPost = 'Agora';
    if (post.dataCriacao) {
        const data = post.dataCriacao.toDate ? post.dataCriacao.toDate() : new Date(post.dataCriacao);
        dataPost = formatarData(data);
    }
    
    card.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${iniciaisAutor}</div>
            <div class="post-info">
                <h4>${post.autorNome}</h4>
                <span>${dataPost}</span>
            </div>
        </div>
        <div class="post-content">
            ${post.texto}
        </div>
        ${post.imagemUrl ? `<img src="${post.imagemUrl}" class="post-image" alt="Imagem do post">` : ''}
        <div class="post-actions">
            <button class="post-action-btn ${jaCurtiu ? 'liked' : ''}" onclick="handleCurtir('${post.id}')">
                ❤️ <span id="curtidas-${post.id}">${totalCurtidas}</span>
            </button>
            <button class="post-action-btn" onclick="toggleComentarios('${post.id}')">
                💬 ${totalComentarios}
            </button>
        </div>
        <div id="comentarios-${post.id}" class="comentarios-section" style="display: none;">
            <div class="comentarios-list" id="comentarios-list-${post.id}">
                ${renderizarComentarios(post.comentarios || [])}
            </div>
            <div class="comentario-form">
                <input type="text" placeholder="Escreva um comentário..." id="input-comentario-${post.id}">
                <button class="btn-primary" onclick="handleComentar('${post.id}')">Enviar</button>
            </div>
        </div>
    `;
    
    return card;
}

// Renderizar comentários
function renderizarComentarios(comentarios) {
    if (!comentarios || comentarios.length === 0) {
        return '<p class="no-data">Nenhum comentário ainda</p>';
    }
    
    return comentarios.map(c => `
        <div class="comentario-item">
            <strong>${c.autorNome}:</strong> ${c.texto}
        </div>
    `).join('');
}

// Formatar data
function formatarData(data) {
    const agora = new Date();
    const diff = agora - data;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    return data.toLocaleDateString('pt-BR');
}

// Handle curtir
window.handleCurtir = async function(postId) {
    try {
        const result = await toggleCurtida(postId);
        await loadFeed(); // Recarregar feed para atualizar curtidas
    } catch (error) {
        console.error('Erro ao curtir:', error);
        alert('Erro ao curtir publicação.');
    }
};

// Toggle comentários
window.toggleComentarios = function(postId) {
    const comentariosDiv = document.getElementById(`comentarios-${postId}`);
    if (comentariosDiv.style.display === 'none') {
        comentariosDiv.style.display = 'block';
    } else {
        comentariosDiv.style.display = 'none';
    }
};

// Handle comentar
window.handleComentar = async function(postId) {
    const inputComentario = document.getElementById(`input-comentario-${postId}`);
    const texto = inputComentario.value.trim();
    
    if (!texto) return;
    
    try {
        await comentarPost(postId, texto);
        inputComentario.value = '';
        await loadFeed(); // Recarregar feed
    } catch (error) {
        console.error('Erro ao comentar:', error);
        alert('Erro ao enviar comentário.');
    }
};

// ============================================
// SISTEMA DE MENSAGENS
// ============================================

// Carregar usuários para nova conversa
async function carregarUsuariosParaConversa() {
    try {
        const usuariosList = document.getElementById('usuariosList');
        usuariosList.innerHTML = '<p class="no-data">Carregando...</p>';
        
        const usuarios = await listarUsuarios();
        const currentUserId = auth.currentUser.uid;
        
        // Filtrar usuário atual
        const usuariosFiltrados = usuarios.filter(u => u.id !== currentUserId);
        
        if (usuariosFiltrados.length === 0) {
            usuariosList.innerHTML = '<p class="no-data">Nenhum usuário disponível</p>';
            return;
        }
        
        usuariosList.innerHTML = '';
        
        usuariosFiltrados.forEach(usuario => {
            const item = document.createElement('div');
            item.className = 'usuario-item';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                    <div>
                        <strong>${usuario.nome}</strong>
                        <p style="margin: 0; font-size: 12px; color: var(--text-light);">${usuario.tipo}</p>
                    </div>
                    <button class="btn-primary" onclick="iniciarNovaConversa('${usuario.id}', '${usuario.tipo}')">Conversar</button>
                </div>
            `;
            usuariosList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

// Iniciar nova conversa
window.iniciarNovaConversa = async function(destinatarioId, destinatarioTipo) {
    try {
        const conversaId = await iniciarConversa(destinatarioId, destinatarioTipo);
        closeModal(modalNovaConversa);
        
        // Carregar conversa
        await loadConversas();
        abrirConversa(conversaId);
        
        // Mudar para aba de mensagens
        document.querySelector('[data-section="mensagens"]').click();
        
    } catch (error) {
        console.error('Erro ao iniciar conversa:', error);
        alert('Erro ao iniciar conversa.');
    }
};

// Carregar conversas
async function loadConversas() {
    try {
        const conversasList = document.getElementById('conversasList');
        if (!conversasList) return;
        
        const conversas = await carregarConversas();
        
        if (conversas.length === 0) {
            conversasList.innerHTML = '<p class="no-data">Nenhuma conversa</p>';
            return;
        }
        
        conversasList.innerHTML = '';
        
        conversas.forEach(conversa => {
            const item = document.createElement('div');
            item.className = 'conversa-item';
            item.innerHTML = `
                <h4>${conversa.outroParticipante.nome}</h4>
                <p>${conversa.ultimaMensagem || 'Sem mensagens'}</p>
            `;
            item.onclick = () => abrirConversa(conversa.id);
            conversasList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
    }
}

// Abrir conversa
async function abrirConversa(conversaId) {
    conversaAtual = conversaId;
    
    // Desinscrever do listener anterior
    if (unsubscribeMensagens) {
        unsubscribeMensagens();
    }
    
    // Mostrar input de mensagem
    document.getElementById('chatInput').style.display = 'flex';
    
    // Escutar mensagens em tempo real
    unsubscribeMensagens = escutarMensagens(conversaId, (mensagens) => {
        renderizarMensagens(mensagens);
    });
}

// Renderizar mensagens
function renderizarMensagens(mensagens) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    if (mensagens.length === 0) {
        chatMessages.innerHTML = '<p class="no-data">Nenhuma mensagem ainda. Envie a primeira!</p>';
        return;
    }
    
    chatMessages.innerHTML = '';
    const currentUserId = auth.currentUser.uid;
    
    mensagens.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message-item ${msg.remetenteId === currentUserId ? 'sent' : 'received'}`;
        
        let dataMsg = '';
        if (msg.dataEnvio) {
            const data = msg.dataEnvio.toDate ? msg.dataEnvio.toDate() : new Date(msg.dataEnvio);
            dataMsg = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        
        div.innerHTML = `
            <p>${msg.texto}</p>
            <span class="message-time">${dataMsg}</span>
        `;
        chatMessages.appendChild(div);
    });
    
    // Scroll para última mensagem
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enviar mensagem
const btnSendMessage = document.getElementById('btnSendMessage');
const messageInput = document.getElementById('messageInput');

if (btnSendMessage) {
    btnSendMessage.addEventListener('click', async () => {
        await enviarMensagemAtual();
    });
}

if (messageInput) {
    messageInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await enviarMensagemAtual();
        }
    });
}

async function enviarMensagemAtual() {
    if (!conversaAtual) return;
    
    const texto = messageInput.value.trim();
    if (!texto) return;
    
    try {
        await enviarMensagem(conversaAtual, texto);
        messageInput.value = '';
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem.');
    }
}

// Inicializar Feed e Mensagens quando carregar dados
const loadDataOriginal = loadData;
loadData = async function() {
    await loadDataOriginal();
    await loadFeed();
    await loadConversas();
    
    // Escutar conversas em tempo real
    escutarConversas((conversas) => {
        // Atualizar lista sem recarregar tudo
        const conversasList = document.getElementById('conversasList');
        if (conversasList && conversas.length > 0) {
            // Atualizar apenas se necessário
        }
    });
};

