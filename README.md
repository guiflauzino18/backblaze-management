# B2 Management API

API para gerenciamento de armazenamento Backblaze B2 usando a API S3.

## Configuração

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure as variáveis de ambiente no arquivo `.env`:
   - **Database**: Configure as credenciais do PostgreSQL
   - **JWT**: Defina uma chave secreta para tokens JWT
   - **AWS/Backblaze**: Configure as credenciais do Backblaze B2

### Variáveis de Ambiente AWS/Backblaze

- `AWS_ACCESS_KEY_ID`: Application Key ID do Backblaze B2
- `AWS_SECRET_ACCESS_KEY`: Application Key do Backblaze B2
- `AWS_ENDPOINT`: Endpoint S3 do Backblaze (ex: `https://s3.us-west-002.backblazeb2.com`)
- `AWS_REGION`: Região do Backblaze (ex: `us-west-002`)

## Executando a Aplicação

```bash
# Instalar dependências
go mod download

# Executar migrations
make migrate-up

# Iniciar servidor
make run
```

O servidor estará disponível em `http://localhost:8080`

## Autenticação

A API utiliza JWT para autenticação. Faça login em `/api/v1/auth/login` para obter o token.

### Roles

- **admin**: Acesso total (pode criar/deletar buckets, fazer upload/download, modificar lifecycle)
- **user**: Apenas leitura (pode listar buckets, objetos, versões, lifecycle e métricas)

## Endpoints

### Buckets

- `GET /api/v1/buckets` - Listar todos os buckets (admin, user)
- `POST /api/v1/buckets` - Criar bucket (admin)
- `DELETE /api/v1/buckets/:name` - Deletar bucket (admin)

### Objetos

- `GET /api/v1/buckets/:name/objects` - Listar objetos em um bucket (admin, user)
- `GET /api/v1/buckets/:name/objects/:key/versions` - Listar versões de um objeto (admin, user)
- `POST /api/v1/buckets/:name/objects/:key/upload` - Upload de arquivo (admin)
- `GET /api/v1/buckets/:name/objects/:key/download` - Download de arquivo (admin, user)
- `DELETE /api/v1/buckets/:name/objects/:key` - Deletar objeto (admin)

### Lifecycle

- `GET /api/v1/buckets/:name/lifecycle` - Obter regras de lifecycle (admin, user)
- `DELETE /api/v1/buckets/:name/lifecycle` - Deletar regras de lifecycle (admin)

### Storage Metrics

- `GET /api/v1/buckets/:name/storage` - Obter métricas de armazenamento (admin, user)

## Documentação Swagger

Acesse `http://localhost:8080/swagger/index.html` para ver a documentação interativa da API.

## Tecnologias

- **Golang** com framework **Gin**
- **PostgreSQL** para banco de dados
- **AWS SDK for Go v2** para comunicação com Backblaze B2
- **JWT** para autenticação
- **Swagger** para documentação