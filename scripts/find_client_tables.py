def generate_client_table_discovery_queries():
    queries = []

    # Query para listar todas as tabelas no schema public
    queries.append("""-- Listar todas as tabelas no schema public
SELECT
    table_name
FROM
    information_schema.tables
WHERE
    table_schema = 'public'
ORDER BY
    table_name;
""")

    # Palavras-chave para buscar tabelas de clientes/fornecedores
    keywords = [
        'cliente', 'clientes', 'clifor', 'fornecedor', 'fornecedores',
        'cadastro', 'entidade', 'pessoa', 'pessoas'
    ]

    for keyword in keywords:
        # Query para listar colunas de tabelas que contenham a palavra-chave no nome
        queries.append(f"""-- Listar colunas de tabelas com '{keyword}' no nome
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length
FROM
    information_schema.tables t
JOIN
    information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE
    t.table_schema = 'public' AND t.table_name ILIKE '%{keyword}%'
ORDER BY
    t.table_name, c.column_name;
""")

    # Query para buscar colunas que possam se relacionar com doctos.notclifor
    # Procurar por colunas com nomes como 'id', 'codigo', 'clifor', 'cliente', 'fornecedor' em outras tabelas
    related_column_keywords = [
        'id', 'codigo', 'cod', 'clifor', 'cliente', 'fornecedor', 'cnpj', 'cpf'
    ]

    queries.append("""-- Buscar colunas que possam se relacionar com doctos.notclifor
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND (
        column_name ILIKE '%id%' OR
        column_name ILIKE '%codigo%' OR
        column_name ILIKE '%cod%' OR
        column_name ILIKE '%clifor%' OR
        column_name ILIKE '%cliente%' OR
        column_name ILIKE '%fornecedor%' OR
        column_name ILIKE '%cnpj%' OR
        column_name ILIKE '%cpf%'
    )
ORDER BY
    table_name, column_name;
""")

    return queries

if __name__ == "__main__":
    sql_queries = generate_client_table_discovery_queries()

    output_file = 'sql_find_client_tables.sql'
    with open(output_file, 'w') as f:
        for query in sql_queries:
            f.write(query + '\n\n')
    print(f"Queries SQL para encontrar tabelas de clientes geradas e salvas em {output_file}")
    print("\nPor favor, execute estas queries no seu banco de dados PostgreSQL ERP e me forneça os resultados.")
