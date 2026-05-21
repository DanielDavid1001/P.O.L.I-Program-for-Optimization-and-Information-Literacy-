# P.O.L.I - Sistema de Apoio Escolar

**P.O.L.I (Programa de Otimização e Leitura de Informações)** é um sistema web completo de apoio pedagógico para gerenciar alunos, professores, disciplinas e materiais didáticos em instituições de ensino.

## Visão Geral

- **Frontend:** React + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend:** PHP + Laravel 11 + Sanctum (autenticação)
- **Banco de Dados:** MySQL/PostgreSQL
- **Autenticação:** Token-based com Laravel Sanctum

---

## Início

### Pré-requisitos

- **Node.js** 18+ (para frontend)
- **PHP** 8.2+ (para backend)
- **Composer** (gerenciador de pacotes PHP)
- **MySQL** 8.0+ ou **PostgreSQL** 13+ (banco de dados)

### 1. Setup do Frontend

```bash
cd "C:\xampp\htdocs\P.O.L.I\EED"

# Instalar dependências
npm install

# Ou se preferir usar npm.cmd (recomendado no Windows):
npm.cmd install

# Iniciar servidor de desenvolvimento
npm run dev
# Ou
npm.cmd run dev
```

O frontend estará disponível em: **http://localhost:5173**

### 2. Setup do Backend

```bash
# 1. Criar novo projeto Laravel (se ainda não tiver feito)
composer create-project laravel/laravel backend

# 2. Copiar os stubs da pasta backend/ para o projeto
# Mescle os arquivos:
# - app/Models/* (Student.php, Teacher.php, etc.)
# - app/Http/Controllers/* (StudentController.php, etc.)
# - database/migrations/* (create_students_table.php, etc.)
# - routes/api.php

# 3. Entrar na pasta backend
cd backend

# 4. Instalar Sanctum para autenticação
composer require laravel/sanctum

# 5. Publicar configurações do Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 6. Configurar .env
# Copie .env.example para .env e configure:
cp .env.example .env
php artisan key:generate

# Configure as credenciais do banco de dados:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=poli_db
# DB_USERNAME=root
# DB_PASSWORD=

# Configure CORS e Sanctum:
# SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
# APP_URL=http://localhost:8000

# 7. Rodar migrations
php artisan migrate

# 8. Iniciar servidor de desenvolvimento
php artisan serve
```

O backend estará disponível em: **http://localhost:8000**

---

## Estrutura do Projeto

```
EED frontal Dashboard/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/      # Componentes React (StudentForm, TeacherForm, etc.)
│   │   │   └── App.tsx          # App principal
│   │   ├── lib/
│   │   │   └── api.ts           # Cliente HTTP para chamar API
│   │   └── styles/              # Arquivos CSS/TailwindCSS
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.local               # Configuração de URL da API
│
├── backend/                     # Laravel
│   ├── app/
│   │   ├── Models/              # Models (Student, Teacher, etc.)
│   │   └── Http/
│   │       └── Controllers/     # Controllers (StudentController, etc.)
│   ├── database/
│   │   ├── migrations/          # Migrations para banco de dados
│   │   └── seeders/             # (opcional) dados iniciais
│   ├── routes/
│   │   └── api.php              # Rotas da API
│   ├── config/
│   │   ├── cors.php             # Configuração CORS
│   │   └── sanctum.php          # Configuração de autenticação
│   ├── .env                     # Variáveis de ambiente
│   ├── README.md                # Instruções do backend
│   └── API_DOCUMENTATION.md     # Documentação de endpoints
│
└── README.md (este arquivo)
```

---

## Integração Frontend-Backend

### Cliente API (`src/lib/api.ts`)

O frontend comunica com o backend através do cliente API em `src/lib/api.ts`. 
Exemplo:

```typescript
import * as api from "../lib/api";

// Buscar lista de alunos
const students = await api.getStudents();

// Criar novo aluno
const newStudent = await api.createStudent({
  name: "João Silva",
  email: "joao@escola.com",
  phone: "(21)98024-3122",
  birth_date: "2015-05-10",
  classroom_id: 1,
});

// Atualizar aluno
await api.updateStudent(studentId, { name: "João Atualizado" });

// Deletar aluno
await api.deleteStudent(studentId);
```

### Configuração da URL da API

Crie um arquivo `.env.local` na raiz do projeto frontend:

```env
VITE_API_URL=http://localhost:8000
```

Em produção, altere para a URL do seu servidor:

```env
VITE_API_URL=https://api.seudominio.com
```

---

## Modelos de Dados

