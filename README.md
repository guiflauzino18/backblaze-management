# B2 Management API

API para gerenciamento de armazenamento Backblaze B2 usando a API S3. Também funciona em ambientes da Amazon.

## Configuração

- criar pasta no servidor:

``` mkdir /b2-management```
- Clone o projeto
```bash
git clone https://github.com/guiflauzino18/backblaze-management.git .
```
- Ajuste o arquivo .env dentro da pasta deploy
- Execute o comando abaixo:
```bash
cd /b2-management/deploy/
docker compose pull
docker compose up -d
```

### Acesso
- Aplicação possui um usuário padrão que deve ser desativado logo após a criação de um novo usuário adm.
- usuario: `admin@b2management.com`
- senha: `sysadmin`

### Roles

- **admin**: Acesso total (pode criar/deletar buckets, fazer upload/download, modificar lifecycle)
- **user**: Apenas leitura (pode listar buckets, objetos, versões, lifecycle e métricas)

## Documentação Swagger

Acesse `http://[api_address]:[porta]/swagger/index.html` para ver a documentação interativa da API.

## Tecnologias

- **Golang** com framework **Gin**
- **PostgreSQL** para banco de dados
- **AWS SDK for Go v2** para comunicação AWS
- **JWT** para autenticação
- **Swagger** para documentação

## Deploy
- GitHub Actions builda e publica automaticamente na latest e com a tag da versão ao abrir PR na main.
```git
git add .
git commit -m "feat: nova funcionalidade"
git tag [v1.1.x]
git push origin [v1.1.x]
git push origin feat/new_feature
```