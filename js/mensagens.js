import { auth, db } from './firebase-config.js';
import { 
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot,
    where,
    or,
    and,
    setDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Criar ou buscar conversa
export async function iniciarConversa(destinatarioId, destinatarioTipo) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Criar ID único para a conversa (sempre na mesma ordem)
        const ids = [user.uid, destinatarioId].sort();
        const conversaId = `${ids[0]}_${ids[1]}`;
        
        const conversaRef = doc(db, 'conversas', conversaId);
        const conversaDoc = await getDoc(conversaRef);
        
        if (!conversaDoc.exists()) {
            // Criar nova conversa
            const userType = localStorage.getItem('userType');
            const userDoc = await getDoc(doc(db, `${userType}s`, user.uid));
            const destinatarioDoc = await getDoc(doc(db, `${destinatarioTipo}s`, destinatarioId));
            
            if (!userDoc.exists() || !destinatarioDoc.exists()) {
                throw new Error('Usuário não encontrado');
            }
            
            await setDoc(conversaRef, {
                participantes: [user.uid, destinatarioId],
                participantesInfo: {
                    [user.uid]: {
                        nome: userDoc.data().nome,
                        tipo: userType
                    },
                    [destinatarioId]: {
                        nome: destinatarioDoc.data().nome,
                        tipo: destinatarioTipo
                    }
                },
                ultimaMensagem: '',
                ultimaAtualizacao: serverTimestamp(),
                dataCriacao: serverTimestamp()
            });
        }
        
        return conversaId;
        
    } catch (error) {
        console.error('Erro ao iniciar conversa:', error);
        throw error;
    }
}

// Enviar mensagem
export async function enviarMensagem(conversaId, texto) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        const userType = localStorage.getItem('userType');
        const userDoc = await getDoc(doc(db, `${userType}s`, user.uid));
        
        if (!userDoc.exists()) throw new Error('Usuário não encontrado');
        
        // Adicionar mensagem
        await addDoc(collection(db, 'conversas', conversaId, 'mensagens'), {
            remetenteId: user.uid,
            remetenteNome: userDoc.data().nome,
            texto: texto,
            lida: false,
            dataEnvio: serverTimestamp()
        });
        
        // Atualizar última mensagem da conversa
        await updateDoc(doc(db, 'conversas', conversaId), {
            ultimaMensagem: texto.substring(0, 50),
            ultimaAtualizacao: serverTimestamp()
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
    }
}

// Carregar conversas do usuário
export async function carregarConversas() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        const q = query(
            collection(db, 'conversas'),
            where('participantes', 'array-contains', user.uid),
            orderBy('ultimaAtualizacao', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const conversas = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Pegar info do outro participante
            const outroParticipante = data.participantes.find(id => id !== user.uid);
            const outroParticipanteInfo = data.participantesInfo[outroParticipante];
            
            conversas.push({
                id: doc.id,
                outroParticipante: outroParticipanteInfo,
                ultimaMensagem: data.ultimaMensagem,
                ultimaAtualizacao: data.ultimaAtualizacao,
                ...data
            });
        });
        
        return conversas;
        
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        throw error;
    }
}

// Carregar mensagens de uma conversa
export async function carregarMensagens(conversaId) {
    try {
        const q = query(
            collection(db, 'conversas', conversaId, 'mensagens'),
            orderBy('dataEnvio', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const mensagens = [];
        
        querySnapshot.forEach((doc) => {
            mensagens.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return mensagens;
        
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        throw error;
    }
}

// Escutar mensagens em tempo real
export function escutarMensagens(conversaId, callback) {
    const q = query(
        collection(db, 'conversas', conversaId, 'mensagens'),
        orderBy('dataEnvio', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const mensagens = [];
        snapshot.forEach((doc) => {
            mensagens.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(mensagens);
    });
}

// Escutar conversas em tempo real
export function escutarConversas(callback) {
    const user = auth.currentUser;
    if (!user) return null;
    
    const q = query(
        collection(db, 'conversas'),
        where('participantes', 'array-contains', user.uid),
        orderBy('ultimaAtualizacao', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const conversas = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const outroParticipante = data.participantes.find(id => id !== user.uid);
            const outroParticipanteInfo = data.participantesInfo[outroParticipante];
            
            conversas.push({
                id: doc.id,
                outroParticipante: outroParticipanteInfo,
                ultimaMensagem: data.ultimaMensagem,
                ultimaAtualizacao: data.ultimaAtualizacao,
                ...data
            });
        });
        callback(conversas);
    });
}

// Listar todos os usuários (para diretor escolher com quem conversar)
export async function listarUsuarios() {
    try {
        const usuarios = [];
        
        // Carregar diretores
        const diretoresSnapshot = await getDocs(collection(db, 'diretores'));
        diretoresSnapshot.forEach((doc) => {
            usuarios.push({
                id: doc.id,
                nome: doc.data().nome,
                email: doc.data().email,
                tipo: 'diretor'
            });
        });
        
        // Carregar professores
        const professoresSnapshot = await getDocs(collection(db, 'professores'));
        professoresSnapshot.forEach((doc) => {
            usuarios.push({
                id: doc.id,
                nome: doc.data().nome,
                email: doc.data().email,
                tipo: 'professor'
            });
        });
        
        // Carregar responsáveis
        const responsaveisSnapshot = await getDocs(collection(db, 'responsaveis'));
        responsaveisSnapshot.forEach((doc) => {
            usuarios.push({
                id: doc.id,
                nome: doc.data().nome,
                email: doc.data().email,
                tipo: 'responsavel'
            });
        });
        
        return usuarios;
        
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        throw error;
    }
}
