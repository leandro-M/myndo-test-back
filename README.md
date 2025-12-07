# Myndo Test - Backend

Backend NestJS com PostgreSQL (AWS RDS), Prisma ORM e AWS S3 para gerenciamento de cards com upload de arquivos.

## 🚀 Tecnologias

- NestJS
- PostgreSQL (AWS RDS)
- Prisma ORM v7
- AWS S3
- Docker & Docker Compose
- TypeScript
- Class Validator
- GitHub Actions (CI/CD)

## 📋 Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- AWS RDS PostgreSQL
- Conta AWS com bucket S3 configurado
- GitHub Actions runner configurado no EC2

## 🔧 Instalação Local

1. Clone o repositório

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://user:password@your-rds-endpoint.rds.amazonaws.com:5432/myndo?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=myndo-test-bucket
```

4. Execute as migrations do Prisma:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 🐳 Docker

### Desenvolvimento Local com Docker

```bash
# Build e start
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

### Produção (EC2 com RDS)

O backend roda em Docker no EC2 e conecta ao RDS PostgreSQL gerenciado pela AWS.

```bash
# Deploy automático via GitHub Actions
git push origin main
```

## 🏃 Executando o projeto

### Desenvolvimento
```bash
npm run start:dev
```

O servidor estará disponível em `http://localhost:3001`

### Produção (Docker)
```bash
npm run build
npm run start:prod
```

## 📚 API Endpoints

### Cards

#### Criar Card
```http
POST /cards
Content-Type: application/json

{
  "title": "Card 1",
  "description": "Descrição do card"
}
```

#### Listar Cards
```http
GET /cards
```

#### Buscar Card por ID
```http
GET /cards/:id
```

#### Atualizar Card
```http
PATCH /cards/:id
Content-Type: application/json

{
  "title": "Novo título",
  "description": "Nova descrição"
}
```

#### Deletar Card
```http
DELETE /cards/:id
```

#### Upload de arquivo
```http
POST /cards/:id/upload
Content-Type: multipart/form-data

file: <arquivo>
```

#### Obter URL de download
```http
GET /cards/:id/file-url
```

Resposta:
```json
{
  "url": "https://presigned-url..."
}
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: cards

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | ID único do card |
| title | string | Título do card |
| description | string | Descrição do card |
| fileKey | string? | Chave do arquivo no S3 |
| createdAt | datetime | Data de criação |
| updatedAt | datetime | Data de atualização |

## 🚀 Deploy Automático (CI/CD)

### Arquitetura

- **EC2 (t3.medium)**: Hospeda o backend em Docker
- **RDS PostgreSQL**: Database gerenciado pela AWS
- **S3**: Storage de arquivos
- **GitHub Actions**: CI/CD automático com self-hosted runner

### Fluxo de Deploy

1. Push para branch `main`
2. GitHub Actions detecta mudanças
3. Self-hosted runner no EC2 executa workflow
4. Build da imagem Docker
5. Executa migrations no RDS
6. Deploy do container
7. Health check automático

### Configuração do CI/CD

#### 1. Criar RDS PostgreSQL

```bash
# Via AWS Console:
# - Type: PostgreSQL
# - Instance: db.t4g.micro (Free Tier)
# - Master username: postgres
# - Master password: <sua-senha>
# - Database name: myndo
# - Public access: No
# - VPC: Mesma do EC2
```

Configurar Security Group do RDS:
- Porta 5432 aberta para o EC2 (IP privado: `172.31.x.x/32`)

#### 2. Configurar GitHub Secrets

No repositório do GitHub, adicione os seguintes secrets:

| Secret | Valor |
|--------|-------|
| `DATABASE_URL` | `postgresql://user:pass@rds-endpoint:5432/myndo?schema=public` |
| `FRONTEND_URL` | `http://ec2-public-dns.amazonaws.com:3000` |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Sua AWS Access Key |
| `AWS_SECRET_ACCESS_KEY` | Sua AWS Secret Key |
| `AWS_S3_BUCKET_NAME` | Nome do bucket S3 |

