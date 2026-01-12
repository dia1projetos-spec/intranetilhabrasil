# 🏫 Sistema Colégio Ilha Brasil

Sistema de gerenciamento escolar completo desenvolvido para o Colégio Ilha Brasil.

## 📋 Funcionalidades

### Dashboard do Diretor (Administrador)
- ✅ Login automático (detecta tipo de usuário)
- ✅ Cadastro de Professores (nome, email, senha)
- ✅ Cadastro de Alunos (nome, turma, responsável com credenciais)
- ✅ Gestão de Turmas
- ✅ Visão geral com estatísticas
- ✅ Interface responsiva e moderna

### Tecnologias Utilizadas
- HTML5
- CSS3 (Design System com cores institucionais)
- JavaScript ES6+ (Modules)
- Firebase Authentication
- Firebase Firestore
- Vercel (Deploy)

## 🚀 Como Configurar

### 1. Configurar Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative o **Authentication** com método de login por E-mail/Senha
4. Ative o **Firestore Database** (modo produção ou teste)
5. Copie as credenciais do projeto

### 2. Configurar Credenciais

Edite o arquivo `js/firebase-config.js` e substitua pelas suas credenciais:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJECT_ID.firebaseapp.com",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_PROJECT_ID.appspot.com",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID"
};
```

### 3. Criar Primeiro Diretor

Como o sistema exige que os cadastros sejam feitos pelo diretor, você precisa criar manualmente a primeira conta de diretor:

1. No Firebase Console, vá em **Authentication**
2. Clique em "Add user"
3. Adicione o e-mail e senha do diretor
4. Copie o **User UID** gerado
5. Vá em **Firestore Database**
6. Crie uma collection chamada `diretores`
7. Adicione um documento com o UID copiado e os campos:
   ```
   nome: "Nome do Diretor"
   email: "email@diretor.com"
   dataCadastro: (timestamp atual)
   status: "ativo"
   ```

### 4. Regras de Segurança do Firestore

Configure as regras de segurança no Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Diretores
    match /diretores/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Professores
    match /professores/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/diretores/$(request.auth.uid));
    }
    
    // Alunos
    match /alunos/{alunoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/diretores/$(request.auth.uid));
    }
    
    // Responsáveis
    match /responsaveis/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/diretores/$(request.auth.uid));
    }
    
    // Turmas
    match /turmas/{turmaId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/diretores/$(request.auth.uid));
    }
    
    // Atividades
    match /atividades/{atividadeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## 🌐 Deploy no Vercel

### Via GitHub

1. Faça push do código para seu repositório GitHub
2. Acesse [Vercel](https://vercel.com)
3. Clique em "Import Project"
4. Selecione seu repositório
5. Configure:
   - Framework Preset: Other
   - Build Command: (deixe vazio)
   - Output Directory: ./
6. Clique em "Deploy"

### Configurar Domínio

Depois do deploy, você pode configurar um domínio personalizado nas configurações do projeto no Vercel.

## 📁 Estrutura do Projeto

```
colegio-ilha-brasil/
├── assets/
│   └── images/
│       └── logo.png
├── css/
│   ├── style.css
│   ├── login.css
│   └── dashboard.css
├── js/
│   ├── firebase-config.js
│   ├── login.js
│   └── dashboard-diretor.js
├── index.html
├── dashboard-diretor.html
└── README.md
```

## 🎨 Cores do Projeto

- Verde Primário: `#00753a`
- Verde Secundário: `#28a745`
- Amarelo Primário: `#ffd700`
- Amarelo Secundário: `#ffc107`

## 📱 Tipos de Usuário

1. **Diretor(a)** - Administrador completo
   - Cadastra professores
   - Cadastra alunos
   - Gerencia turmas
   - Acessa todas as funcionalidades

2. **Professor(a)** - Em desenvolvimento
   - Dashboard próprio (próxima fase)

3. **Responsável** - Em desenvolvimento
   - Dashboard próprio (próxima fase)

## 🔒 Segurança

- Autenticação via Firebase Authentication
- Senhas criptografadas
- Validação de tipos de usuário
- Regras de segurança no Firestore
- Proteção de rotas

## 📝 Próximas Funcionalidades

- Dashboard do Professor
- Dashboard do Responsável
- Edição de cadastros
- Sistema de notas
- Frequência
- Comunicados
- Calendário escolar

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique se o Firebase está configurado corretamente
2. Confira as regras de segurança do Firestore
3. Verifique o console do navegador para erros

## 📄 Licença

Sistema desenvolvido exclusivamente para o Colégio Ilha Brasil.

---

Desenvolvido com 💚💛 para o Colégio Ilha Brasil
