# Exibir e alterar configurações

Na página de buckets vamos adicionar a opção de abrir a configuração de lifecycle do bucket.

### Implementação
- Na tela de buckets acima da opção de entrar no meu vamos adicionar uma nova opção - Lifeycle
- Quando clicado será aberto um novo modal com as configurações atuais de lifecycle deste bucket.
- As opções serão em um form que poderão ser editadas e quando salvar enviar esta nova configuração ao bucket.

### Modal
O modal conterá as informações de lifecycle: Se está ativo e se estiver quais as opções estão configuradas.

### Ao salvar
Ao salvar as novas configurações elas serão enviadas ao bucket. Se for sucesso exibit Toast de sucesso. Do contrario Toast de erro.