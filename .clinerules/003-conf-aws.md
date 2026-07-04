# Configurações de Acesso AWS
Vamos realizar as configurações para comunicação com a backblaze utilizando a APi da AWS.

### Autenticação
- A autenticação será feito via access-key e secret-key e terá um endpoint
- Criar conf AWS para armazenar esses parâmetros que serão configurados  via variáveis de ambiente.

### Request
- As requests serão: listar buckets, listar objetos e suas versões, deletar buckets e objetos, ver regras de lifecycle, enviar regras de lifecycle, ver uso (e GB ou GM por exemplo) e quantidade ed objetos.

- Também será feito download e upload de arquivos. 
- Levar em consideração a role do usuário para verificar se é autorizado a fazer.

