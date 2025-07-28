# DIAM AI Pilot

Protótipo de IA educacional para o curso DIAM no ISCTE.

## Descrição

O DIAM AI Pilot é uma aplicação que permite aos estudantes fazer upload de materiais de curso em PDF e fazer perguntas em linguagem natural, recebendo respostas geradas por IA baseadas no conteúdo carregado.

## Estrutura do Projeto

```
diam-ai-pilot/
├── frontend/          # Aplicação React
├── backend/           # Servidor Node.js/Express
├── .kiro/            # Configurações Kiro
└── README.md         # Este arquivo
```

## Tecnologias

- **Frontend**: React 18+ com TypeScript
- **Backend**: Node.js com Express e TypeScript
- **IA**: Google Gemini 2.5 Flash
- **Processamento**: PDF parsing, Multer para uploads

## Configuração de Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm

### Instalação
```bash
# Instalar dependências de todos os projetos
npm run install:all

# Ou instalar individualmente
npm install
cd frontend && npm install
cd ../backend && npm install
```

### Desenvolvimento
```bash
# Executar frontend e backend simultaneamente
npm run dev:all

# Ou executar separadamente
npm run dev:frontend  # React dev server (porta 3000)
npm run dev:backend   # Express server (porta 3001)
```

### Configuração do Backend
1. Copie `.env.example` para `.env` no diretório backend
2. Configure sua chave da API do Google Gemini
3. Ajuste outras configurações conforme necessário

## Scripts Disponíveis

- `npm run dev:all` - Executa frontend e backend
- `npm run build` - Build de produção
- `npm test` - Executa todos os testes
- `npm run install:all` - Instala todas as dependências

## Status do Projeto

Este é um protótipo em desenvolvimento para validação do conceito principal de interação entre estudantes, conteúdo e IA.