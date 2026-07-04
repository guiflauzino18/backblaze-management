# implementação da interface web para buckets e objetos


Agora planeje a implementação da parte web desta etapa. Já temos o menu bucket na sidebar. Nele vamos listar os buckets em cards. 

### Layout

- Cada card terá o nome, um icone, tamanho e quantidade de objetos.
- Também terá um menu com as opções deletar e entrar. 
- Deletar irá deletar o bucket (exibir somente se role for admin)
- Entrar abrirá um modal com os objetos deste bucket. 
- O card também será clicável e terá a mesma função da opção Entrar do menu.

### Entrar
- Ao clicar no card do bucket ou ir na opção entrar será aberto um modal com os objetos. Não exibir todos os objetos de uma vez. Separar por diretórios e ir clicando para ir entrando na árvore. 

- Adicione um breadcrum conforme for abrindo os diretórios para poder clicar no diretorio e ir direto para ele.

- Quando clicar em um objeto um novo modal será aberto exibindo as versões deste ojeto. e opçoes para download e deleção de cada versão. O objeto atual tambem terá opção para download e exclusão.

- Lembrando que essas ações só poderão ser exibidas se a role for admin. User somente poderá visualizar.