# P.O.L.I - Programa de Otimização e Leitura de Informações

P.O.L.I é um sistema web de apoio escolar para gerenciar alunos, professores, disciplinas, turmas e materiais didáticos. O projeto separa a interface em um frontend React e uma API Laravel, com autenticação por token e áreas protegidas por perfil de usuário.

## Como o projeto funciona

O frontend fica em [EED/src](EED/src) e conversa com a API Laravel em [EED/backend](EED/backend). O cliente HTTP em [EED/src/lib/api.ts](EED/src/lib/api.ts) guarda o token Bearer no `localStorage`, envia esse token automaticamente nas requisições autenticadas e busca o usuário atual no endpoint `/api/user` para reconstruir o perfil correto após login ou atualização de dados.

No backend, a autenticação usa Laravel Sanctum. O sistema trabalha com três perfis principais:

- `student`: pode criar conta normalmente e acessar o próprio perfil.
- `teacher`: precisa passar pelo fluxo de token de cadastro.
- `admin`: também usa o fluxo de token de cadastro e tem acesso total aos cadastros administrativos.

## Funcionalidades

- Cadastro de conta com validação de senha e confirmação.
- Login com retorno de token Sanctum.
- Logout invalidando o token atual.
- Recuperação e redefinição de senha.
- Consulta do usuário autenticado com perfil consolidado em `/api/user`.
- Atualização do próprio perfil autenticado.
- CRUD de alunos, professores, disciplinas, turmas e materiais.
- Listagem pública de materiais e disciplinas públicas para consulta sem login.
- Controle de acesso por papel, com rotas públicas, autenticadas e administrativas.

## Autenticação

O fluxo de autenticação é baseado em token:

1. O usuário faz login em `/api/login`.
2. A API retorna o usuário e um token.
3. O frontend salva o token e o reutiliza nas próximas requisições.
4. O endpoint `/api/user` monta o perfil correto de acordo com a role do usuário.
5. O logout remove o token atual.

### Cadastro de admin e professor

Para `admin` e `teacher`, o cadastro exige um token de registro temporário. Quando o token ainda não existe ou está incorreto, o backend gera um novo token, grava em cache por 15 minutos e imprime o valor no terminal do servidor. Depois disso, a mesma requisição precisa ser reenviada com o token recebido.

Esse fluxo evita cadastros administrativos não autorizados e também é usado no primeiro acesso de perfis privilegiados.

## Módulos expostos na API

- Alunos: criação, listagem, edição e remoção.
- Professores: criação, listagem, visualização, edição e remoção.
- Disciplinas: listagem pública e CRUD autenticado.
- Turmas: CRUD autenticado.
- Materiais: listagem pública, visualização pública, criação autenticada por professor/admin e edição/exclusão restrita.

## Stack

- Frontend: React, Vite, TypeScript, TailwindCSS e shadcn/ui.
- Backend: PHP, Laravel 11 e Sanctum.
- Banco de dados: MySQL ou PostgreSQL.

## Estrutura principal

```text
EED/
├── src/                # Frontend React
├── backend/            # API Laravel
├── guidelines/         # Diretrizes do projeto
├── README.md           # Este arquivo
└── SETUP_COMPLETO.md    # Guia de configuração
```

## Execução local

### Frontend

```bash
cd "C:\xampp\htdocs\P.O.L.I\EED"
npm install
npm run dev
```

### Backend

```bash
cd "C:\xampp\htdocs\P.O.L.I\EED\backend"
php artisan serve
```

Se o ambiente estiver sendo configurado do zero, consulte [EED/SETUP_COMPLETO.md](EED/SETUP_COMPLETO.md) para o passo a passo completo.

## Observações importantes

- O frontend tenta usar `VITE_API_URL` e, se não houver variável definida, assume o backend local em `127.0.0.1:8000`.
- O endpoint `/api/user` é o ponto correto para recuperar o estado autenticado completo.
- Alguns recursos aceitam listagem pública, mas criação e edição são protegidas por token e role.

  
