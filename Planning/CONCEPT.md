# DIAM AI Pilot

Protótipo de IA educacional para o curso DIAM no ISCTE.

## Descrição

O DIAM AI Pilot é uma aplicação que permite aos professores fazer upload de materiais de curso em PDF para que os estudantes possam aceder e fazer perguntas em linguagem natural, recebendo respostas geradas por IA baseadas no conteúdo carregado. A aplicação utiliza o modelo Google Gemini 2.5 Flash para gerar respostas contextualizadas e suporta tanto português quanto inglês.

## Características Principais

- 📄 **Upload de PDFs**: Suporte para documentos até 10MB
- 🤖 **IA Contextual**: Respostas baseadas no conteúdo do documento
- 🌍 **Bilíngue**: Suporte para português e inglês
- ⚡ **Interface Responsiva**: Funciona em desktop e mobile
- 🔒 **Seguro**: Validação de arquivos e limpeza automática
- 🧪 **Testado**: Cobertura completa de testes unitários e integração

## Estrutura do Projeto

```
diam-ai-pilot/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── services/         # Comunicação com API
│   │   ├── types/            # Definições TypeScript
│   │   └── __tests__/        # Testes dos componentes
│   └── package.json
├── backend/                  # Servidor Node.js/Express
│   ├── src/
│   │   ├── routes/           # Rotas da API
│   │   ├── services/         # Lógica de negócio
│   │   ├── middleware/       # Middleware Express
│   │   ├── types/            # Interfaces TypeScript
│   │   └── __tests__/        # Testes unitários e integração
│   └── package.json
├── docs/                     # Documentação
│   ├── API.md               # Documentação da API
│   └── DEVELOPMENT.md       # Guia de desenvolvimento
├── .kiro/                   # Configurações Kiro
│   ├── specs/               # Especificações de funcionalidades
│   └── steering/            # Regras de orientação
└── README.md               # Este arquivo
```

## Tecnologias

### Frontend

- **React 18+** com TypeScript
- **Modern CSS** para estilização
- **Axios** para requisições HTTP
- **HTML5 File API** para upload de arquivos
- **Jest & React Testing Library** para testes

### Backend

- **Node.js** com Express.js e TypeScript
- **Multer** para upload de arquivos
- **pdf-parse** para extração de texto
- **Google Generative AI SDK** para integração com Gemini
- **Jest & Supertest** para testes
- **Puppeteer** para testes end-to-end

## Configuração de Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm 8+
- Chave da API do Google Gemini

### Instalação Rápida

```bash
# Clonar o repositório
git clone <repository-url>
cd diam-ai-pilot

# Instalar todas as dependências
npm run install:all

# Configurar variáveis de ambiente
cd backend
cp .env.example .env
# Editar .env e adicionar GEMINI_API_KEY
```

### Configuração do Backend

Crie um arquivo `.env` no diretório `backend/` com:

```env
GEMINI_API_KEY=sua_chave_da_api_gemini
PORT=3001
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### Desenvolvimento

```bash
# Executar frontend e backend simultaneamente
npm run dev:all

# Ou executar separadamente:
npm run dev:frontend  # React dev server (porta 3000)
npm run dev:backend   # Express server (porta 3001)
```

### Testes

```bash
# Executar todos os testes
npm test

# Executar testes por categoria
npm run test:frontend  # Testes do React
npm run test:backend   # Testes do Node.js

# Executar com cobertura
npm run test:coverage
```

## Scripts Disponíveis

### Scripts Principais

- `npm run dev:all` - Executa frontend e backend simultaneamente
- `npm run build` - Build de produção para ambos os projetos
- `npm test` - Executa todos os testes
- `npm run install:all` - Instala dependências de todos os projetos

### Scripts de Desenvolvimento

- `npm run dev:frontend` - Servidor de desenvolvimento React (porta 3000)
- `npm run dev:backend` - Servidor de desenvolvimento Express (porta 3001)
- `npm run build:frontend` - Build de produção do frontend
- `npm run build:backend` - Build de produção do backend

### Scripts de Teste

- `npm run test:frontend` - Testes do frontend
- `npm run test:backend` - Testes do backend
- `npm run test:coverage` - Testes com relatório de cobertura

## Uso da Aplicação

**Para Professores:**
1. **Acesse a aplicação** em `http://localhost:3000`
2. **Faça upload de PDFs** dos materiais do curso clicando na área de upload ou arrastando os arquivos
3. **Organize os materiais** por capítulos ou tópicos

**Para Estudantes:**
1. **Acesse a aplicação** em `http://localhost:3000`
2. **Selecione um documento** disponibilizado pelo professor
3. **Digite sua pergunta** sobre o conteúdo do documento
4. **Receba a resposta** gerada pela IA baseada no documento

