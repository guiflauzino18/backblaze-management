# Logs e Relatórios

Vamos criar uma página com logs e relatórios. A idéia é que no servidor que envia arquivos para a backblaze ao finalizar enviar os logs com o resultados da execução do processo para a API.

### Endpoint
Um endpoint é uma estação que envia arquivos para a backblaze. É utilizado a cli da AWS e os logs são salvos em um arquivo de log. O exit code tambem é salvo neste arquivo. 

### Proposta
- Nova role chamada endpoint
- Opção de token de API que não expira vinculado a um usuário com role endpoint
- Criar uma rota na API que recebe uma requisição dos logs enviados pelo endpoint
- Esta rota terá permissão somente para a role endpoint e admin
- A requisição terá o bucket, os logs e o exit code (0 = suceesso) da execução
- Nova tabela para armazenar os logs recebidos por bucket
- Authorization com token criado para autenticar
- Página de relatórios com estado de cada resultado enviado pelo endpoint e seus logs

### Tratativas
- Retornar erro se bucket não existir na requisição
- Retornar sucesso caso Authorization e bucket estejam corretos

### Análise
- É uma boa opção armazenar os logs no postgres ou uma alternativa melhor?
- Opção para configurar quantidade de dias a manter os logs recebidos. Via variável de ambiente com padrão 7 dias ? Via painel de configuração web?
- Limpar logs após quantidades de dias definidos.