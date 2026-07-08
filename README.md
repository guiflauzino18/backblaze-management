# B2 Management API

API para gerenciamento de armazenamento Backblaze B2 usando a API S3.

## Configuração

- criar pasta no servidor:

``` mkdir /b2-management```
- Clone o projeto
```bash
git clone [link]
```
- Ajuste o arquivo .env
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