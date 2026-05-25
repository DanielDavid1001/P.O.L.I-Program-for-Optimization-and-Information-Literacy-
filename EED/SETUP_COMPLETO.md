# P.O.L.I - Sistema de Apoio Escolar

Este documento descreve como o projeto funciona e como preparar o ambiente local. O sistema é dividido em frontend React e backend Laravel, com autenticação via token e áreas protegidas por perfil de usuário.

## O que o sistema faz

O P.O.L.I organiza dados escolares em quatro frentes principais:

- cadastro e autenticação de usuários;
- gestão de alunos, professores, disciplinas e turmas;
- publicação e consumo de materiais didáticos;
- atualização do próprio perfil autenticado.

O frontend usa a API em `EED/backend` para montar a experiência da aplicação. Após o login, o token é salvo no navegador e reutilizado automaticamente nas chamadas protegidas.

## Funcionalidades

### Cadastro de conta

- `student` pode se cadastrar diretamente.
- `teacher` e `admin` passam por validação com token de registro.
- a senha precisa ser confirmada e não pode conter sequências previsíveis como `1234` ou `abcd`.

### Login e sessão

- o login gera um token pessoal do Laravel Sanctum.
- o frontend armazena esse token no `localStorage`.
- o endpoint `/api/user` é usado para carregar o perfil real do usuário depois da autenticação.
- o logout invalida o token atual.

### Recuperação de senha

- há fluxo público para `forgot-password` e `reset-password`.
- o processo foi desenhado para não depender de enumeração de usuários.

### Perfis e permissões

- alunos podem editar o próprio perfil autenticado.
- professores têm vínculo com disciplinas.
- administradores têm acesso aos cadastros mais sensíveis.

### Módulos disponíveis

- alunos
- professores
- disciplinas
- turmas
- materiais

## Como a autenticação funciona

O fluxo real da aplicação é o seguinte:

1. O usuário envia `email` e `password` para `/api/login`.
2. A API responde com `user` e `token`.
3. O frontend salva o token e passa a enviá-lo como `Bearer` nas próximas requisições.
4. O frontend consulta `/api/user` para obter o perfil completo e os dados específicos de aluno ou professor.
5. Em `student`, `teacher` e `admin`, a área disponível muda conforme a role.

### Cadastro com token de registro

Para `teacher` e `admin`, o backend usa um token temporário de cadastro:

- se o token estiver ausente ou incorreto, a API gera um novo token;
- esse token fica em cache por 15 minutos;
- o valor é impresso no terminal do servidor;
- a mesma requisição deve ser reenviada com o token correto em `registration_token`.

Esse mecanismo evita a criação indevida de contas administrativas.

## Estrutura do projeto

```text
EED/
├── src/                # Frontend React + Vite
├── backend/            # API Laravel
├── guidelines/         # Diretrizes do projeto
├── README.md           # Visão geral do projeto
└── SETUP_COMPLETO.md   # Guia de configuração
```

## Pré-requisitos

- Node.js 18+
- PHP 8.2+
- Composer
- MySQL 8+ ou PostgreSQL 13+

## Setup do frontend

```bash
cd "C:\xampp\htdocs\P.O.L.I\EED"
npm install
npm run dev
```

Se preferir no Windows, `npm.cmd install` e `npm.cmd run dev` também funcionam.

O frontend sobe em `http://localhost:5173`.

## Setup do backend

Se o backend ainda não estiver configurado:

```bash
cd "C:\xampp\htdocs\P.O.L.I\EED\backend"
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Se o projeto já estiver clonado com as dependências instaladas, normalmente basta ajustar `.env`, validar o banco e subir o servidor.

O backend fica em `http://localhost:8000`.

## Variáveis importantes

### Frontend

```env
VITE_API_URL=http://localhost:8000
```

### Backend

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=poli_db
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
APP_URL=http://localhost:8000
```

## Principais endpoints

| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/api/register` | Criar conta |
| POST | `/api/login` | Fazer login |
| POST | `/api/logout` | Encerrar sessão |
| GET | `/api/user` | Ler perfil autenticado |
| PATCH | `/api/user` | Atualizar perfil autenticado |
| POST | `/api/forgot-password` | Iniciar recuperação de senha |
| POST | `/api/reset-password` | Redefinir senha |
| GET | `/api/materials` | Listar materiais publicamente |
| GET | `/api/subjects-public` | Listar disciplinas públicas |
| GET | `/api/students` | Listar alunos autenticado |
| POST | `/api/students` | Criar aluno |
| GET | `/api/teachers` | Listar professores |
| POST | `/api/teachers` | Criar professor |
| GET | `/api/subjects` | Listar disciplinas autenticado |
| POST | `/api/subjects` | Criar disciplina |
| GET | `/api/classrooms` | Listar turmas |
| POST | `/api/classrooms` | Criar turma |

## Fluxo de uso recomendado

1. Configure o banco e rode as migrations.
2. Suba o backend com `php artisan serve`.
3. Suba o frontend com `npm run dev`.
4. Faça login ou crie conta conforme a role desejada.
5. Para professor ou admin, use o token de registro mostrado no terminal do backend.
6. Após autenticar, o frontend passa a usar o token automaticamente.

## Notas de comportamento

- Materiais podem ser listados sem login, mas criação e edição dependem de autenticação e role.
- O endpoint `/api/user` é a fonte confiável para reconstruir o estado do usuário na interface.
- O frontend assume o backend local em `127.0.0.1:8000` quando `VITE_API_URL` não é definido.

## Solução de problemas

- Se houver erro de CORS, verifique `SANCTUM_STATEFUL_DOMAINS` e `VITE_API_URL`.
- Se a API retornar `401`, confirme se o token foi salvo no navegador e enviado na requisição.
- Se a migration falhar, revise as credenciais do banco em `.env`.
- No Windows, prefira `npm.cmd` se o comando `npm` não estiver disponível no terminal.

