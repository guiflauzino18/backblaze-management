# B2 Management API

API para gerenciamento de armazenamento Backblaze B2 usando a API S3.

## Configuração

- criar pasta no servidor:

``` mkdir /b2-management```

- Copie o conteúdo do arquivo .env e ajuste o valor das variáveis
```ini
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=b2management
DB_PASSWORD=b2management*.
DB_NAME=b2management
DB_SSLMODE=disable

# Server
SERVER_PORT=8080

# JWT
JWT_SECRET=your_jwt_secret_here_change_in_production

AWS_ACCESS_KEY_ID=005857e047b3072000000001f
AWS_SECRET_ACCESS_KEY=K005COnvfRE6rf78gNrJILy/wlWkgy8
AWS_ENDPOINT=https://s3.us-east-005.backblazeb2.com
AWS_REGION=us-east-5
```
- Crie o arquivo docker-compose.yaml
```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: b2management-postgres
    environment:
      POSTGRES_USER: b2management
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: b2management
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U b2management"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - b2management-network

  migrations:
    image: migrate/migrate
    container_name: b2management-migrations
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ../api/migrations:/migrations
    command:
      - "-path=/migrations"
      - "-database=postgres://b2management:${DB_PASSWORD}@postgres:5432/b2management?sslmode=disable"
      - "up"
    networks:
      - b2management-network

  seed:
    image: guiflauzino18/b2management-api:latest
    container_name: b2management-seed
    environment:
      DB_HOST: postgres
      DB_PORT: "5432"
      DB_USER: b2management
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: b2management
      DB_SSLMODE: disable
      JWT_SECRET: ${JWT_SECRET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_ENDPOINT: ${AWS_ENDPOINT}
      AWS_REGION: ${AWS_REGION}
    command: ["./seed"]
    depends_on:
      migrations:
        condition: service_completed_successfully
    networks:
      - b2management-network

  api:
    image: guiflauzino18/b2management-api:latest
    container_name: b2management-api
    environment:
      DB_HOST: postgres
      DB_PORT: "5432"
      DB_USER: b2management
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: b2management
      DB_SSLMODE: disable
      SERVER_PORT: "8080"
      JWT_SECRET: ${JWT_SECRET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_ENDPOINT: ${AWS_ENDPOINT}
      AWS_REGION: ${AWS_REGION}
    ports:
      - "8080:8080"
    depends_on:
      seed:
        condition: service_completed_successfully
    networks:
      - b2management-network

  frontend:
    image: guiflauzino18/b2management-frontend:latest
    container_name: b2management-frontend
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - b2management-network

volumes:
  pgdata:

networks:
  b2management-network:
    driver: bridge
```
- Execute o comando abaixo:
```bash
cd /b2-management
docker compose pull
docker compose up -d
```

### Roles

- **admin**: Acesso total (pode criar/deletar buckets, fazer upload/download, modificar lifecycle)
- **user**: Apenas leitura (pode listar buckets, objetos, versões, lifecycle e métricas)

## Documentação Swagger

Acesse `http://[api_address]:[porta]/swagger/index.html` para ver a documentação interativa da API.

## Tecnologias

- **Golang** com framework **Gin**
- **PostgreSQL** para banco de dados
- **AWS SDK for Go v2** para comunicação com Backblaze B2
- **JWT** para autenticação
- **Swagger** para documentação

## Deploy
### push na branch main
- GitHub Actions builda e publica automaticamente na latest
```git
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

### Com tag de versão
```git
git tag v1.1.0
git push origin v1.1.0
```