### Limitações

- Arquivos PDF até 10MB
- Perguntas entre 10 e 1000 caracteres
- Apenas arquivos PDF são suportados
- Processamento temporário (sem armazenamento persistente)

## Arquitetura

### Fluxo de Dados

```
[Cliente] → [Upload PDF + Pergunta] → [Backend]
    ↓
[Validação] → [Extração de Texto] → [Gemini AI]
    ↓
[Resposta Formatada] → [Cliente]
```

### Componentes Principais

**Frontend:**

- `App.tsx` - Componente principal com gerenciamento de estado
- `FileUpload.tsx` - Interface de upload de arquivos (para professores)
- `QuestionInput.tsx` - Formulário de perguntas (para estudantes)
- `ResponseDisplay.tsx` - Exibição de respostas da IA
- **CSS Modular** - Arquitetura CSS organizada por componentes

**Backend:**

- `server.ts` - Configuração do servidor Express
- `api.ts` - Rotas da API
- `geminiClient.ts` - Integração com Google Gemini
- `pdfProcessor.ts` - Processamento de arquivos PDF
- `errorService.ts` - Tratamento de erros

## Documentação

- **[API Documentation](docs/API.md)** - Documentação completa da API
- **[Development Guide](docs/DEVELOPMENT.md)** - Guia detalhado de desenvolvimento
- **[Specifications](.kiro/specs/)** - Especificações técnicas das funcionalidades

## Testes

### Cobertura de Testes

- ✅ **Testes Unitários**: Todos os componentes e serviços
- ✅ **Testes de Integração**: Fluxos completos da API
- ✅ **Testes End-to-End**: Jornadas completas do usuário
- ✅ **Testes de Acessibilidade**: Navegação por teclado e ARIA

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração
npm run test:integration

# Testes end-to-end (requer servidores rodando)
npm run test:e2e
```

## Segurança

- **Validação de Arquivos**: Tipo, tamanho e formato
- **Sanitização de Entrada**: Todas as entradas são validadas
- **Armazenamento Temporário**: Arquivos são removidos após processamento
- **Rate Limiting**: Proteção contra abuso da API
- **CORS Configurado**: Origens permitidas configuradas

## Performance

- **Processamento Assíncrono**: Upload e processamento não-bloqueantes
- **Limpeza Automática**: Remoção automática de arquivos temporários
- **Otimização de Bundle**: Code splitting no frontend
- **Caching**: Headers de cache apropriados

## Contribuição

### Processo de Desenvolvimento

1. Fork do repositório
2. Criar branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Implementar mudanças com testes
4. Executar suite de testes (`npm test`)
5. Commit das mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
6. Push para branch (`git push origin feature/nova-funcionalidade`)
7. Criar Pull Request

### Padrões de Código

- **TypeScript**: Tipagem estrita habilitada
- **ESLint**: Configurado para React e Node.js
- **Testes**: Obrigatórios para novas funcionalidades
- **Documentação**: Comentários JSDoc para funções públicas

## Troubleshooting

### Problemas Comuns

**Erro de API Key:**

```bash
# Verificar se a chave está configurada
echo $GEMINI_API_KEY

# Ou verificar no arquivo .env
cat backend/.env
```

**Problemas de Upload:**

- Verificar se o arquivo é PDF válido
- Confirmar que o tamanho é menor que 10MB
- Verificar permissões do diretório `uploads/`

**Erros de CORS:**

- Verificar se o frontend está rodando na porta 3000
- Confirmar configuração de CORS no backend

### Logs de Debug

```bash
# Backend com logs detalhados
cd backend
DEBUG=* npm run dev

# Verificar logs de erro
tail -f backend/logs/error.log
```

## Roadmap

### Próximas Funcionalidades

- [ ] Autenticação de usuários
- [ ] Histórico de conversas
- [ ] Suporte a múltiplos formatos de arquivo
- [ ] Cache de respostas
- [ ] Métricas e analytics
- [ ] Deploy automatizado

### Melhorias Técnicas

- [ ] Containerização com Docker
- [ ] CI/CD pipeline
- [ ] Monitoramento e alertas
- [ ] Backup e recuperação
- [ ] Escalabilidade horizontal

## Licença

Este projeto é um protótipo educacional desenvolvido para o curso DIAM no ISCTE.

## Suporte

Para suporte e questões:

- **Documentação**: Consulte os arquivos em `docs/`
- **Issues**: Use o sistema de issues do repositório
- **Desenvolvimento**: Veja `docs/DEVELOPMENT.md`

---

**Desenvolvido com ❤️ para estudantes do DIAM - ISCTE**
