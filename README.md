# B2 Management API

API para gerenciamento de armazenamento Backblaze B2 usando a API S3. Também funciona em ambientes da Amazon.

### Dependências:
- Docker Engine
- Docker Compose
- Git
- Liberação das portas 80 e 8080 (ou outra se foi alterada no .env) no firewall ou selinux

## Instalação

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

## Atualização

OBS: FAÇA UM BACKUP DO ARQUIVO .ENV POIS ELE PODE SER SUBSTIRUÍDO.

Siga os passos abaixos para atualizar a aplicação:

1. Acessar a pasta /b2-management e executar o comando abaixo para baixar arquivos atualizados
```git
git pull
```

2. Acessar a pasta deploy/ e executar os comandos abaixo para baixar novas versões das imagens docker
```bash
docker pull
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
- GitHub Actions builda e publica automaticamente na latest quando push na branch main
```git
git add .
git commit -m "feat: nova funcionalidade"
git push origin feat/new_feature
```

- builda e publica na tag correspondente a versão:
```git
git tag [v1.1.x]
git push origin [v1.1.x]
```