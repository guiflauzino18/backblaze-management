# Usuários
- Implementação do crud de usuários. Criar, editar, deletar (soft delete).
- Busca por nome, id, login.
- Roles

### Dados para cadastrar o usuário:
- Nome
- Sobrenome
- Email
- password (criptografada)
- Role
- Gênero
- avatar (Podemos usar Curling AI para imagens dinamicas com base no genero)

Fazer seed de um usuário padrão: admin com senha sysadmin!

# Roles
Vamos deixar algumas roles prontas para controlar o acesso.
- Admin: Acesso full ao sistema
- User: Somente visualizar dados. Não pode cadastrar nem editar

# Auntenticação
Usuários logam no sistema com email e senha. É gerado token de autenticação para uso nas demais requisições.

- Vamos usar JWT
- Opção de refresh token
- Tokens expiram em 8 horas
