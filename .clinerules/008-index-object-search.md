# Indexação para busca

Vamos implementar busca de objetos. Realizar a busca diretamente na api da aws consumiria tempo. Portanto vamos abordar a utilização de indexação.

### Proposta
- Buscar e indexar arquivos no banco ( ou de outra forma)
- No modal de objetos adicionar um campo de pesquisa
- Ao pesquisar algo é feito uma busca no banco 
- Ao encontrar o resultado no banco é feito a busca diretamente na aws pela key para trazer o objeto atualizado.
- A exibição do objeto é feito via mesmo card já existente com as opções já configuradas.
- A busca deve contemplar objetos que foram excluídos, portanto buscar tambem por delete markers.

### Recomendação
- Utilizar a busca para analytics e já criar a indexação.