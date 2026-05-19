def generate_pedido_diagnosis_query():
    query = """-- Informações da tabela: pedido
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'pedido';
"""
    return query

if __name__ == "__main__":
    sql_query = generate_pedido_diagnosis_query()
    output_file = 'sql_diagnostico_pedido.sql'
    with open(output_file, 'w') as f:
        f.write(sql_query)
    print(f"Query SQL de diagnóstico da tabela 'pedido' gerada e salva em {output_file}")
    print("\nPor favor, execute esta query no seu banco de dados PostgreSQL ERP e me forneça os resultados.")
    print("Conexão do banco ERP: HOST: 192.168.1.17, PORTA: 5432, BANCO: salutem, USUÁRIO: postgres, SENHA: usar variável de ambiente DB_PASSWORD")
