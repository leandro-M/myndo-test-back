# Myndo Test - Backend

Backend NestJS com PostgreSQL (AWS RDS), Prisma ORM e AWS S3 para gerenciamento de cards com upload de arquivos.

## 🚀 Tecnologias

- NestJS
- PostgreSQL (AWS RDS)
- Prisma ORM v7
- AWS S3
- Docker & Docker Compose
- Nginx (Reverse Proxy com SSL/TLS)
- Let's Encrypt (Certificado SSL gratuito)
- TypeScript
- Class Validator
- GitHub Actions (CI/CD)

## 📋 Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- AWS RDS PostgreSQL
- Conta AWS com bucket S3 configurado
- EC2 com portas 80 (HTTP) e 443 (HTTPS) abertas no Security Group

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
FRONTEND_URL=https://myndo-test-front.vercel.app
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

O backend roda em Docker no EC2 e conecta ao RDS PostgreSQL gerenciado pela AWS. O Nginx atua como reverse proxy com SSL/TLS (Let's Encrypt).

**URL de produção:** https://ec2-44-222-69-159.compute-1.amazonaws.com

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
- **Nginx**: Reverse proxy com SSL/TLS (porta 80/443 → 3001)
- **Let's Encrypt**: Certificado SSL gratuito e auto-renovável
- **RDS PostgreSQL**: Database gerenciado pela AWS
- **S3**: Storage de arquivos
- **GitHub Actions**: CI/CD automático via SSH
- **Vercel**: Frontend em produção

### Fluxo de Deploy

1. Push para branch `main`
2. GitHub Actions runner (ubuntu-latest) inicia
3. Conecta via SSH na EC2
4. Configura Nginx + SSL (se primeira vez)
5. Clona/atualiza código do repositório
6. Build da imagem Docker
7. Remove containers antigos
8. Deploy do novo container
9. Executa migrations no RDS
10. Health check automático
11. Backend disponível em HTTPS

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

| Secret | Valor | Descrição |
|--------|-------|-----------|
| `EC2_SSH_KEY` | Conteúdo da chave `.pem` | Chave privada para SSH |
| `EC2_HOST` | `ec2-44-222-69-159.compute-1.amazonaws.com` | Hostname da EC2 |
| `EC2_USER` | `ubuntu` | Usuário SSH |
| `GH_PAT` | Personal Access Token | Token para clonar repo privado |
| `DATABASE_URL` | `postgresql://user:pass@rds-endpoint:5432/myndo?schema=public` | Connection string do RDS |
| `FRONTEND_URL` | `https://myndo-test-front.vercel.app` | URL do frontend |
| `AWS_REGION` | `us-east-1` | Região AWS |
| `AWS_ACCESS_KEY_ID` | Sua AWS Access Key | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Sua AWS Secret Key | Credencial AWS |
| `AWS_S3_BUCKET_NAME` | Nome do bucket S3 | Bucket para uploads |

**Como criar o Personal Access Token (GH_PAT):**
1. GitHub.com → Settings (pessoal) → Developer settings
2. Personal access tokens → Tokens (classic) → Generate new token
3. Marque: `repo` (Full control of private repositories)
4. Copie o token (começa com `ghp_...`)

#### 3. Configurar Security Group da EC2

No AWS Console:

1. **EC2 → Security Groups**
2. Selecione o Security Group da sua instância
3. **Inbound rules** → Edit inbound rules → Add rule

| Type | Protocol | Port | Source | Descrição |
|------|----------|------|--------|-----------|
| HTTP | TCP | 80 | 0.0.0.0/0 | Nginx (redirect para HTTPS) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Nginx SSL |
| SSH | TCP | 22 | Seu IP | Acesso SSH |
| Custom TCP | TCP | 3001 | 172.31.0.0/16 | Backend (interno VPC) |

**Importante:** O Nginx configurado automaticamente:
- Recebe requisições HTTPS na porta 443
- Faz proxy para o backend na porta 3001 (localhost)
- Certificado SSL renovado automaticamente pelo Let's Encrypt

#### 4. Verificar Deploy

```bash
# Ver logs do GitHub Actions
# GitHub repo → Actions → Última execução

# Ver containers rodando no EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
docker ps
docker logs myndo-backend

# Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# Ver certificado SSL
sudo certbot certificates

# Testar API (HTTPS)
curl https://ec2-44-222-69-159.compute-1.amazonaws.com/cards
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
- ✅ HTTPS em produção com certificado Let's Encrypt
- ✅ Nginx como reverse proxy (backend não exposto)
- ✅ Certificado SSL renovado automaticamente
- ✅ RDS em VPC privada (não acessível publicamente)
- ✅ Security Groups configurados para mínimo privilégio
- ✅ AWS IAM roles com least privilege
- ✅ Backups automáticos do RDS (7 dias retenção)
- ✅ CORS configurado apenas para frontend autorizado

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

### Erro CORS

```bash
# Verificar se FRONTEND_URL está correto no .env
docker exec myndo-backend env | grep FRONTEND_URL

# Deve ser: https://myndo-test-front.vercel.app
```

### Certificado SSL expirado

```bash
# Renovar manualmente
sudo certbot renew

# Testar renovação
sudo certbot renew --dry-run

# Ver status dos certificados
sudo certbot certificates
```

### Nginx não funciona

```bash
# Verificar status
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx
```

## 📊 Monitoramento

### Logs do Backend
```bash
docker logs -f myndo-backend
```

### Logs do Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Logs do Deploy (GitHub Actions)
```
GitHub repo → Actions → Workflow runs
```

### Métricas do RDS
- AWS Console → RDS → Databases → myndo-test
- Veja: CPU, Connections, Storage, IOPS

### Status dos Serviços
```bash
# Backend container
docker ps | grep myndo-backend

# Nginx
sudo systemctl status nginx

# Certificado SSL
sudo certbot certificates
```

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
