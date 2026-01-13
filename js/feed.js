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
    updateDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot,
    limit,
    where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Criar novo post
export async function criarPost(texto, imagemFile = null) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se é diretor ou professor
        const userType = localStorage.getItem('userType');
        if (userType !== 'diretor' && userType !== 'professor') {
            throw new Error('Apenas diretores e professores podem postar');
        }
        
        // Pegar dados do usuário
        const userDoc = await getDoc(doc(db, `${userType}s`, user.uid));
        if (!userDoc.exists()) throw new Error('Usuário não encontrado');
        
        const userData = userDoc.data();
        
        // Upload da imagem se houver
        let imagemUrl = null;
        if (imagemFile) {
            const storage = getStorage();
            const imagemRef = ref(storage, `posts/${Date.now()}_${imagemFile.name}`);
            await uploadBytes(imagemRef, imagemFile);
            imagemUrl = await getDownloadURL(imagemRef);
        }
        
        // Criar post
        const postData = {
            texto: texto,
            imagemUrl: imagemUrl,
            autorId: user.uid,
            autorNome: userData.nome,
            autorTipo: userType,
            curtidas: [],
            comentarios: [],
            dataCriacao: serverTimestamp()
        };
        
        await addDoc(collection(db, 'posts'), postData);
        
        return { success: true };
        
    } catch (error) {
        console.error('Erro ao criar post:', error);
        throw error;
    }
}

// Carregar feed
export async function carregarFeed(limitePosts = 20) {
    try {
        const q = query(
            collection(db, 'posts'),
            orderBy('dataCriacao', 'desc'),
            limit(limitePosts)
        );
        
        const querySnapshot = await getDocs(q);
        const posts = [];
        
        querySnapshot.forEach((doc) => {
            posts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return posts;
        
    } catch (error) {
        console.error('Erro ao carregar feed:', error);
        throw error;
    }
}

// Curtir/Descurtir post
export async function toggleCurtida(postId) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);
        
        if (!postDoc.exists()) throw new Error('Post não encontrado');
        
        const curtidas = postDoc.data().curtidas || [];
        const jaCurtiu = curtidas.includes(user.uid);
        
        if (jaCurtiu) {
            // Remover curtida
            await updateDoc(postRef, {
                curtidas: arrayRemove(user.uid)
            });
        } else {
            // Adicionar curtida
            await updateDoc(postRef, {
                curtidas: arrayUnion(user.uid)
            });
        }
        
        return { curtiu: !jaCurtiu };
        
    } catch (error) {
        console.error('Erro ao curtir post:', error);
        throw error;
    }
}

// Comentar no post
export async function comentarPost(postId, textoComentario) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        const userType = localStorage.getItem('userType');
        const userDoc = await getDoc(doc(db, `${userType}s`, user.uid));
        if (!userDoc.exists()) throw new Error('Usuário não encontrado');
        
        const userData = userDoc.data();
        
        const comentario = {
            id: Date.now().toString(),
            autorId: user.uid,
            autorNome: userData.nome,
            autorTipo: userType,
            texto: textoComentario,
            data: new Date().toISOString()
        };
        
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            comentarios: arrayUnion(comentario)
        });
        
        return comentario;
        
    } catch (error) {
        console.error('Erro ao comentar:', error);
        throw error;
    }
}

// Escutar atualizações do feed em tempo real
export function escutarFeed(callback) {
    const q = query(
        collection(db, 'posts'),
        orderBy('dataCriacao', 'desc'),
        limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
        const posts = [];
        snapshot.forEach((doc) => {
            posts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(posts);
    });
}
