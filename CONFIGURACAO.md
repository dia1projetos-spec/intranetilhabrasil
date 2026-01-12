# 🔧 GUIA DE CONFIGURAÇÃO INICIAL

## Passo a Passo para Colocar o Sistema no Ar

### 1️⃣ Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Dê um nome (ex: "colegio-ilha-brasil")
4. Desabilite o Google Analytics (opcional)
5. Clique em "Criar projeto"

### 2️⃣ Ativar Authentication

1. No menu lateral, clique em "Authentication"
2. Clique em "Vamos começar"
3. Na aba "Sign-in method", clique em "E-mail/senha"
4. Ative a opção e salve

### 3️⃣ Criar Firestore Database

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de produção"
4. Selecione a localização (southamerica-east1 para Brasil)
5. Clique em "Ativar"

### 4️⃣ Configurar Regras de Segurança

1. No Firestore, clique na aba "Regras"
2. Cole o seguinte código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /diretores/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /professores/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/diretores/$(request.auth.uid));
    }
    
    match /alunos/{alunoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/diretores/$(request.auth.uid));
    }
    
    match /responsaveis/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/diretores/$(request.auth.uid));
    }
    
    match /turmas/{turmaId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/diretores/$(request.auth.uid));
    }
    
    match /atividades/{atividadeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

3. Clique em "Publicar"

### 5️⃣ Pegar Credenciais do Firebase

1. Clique no ícone de engrenagem ao lado de "Visão geral do projeto"
2. Clique em "Configurações do projeto"
3. Role até "Seus apps" e clique no ícone "</>"
4. Dê um nome ao app (ex: "Colégio Ilha Brasil Web")
5. Copie o objeto `firebaseConfig`

### 6️⃣ Configurar o Código

1. Abra o arquivo `js/firebase-config.js`
2. Substitua o `firebaseConfig` pelas suas credenciais
3. Salve o arquivo

### 7️⃣ Criar Primeiro Diretor (IMPORTANTE!)

**OPÇÃO A - Pelo Firebase Console (Recomendado):**

1. Vá em "Authentication" → "Users"
2. Clique em "Add user"
3. Digite o e-mail: `diretor@ilhabrasil.com.br`
4. Digite a senha: `Admin123!`
5. Clique em "Add user"
6. **COPIE O UID** do usuário criado (ex: "abc123xyz...")

7. Vá em "Firestore Database" → "Data"
8. Clique em "Iniciar coleção"
9. ID da coleção: `diretores`
10. Clique em "Próximo"
11. ID do documento: **Cole o UID que você copiou**
12. Adicione os campos:
    - nome (string): "Diretor(a) Administrativo"
    - email (string): "diretor@ilhabrasil.com.br"
    - status (string): "ativo"
    - dataCadastro (timestamp): clique no relógio para usar a data atual
13. Clique em "Salvar"

**OPÇÃO B - Pelo Código (depois do deploy):**

Se preferir criar depois que o sistema estiver no ar, você pode:
1. Fazer login como "diretor" usando credenciais temporárias
2. O sistema irá criar automaticamente o documento no Firestore

### 8️⃣ Fazer Deploy no Vercel

**Via GitHub:**

1. Crie um repositório no GitHub
2. Faça upload dos arquivos ou use Git:
   ```bash
   git init
   git add .
   git commit -m "Sistema Colégio Ilha Brasil"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/colegio-ilha-brasil.git
   git push -u origin main
   ```

3. Acesse: https://vercel.com
4. Faça login com GitHub
5. Clique em "Add New" → "Project"
6. Importe seu repositório
7. Configurações:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (deixe vazio)
   - Output Directory: ./
8. Clique em "Deploy"

### 9️⃣ Testar o Sistema

1. Acesse a URL fornecida pelo Vercel (ex: colegio-ilha-brasil.vercel.app)
2. Faça login com:
   - E-mail: `diretor@ilhabrasil.com.br`
   - Senha: `Admin123!`
   - **O sistema detecta automaticamente que você é diretor!**
3. Explore o dashboard!

### 🔟 Cadastrar Primeiro Professor

1. No dashboard, clique em "Professores" no menu lateral
2. Clique em "Adicionar Professor"
3. Preencha os dados:
   - Nome: João Silva
   - E-mail: joao.silva@ilhabrasil.com.br
   - Senha: Prof123!
   - Telefone: (11) 98765-4321
4. Clique em "Cadastrar Professor"

**⚠️ IMPORTANTE:** Após cadastrar, você será deslogado automaticamente. Isso é normal! O Firebase Auth só permite um usuário logado por vez. Faça login novamente como diretor.

### 1️⃣1️⃣ Cadastrar Primeira Turma

1. Clique em "Turmas" no menu lateral
2. Clique em "Criar Turma"
3. Preencha:
   - Nome: 1º Ano A
   - Ano Letivo: 2026
   - Período: Matutino
   - Capacidade: 30
4. Clique em "Criar Turma"

### 1️⃣2️⃣ Cadastrar Primeiro Aluno

1. Clique em "Alunos" no menu lateral
2. Clique em "Adicionar Aluno"
3. Preencha:
   - Nome: Maria Santos
   - Turma: 1º Ano A
   - Responsável: José Santos
   - E-mail do Responsável: jose.santos@email.com
   - Senha de Acesso: Resp123!
   - Data de Nascimento: 01/01/2015
4. Clique em "Cadastrar Aluno"

**⚠️ IMPORTANTE:** Você será deslogado novamente. Faça login como diretor para continuar.

## ✅ Sistema Configurado!

Agora você tem:
- ✅ Firebase configurado
- ✅ Sistema no ar via Vercel
- ✅ Conta de diretor criada
- ✅ Primeiro professor cadastrado
- ✅ Primeira turma criada
- ✅ Primeiro aluno cadastrado

## 🔐 Credenciais de Acesso

**Diretor:**
- E-mail: diretor@ilhabrasil.com.br
- Senha: Admin123!

**Professor:**
- E-mail: joao.silva@ilhabrasil.com.br
- Senha: Prof123!

**Responsável:**
- E-mail: jose.santos@email.com
- Senha: Resp123!

**Nota:** O sistema detecta automaticamente o tipo de usuário, não é necessário selecionar!

## 🆘 Problemas Comuns

**Erro: "Firebase is not defined"**
- Verifique se colocou as credenciais corretas no `firebase-config.js`

**Erro: "Permission denied"**
- Verifique se configurou as regras de segurança do Firestore

**Não consigo fazer login como diretor**
- Verifique se criou o documento na collection "diretores" com o UID correto

**Sou deslogado ao cadastrar professor/aluno**
- Isso é normal! O Firebase Auth só permite um login por vez

## 📞 Suporte

Se precisar de ajuda, verifique:
1. Console do navegador (F12) para ver erros
2. Firebase Console para ver logs
3. Vercel Dashboard para ver status do deploy

---

🎉 **Parabéns! Seu sistema está configurado e funcionando!** 🎉
