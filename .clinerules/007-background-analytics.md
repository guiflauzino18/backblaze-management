# Dados analíticos

Buscar os dados dos buckets como tamanho e quantidade de objetos ao abrir a página de dashboard ou de buckets fica inviável pois dependendo do tamanho do bucket pode levar um tempo para trazer os resultados. Por isso vamos utilizar a seguinte estratégia:

- Uma go routine na api que busca os dados na backblaze e armazena no banco.
- Ao abrir a página de dashboard ou de buckets os dados como quantidade de objetos, tamanho do bucket e demais informações serão carrregadas do banco.
- O tempo entre cada busca deverá ser configurável via variável de ambiente no docker e terá um valor padrão de 4 horas.
- VAmos usar o padrão workerpool com quantidade de workers tambem configurável via variável de ambiente e por padrão usará 4 workers. Cada worker processa um bucket.