#### 3. Setup GitHub Actions Runner no EC2

```bash
# Conectar ao EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar GitHub Actions Runner
# 1. Vá em: GitHub repo → Settings → Actions → Runners → New self-hosted runner
# 2. Siga as instruções para Linux
# 3. Instale como serviço:

cd ~/actions-runner
sudo ./svc.sh install ubuntu
sudo ./svc.sh start
sudo ./svc.sh status
```

#### 4. Verificar Deploy

```bash
# Ver logs do GitHub Actions
# GitHub repo → Actions → Última execução

# Ver containers rodando no EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
docker ps
docker logs myndo-backend

# Testar API
curl http://your-ec2-ip:3001/cards
```

## 📦 Estrutura de Arquivos

```
myndo-test-backend/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions workflow
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   └── migrations/             # Histórico de migrations
├── prisma.config.ts            # Configuração Prisma v7
├── src/
│   ├── cards/                  # Módulo de cards
│   ├── aws/                    # Integração S3
│   └── main.ts                 # Entry point
├── docker-compose.yml          # Docker setup
├── Dockerfile                  # Build da imagem
├── RDS-SETUP.md               # Guia de setup do RDS
└── README.md
```

## 🔐 Segurança

- ✅ Nunca commite o arquivo `.env`
- ✅ Use GitHub Secrets para variáveis sensíveis
- ✅ RDS em VPC privada (não acessível publicamente)
- ✅ Security Groups configurados para mínimo privilégio
- ✅ AWS IAM roles com least privilege
- ✅ HTTPS em produção (configure Load Balancer)
- ✅ Backups automáticos do RDS (7 dias retenção)

## 🧪 Testes

```bash
# Rodar todos os testes
npm run test

# Testes com coverage
npm run test:cov

# Testes E2E
npm run test:e2e

# Testes em watch mode
npm run test:watch
```

## 📝 Scripts disponíveis

- `npm run start:dev` - Desenvolvimento com hot-reload
- `npm run build` - Build para produção
- `npm run start:prod` - Produção
- `npm run lint` - ESLint
- `npm run test` - Jest tests
- `npm run test:e2e` - E2E tests

## 🛠️ Troubleshooting

### Container não inicia

```bash
# Ver logs do container
docker logs myndo-backend

# Verificar variáveis de ambiente
docker exec myndo-backend env | grep DATABASE_URL
```

### Erro de conexão com RDS

```bash
# Testar conexão do EC2 ao RDS
psql "postgresql://user:pass@rds-endpoint:5432/myndo"

# Verificar Security Group do RDS
# Deve permitir porta 5432 do IP privado do EC2
```

### Migrations falham

```bash
# Entrar no container
docker exec -it myndo-backend sh

# Rodar migration manualmente
npx prisma migrate deploy

# Ver status das migrations
npx prisma migrate status
```

## 📊 Monitoramento

### Logs do Backend
```bash
docker logs -f myndo-backend
```

### Logs do Runner
```bash
sudo journalctl -u actions.runner.*.service -f
```

### Métricas do RDS
- AWS Console → RDS → Databases → myndo-test
- Veja: CPU, Connections, Storage, IOPS

## 💰 Custos AWS (Estimativa)

| Recurso | Tipo | Custo/mês |
|---------|------|-----------|
| EC2 | t3.medium | ~$30 |
| RDS | db.t4g.micro (Free Tier) | $0 (12 meses) |
| S3 | Standard | ~$1-5 (por uso) |
| **Total** | | **~$31-36/mês** |

Após Free Tier do RDS: +$12-24/mês

## 🔄 Rollback

Se algo der errado no deploy:

```bash
# SSH no EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Ver imagens Docker antigas
docker images

# Rodar versão anterior
docker stop myndo-backend
docker rm myndo-backend
docker run -d --name myndo-backend <imagem-antiga>
```

## 👨‍💻 Autor

Desenvolvido para o teste técnico Myndo.

## 📄 Licença

UNLICENSED - Projeto privado para avaliação técnica.
