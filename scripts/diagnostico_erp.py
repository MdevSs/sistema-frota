import os

def generate_sql_queries(tables):
    queries = []
    for table in tables:
        # Query para listar colunas e tipos de dados
        queries.append(f"""-- Informações da tabela: {table}
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = '{table}';
""")

        # Query para identificar chaves primárias
        queries.append(f"""-- Chaves primárias da tabela: {table}
SELECT
    a.attname AS column_name
FROM
    pg_index i
JOIN
    pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE
    i.indrelid = '{table}'::regclass AND i.indisprimary;
""")

        # Query para identificar relacionamentos (chaves estrangeiras) - pode ser mais complexo e requer suposições
        queries.append(f"""-- Chaves estrangeiras da tabela: {table}
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
JOIN
    information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN
    information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '{table}';
""")
    return queries

if __name__ == "__main__":
    erp_tables = ['doctos', 'nfenotas', 'pedido']
    sql_queries = generate_sql_queries(erp_tables)

    output_file = 'sql_diagnostico_erp.sql'
    with open(output_file, 'w') as f:
        for query in sql_queries:
            f.write(query + '\n')
    print(f"Queries SQL geradas e salvas em {output_file}")

    print("\nPor favor, execute estas queries no seu banco de dados PostgreSQL ERP e me forneça os resultados para que eu possa criar o MAPEAMENTO_BANCO.md.")
    print("Conexão do banco ERP: HOST: 192.168.1.17, PORTA: 5432, BANCO: salutem, USUÁRIO: postgres, SENHA: usar variável de ambiente DB_PASSWORD")