### Student (Aluno)
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@escola.com",
  "phone": "(21)98324-1122",
  "birth_date": "2015-05-10",
  "classroom_id": 1,
  "created_at": "2026-05-09T10:00:00Z",
  "updated_at": "2026-05-09T10:00:00Z"
}
```

### Teacher (Professor)
```json
{
  "id": 1,
  "name": "Carlos Mendes",
  "email": "carlos@escola.com",
  "phone": "(21)9198244251",
  "created_at": "2026-05-09T10:00:00Z",
  "updated_at": "2026-05-09T10:00:00Z"
}
```

### Subject (Disciplina)
```json
{
  "id": 1,
  "name": "Matemática",
  "code": "MAT001",
  "teacher_id": 1,
  "created_at": "2026-05-09T10:00:00Z",
  "updated_at": "2026-05-09T10:00:00Z"
}
```

### Material (Arquivo/Recurso)
```json
{
  "id": 1,
  "title": "Introdução à Álgebra",
  "description": "Material sobre álgebra básica",
  "type": "pdf",
  "subject_id": 1,
  "file_url": "https://...",
  "uploaded_by": 1,
  "created_at": "2026-05-09T10:00:00Z",
  "updated_at": "2026-05-09T10:00:00Z"
}
```

---

## Autenticação

### Login

```typescript
const { user, token } = await api.login("usuario@email.com", "senha123");
// Token pode ser armazenado em localStorage/sessionStorage
localStorage.setItem("token", token);
```

### Logout

```typescript
await api.logout();
```

### Requisições com Token

O cliente API inclui automaticamente o token em todas as requisições:

```typescript
const res = await fetch("http://localhost:8000/api/students", {
  credentials: "include",  // Inclui cookies
  headers: {
    "Authorization": `Bearer ${token}`,  // Ou use cookies
  },
});
```

### Cadastro e primeiro acesso

O sistema funciona assim:

- **Aluno:** pode se cadastrar normalmente, sem token.
- **Professor/Administrador:** precisam informar o token de registro.
- **Primeiro administrador:** deve ser criado pelo terminal.

Fluxo prático:

1. Gere o token de registro no terminal:

```bash
cd "C:\xampp\htdocs\P.O.L.I\EED\backend"
php artisan poli:generate-registration-token
```

2. O token é mostrado no terminal e salvo em `storage/app/poli/registration-token.txt`.
3. Use esse token na tela de cadastro quando for criar um administrador ou professor.
4. Para o primeiro acesso administrativo, crie o primeiro admin pelo terminal:

```bash
php artisan poli:create-first-admin
```

5. Depois disso, o administrador pode entrar normalmente com login e senha.

Observação: hoje o token é recebido manualmente pelo terminal e pela tela de cadastro; futuramente ele pode ser enviado por e-mail.

---

## Testes

### Testar Backend com Postman/Insomnia

1. Importe os endpoints de `backend/API_DOCUMENTATION.md`
2. Configure a variável de ambiente: `{{api_url}}` = `http://localhost:8000`
3. Teste cada endpoint CRUD

### Testar Frontend

```bash
cd "C:\xampp\htdocs\P.O.L.I\EED"
npm run dev

# Acesse http://localhost:5173
# Teste os formulários e operações CRUD
```

---

## Endpoints Principais

Ver documentação completa em [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/login` | Fazer login |
| POST | `/api/logout` | Fazer logout |
| GET | `/api/students` | Listar alunos |
| POST | `/api/students` | Criar aluno |
| PUT | `/api/students/{id}` | Atualizar aluno |
| DELETE | `/api/students/{id}` | Remover aluno |
| GET | `/api/teachers` | Listar professores |
| POST | `/api/teachers` | Criar professor |
| GET | `/api/subjects` | Listar disciplinas |
| GET | `/api/materials` | Listar materiais |
| POST | `/api/materials` | Criar material |
| GET | `/api/classrooms` | Listar turmas |

---

## Deploy

### Backend (Laravel)

**Opção 1: Heroku**
```bash
# Instale o Heroku CLI
heroku create seu-app-backend
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
heroku run php artisan migrate
```

**Opção 2: DigitalOcean App Platform**
- Conecte seu repo GitHub
- Configure variáveis de ambiente (DB_*, SANCTUM_STATEFUL_DOMAINS)
- Deploy automático

**Opção 3: VPS (Hetzner, Linode, AWS)**
- SSH para o servidor
- Instale PHP, Composer, Nginx
- Clone o repo e rode `php artisan migrate`
- Configure domínio e SSL

** Utilizando O Script -npm run deploy-**
- npm run deploy (Configura as alterações feitas no frontend para o backend)

### Frontend (React)

**Opção 1: Vercel**
```bash
npm install -g vercel
vercel
```

**Opção 2: Netlify**
```bash
npm run build
# Arraste a pasta `dist/` para Netlify
```

**Opção 3: Servidor estático**
```bash
npm run build
# Copie a pasta `dist/` para seu servidor web (Apache, Nginx)
```

---

## Troubleshooting

### "CORS error: Access denied"
- Verifique se `SANCTUM_STATEFUL_DOMAINS` está configurado no `.env` do backend
- Confirme se `VITE_API_URL` está correto no `.env.local` do frontend

### "API returns 401 Unauthorized"
- Verifique se o token está sendo enviado corretamente
- Confirme se o usuário está autenticado

### "Database migration fails"
- Verifique credenciais do banco de dados em `.env`
- Confirme se o banco de dados existe: `php artisan migrate:fresh`

### "npm: command not found"
- Use `npm.cmd` no Windows PowerShell
- Ou use `cmd.exe` em vez de PowerShell

---

## Recursos Adicionais

- [Laravel Sanctum Documentation](https://laravel.com/docs/11.x/sanctum)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

## Licença

Este projeto é fornecido como exemplo educacional. Adapte conforme necessário para seus requisitos.

---

**Desenvolvido com (carinho 😊) para educação**

