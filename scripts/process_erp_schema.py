import pandas as pd

def process_schema_and_generate_mapping(csv_path, output_md_path):
    df = pd.read_csv(csv_path)

    # Group columns by inferred table name
    # Assuming table names are implicitly present in the context of the original request
    # and that the CSV contains all columns for doctos, nfenotas, and pedido.
    # This is a simplification as the CSV doesn't explicitly state the table for each column.
    # I'll assume the order of columns in the CSV corresponds to the order of tables requested:
    # doctos, nfenotas, pedido. This is a critical assumption.

    # Based on the previous output, the CSV contains all columns from the three tables combined.
    # I need to manually separate them based on common prefixes or knowledge of ERP schemas.
    # This is a heuristic approach.

    doctos_cols = df[df['column_name'].str.startswith('not') | df['column_name'].isin(['controle', 'ccusto', 'operacao', 'nostelef', 'notcodac'])]
    nfenotas_cols = df[df['column_name'].str.startswith('nos') | df['column_name'].isin(['nostransp', 'nostiptra', 'nosplaca', 'nosufplaca', 'nosmotori', 'nostredesp', 'noscidpla'])]
    pedido_cols = df[df['column_name'].str.startswith('ped') | df['column_name'].isin(['notpedido', 'notclifor', 'notconnome'])] # 'notpedido', 'notclifor', 'notconnome' are likely in 'doctos' too, but also relevant for 'pedido'

    # Refine separation - some columns might appear in multiple contexts or be miscategorized by prefix alone
    # For instance, 'notpedido' is likely in 'doctos' and 'pedido'.
    # 'notclifor' and 'notconnome' are likely in 'doctos' and related to client info.
    # Let's re-evaluate based on the full list of columns provided in the CSV and the original request.

    # Re-parsing the CSV output to manually assign columns to tables based on common ERP patterns
    # This is a more robust approach given the lack of explicit table names in the CSV.
    all_columns = df['column_name'].tolist()

    doctos_columns = [
        'controle', 'notdocto', 'notserie', 'notdata', 'notentrada', 'notdtdigit', 'nothrdigit', 'notdepori', 'notdepdes',
        'ccusto', 'notvltotal', 'notvlipi', 'notvlicms', 'notvloutra', 'notvldesco', 'notvlsubst', 'notvlsegur', 'notvlfrete',
        'notespecie', 'planoc', 'notvlprod', 'noticmfre', 'notpedido', 'notobsfisc', 'nostelef', 'notcondica', 'notconnome',
        'notordcmp', 'vollcacod', 'notcotmoe2', 'notpinss', 'notvlinss', 'notpissqn', 'notvlissqn', 'notatpf', 'notalvlic',
        'notperfre', 'notfreemb', 'notvlcred', 'notordcomp', 'notensai', 'notassist', 'notstit', 'nottabpre', 'notembar',
        'notcidissq', 'notcidisno', 'notairrf', 'notvirrf', 'notbssubst', 'notprsubst', 'notvlnirrf', 'notvlninss', 'notvlnissq',
        'notvlbsins', 'notvlbsiss', 'notperinss', 'notperissq', 'notvlrnov', 'notsomicms', 'notrespos', 'nosempant',
        'notvldific', 'volqtdini', 'volqtdfin', 'notdesdesc', 'notcodac', 'notmodelo', 'notcrt', 'notclifor'
    ]

    nfenotas_columns = [
        'nosemprua', 'noscidade', 'nosbairro', 'noscep', 'nosendcob', 'noscidcob', 'noscepcob', 'nosempcgc', 'nosempinse',
        'nostransp', 'nostiptra', 'nosplaca', 'nosufplaca', 'nosmotori', 'nostredesp', 'vollcaseq', 'nosbaicob', 'noscidpla',
        'nosdbasev', 'nosendcomp', 'noscobcomp'
    ]

    pedido_columns = [
        'notpedido', # Assuming 'notpedido' is the primary key or a key field in 'pedido' table
        # Other pedido-specific columns would go here if available and distinct from doctos
    ]

    # Filter the DataFrame for each table based on the identified columns
    doctos_df = df[df['column_name'].isin(doctos_columns)]
    nfenotas_df = df[df['column_name'].isin(nfenotas_columns)]
    pedido_df = df[df['column_name'].isin(pedido_columns)]

    with open(output_md_path, 'w') as f:
        f.write("# MAPEAMENTO_BANCO.md - Diagnóstico do Banco de Dados ERP\n\n")
        f.write("Este documento detalha a estrutura das tabelas `doctos`, `nfenotas` e `pedido` do banco de dados ERP, identificando colunas, tipos de dados, chaves primárias, relacionamentos e campos relevantes para o sistema logístico.\n\n")
        f.write("**Observação Importante:** As chaves primárias e relacionamentos foram inferidos com base em convenções de nomenclatura e contexto de ERP. A confirmação com o DBA do sistema ERP é crucial.\n\n")

        # Doctos Table
        f.write("## Tabela: `doctos`\n\n")
        f.write("Provavelmente contém informações gerais sobre as notas fiscais e pedidos.\n\n")
        f.write("### Colunas e Tipos de Dados\n\n")
        f.write(doctos_df.to_markdown(index=False)) # Use to_markdown for nice table output
        f.write("\n\n")

        f.write("### Chaves Primárias (Inferidas)\n")
        f.write("- `controle` (provável chave primária)\n")
        f.write("- `notdocto`, `notserie` (possível chave primária composta)\n\n")

        f.write("### Relacionamentos (Inferidos)\n")
        f.write("- `notpedido`: Relaciona-se com a tabela `pedido` (número do pedido).\n")
        f.write("- `notclifor`: Possível chave estrangeira para uma tabela de clientes/fornecedores.\n\n")

        f.write("### Campos Relevantes para o Sistema Logístico\n")
        f.write("- **Número do Pedido:** `notpedido` (integer)\n")
        f.write("- **Chave de Acesso da NF-e:** `notcodac` (character varying, 44)\n")
        f.write("- **Nome do Cliente:** `notconnome` (character, 20)\n")
        f.write("- **Telefone/WhatsApp do Cliente:** `nostelef` (character, 14)\n")
        f.write("- **Código Cliente/Fornecedor:** `notclifor` (integer)\n\n")

        # Nfenotas Table
        f.write("## Tabela: `nfenotas`\n\n")
        f.write("Provavelmente contém informações de endereço relacionadas às notas fiscais.\n\n")
        f.write("### Colunas e Tipos de Dados\n\n")
        f.write(nfenotas_df.to_markdown(index=False))
        f.write("\n\n")

        f.write("### Chaves Primárias (Inferidas)\n")
        f.write("- Não é possível inferir diretamente sem um campo de ID claro. Pode ser uma chave estrangeira composta de `notdocto` e `notserie` da tabela `doctos`.\n\n")

        f.write("### Relacionamentos (Inferidos)\n")
        f.write("- Provavelmente relacionada à tabela `doctos` por campos como número da nota ou ID interno.\n\n")

        f.write("### Campos de Endereço Relevantes para o Sistema Logístico\n")
        f.write("- **Rua:** `nosemprua` (character, 60)\n")
        f.write("- **Cidade:** `noscidade` (integer) ou `noscidpla` (character, 30) - `noscidade` parece ser um ID, `noscidpla` o nome da cidade.\n")
        f.write("- **Bairro:** `nosbairro` (character, 20)\n")
        f.write("- **CEP:** `noscep` (character, 9)\n")
        f.write("- **Endereço Completo:** `nosendcomp` (character, 60) - se existir e for o endereço formatado.\n")
        f.write("- **Complemento:** Não identificado um campo explícito, pode estar em `nosemprua` ou `nosendcomp` se for um campo de texto livre.\n\n")

        # Pedido Table
        f.write("## Tabela: `pedido`\n\n")
        f.write("Provavelmente contém informações detalhadas sobre os pedidos.\n\n")
        f.write("### Colunas e Tipos de Dados\n\n")
        if not pedido_df.empty:
            f.write(pedido_df.to_markdown(index=False))
        else:
            f.write("Não foram identificadas colunas exclusivas para a tabela `pedido` no CSV fornecido, além de `notpedido` que já foi mapeado em `doctos`. É provável que `notpedido` seja a chave primária aqui e que a maioria dos dados do pedido estejam na tabela `doctos` ou em outras tabelas relacionadas.\n")
        f.write("\n\n")

        f.write("### Chaves Primárias (Inferidas)\n")
        f.write("- `notpedido` (provável chave primária)\n\n")

        f.write("### Relacionamentos (Inferidos)\n")
        f.write("- Relaciona-se com a tabela `doctos` através de `notpedido`.\n\n")

        f.write("### Campos Relevantes para o Sistema Logístico\n")
        f.write("- **Número do Pedido:** `notpedido` (integer)\n")
        f.write("- **Nome do Cliente:** (Provavelmente em `doctos.notconnome` ou em uma tabela de clientes relacionada via `notclifor`)\n")
        f.write("- **Telefone/WhatsApp do Cliente:** (Provavelmente em `doctos.nostelef` ou em uma tabela de clientes relacionada via `notclifor`)\n\n")

    print(f"MAPEAMENTO_BANCO.md gerado com sucesso em {output_md_path}")

if __name__ == "__main__":
    csv_file = "/home/ubuntu/upload/columns_202605151340.csv"
    output_markdown_file = "/home/ubuntu/MAPEAMENTO_BANCO.md"
    process_schema_and_generate_mapping(csv_file, output_markdown_file)
