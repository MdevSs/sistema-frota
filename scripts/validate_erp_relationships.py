import os

def generate_validation_queries():
    queries = []

    # 1. Validar relacionamento: doctos.notpedido = pedido.pedido
    queries.append("""-- Validação de relacionamento: doctos.notpedido = pedido.pedido
-- Este relacionamento é inferido pelo ERP, não por FKs de banco de dados.
SELECT
    d.notpedido AS doctos_notpedido,
    p.pedido AS pedido_pedido
FROM
    doctos d
JOIN
    pedido p ON d.notpedido = p.pedido
LIMIT 10;
""")

    # 2. Validar relacionamento doctos com nfenotas usando notcodac
    queries.append("""-- Validação de relacionamento: doctos.notcodac = nfenotas.nfencodac (Chave de Acesso NF-e)
-- Este relacionamento é inferido pelo ERP, não por FKs de banco de dados.
SELECT
    d.notcodac AS doctos_notcodac,
    n.nfencodac AS nfenotas_nfencodac
FROM
    doctos d
JOIN
    nfenotas n ON d.notcodac = n.nfencodac
LIMIT 10;
""")

    # 3. Validar relacionamento doctos com nfenotas usando notdocto e notserie
    queries.append("""-- Validação de relacionamento: doctos.notdocto + doctos.notserie = nfenotas.nfennrnot + nfenotas.nfenserie (Número e Série da Nota)
-- Este relacionamento é inferido pelo ERP, não por FKs de banco de dados.
SELECT
    d.notdocto AS doctos_notdocto,
    d.notserie AS doctos_notserie,
    n.nfennrnot AS nfenotas_nfennrnot,
    n.nfenserie AS nfenotas_nfenserie
FROM
    doctos d
JOIN
    nfenotas n ON d.notdocto = CAST(n.nfennrnot AS character(8)) AND d.notserie = CAST(n.nfenserie AS character(3))
LIMIT 10;
""")

    # 4. Validar relacionamento doctos.notclifor com uma possível tabela de clientes
    queries.append("""-- Validação de relacionamento: doctos.notclifor = clientes.id (assumindo tabela clientes e campo id)
-- Esta query é hipotética e precisa de uma tabela de clientes real para ser executada.
-- Se houver uma tabela de clientes, substitua 'clientes' e 'id' pelos nomes corretos.
SELECT
    d.notclifor AS doctos_notclifor,
    c.id AS clientes_id -- Assumindo que existe uma tabela 'clientes' com um campo 'id'
FROM
    doctos d
LEFT JOIN
    clientes c ON d.notclifor = c.id
WHERE c.id IS NOT NULL
LIMIT 10;
""")

    # 5. Query de teste: Buscar informações completas de um pedido (substitua 'XXXX' pelo número do pedido)
    queries.append("""-- Query de teste: Buscar informações completas de um pedido (substitua 'XXXX' pelo número do pedido)
SELECT
    d.notpedido AS numero_pedido,
    d.notdocto AS numero_nota,
    d.notserie AS serie_nota,
    d.notcodac AS chave_acesso_nf_e,
    d.notconnome AS nome_cliente,
    COALESCE(d.nostelef, p.pedfone) AS telefone_cliente, -- Prioriza telefone de doctos, se não, usa de pedido
    n.nfennrnot AS nfenotas_numero_nota, -- Adicionado para clareza
    n.nfenserie AS nfenotas_serie_nota,  -- Adicionado para clareza
    n.nfencodac AS nfenotas_chave_acesso, -- Adicionado para clareza
    n.nfenlogde AS rua, -- Assumindo que nfenlogde é a rua de destino
    n.nfenbaide AS bairro, -- Assumindo que nfenbaide é o bairro de destino
    n.nfennomud AS cidade, -- Assumindo que nfennomud é o nome da cidade de destino
    CAST(n.nfencepde AS character(9)) AS cep, -- Assumindo que nfencepde é o CEP de destino
    n.nfenlogde || ', ' || n.nfencomde || ' - ' || n.nfenbaide || ', ' || n.nfennomud || ' - ' || n.nfenufdes || ' CEP: ' || CAST(n.nfencepde AS character(9)) AS endereco_completo -- Construindo endereço completo
FROM
    doctos d
LEFT JOIN
    nfenotas n ON d.notcodac = n.nfencodac -- Tentativa de join principal por chave de acesso
LEFT JOIN
    pedido p ON d.notpedido = p.pedido
WHERE
    d.notpedido = XXXX; -- SUBSTITUA XXXX PELO NÚMERO DO PEDIDO
""")

    return queries

if __name__ == "__main__":
    sql_queries = generate_validation_queries()

    output_file = 'sql_validation_queries.sql'
    with open(output_file, 'w') as f:
        for query in sql_queries:
            f.write(query + '\n\n')
    print(f"Queries SQL de validação geradas e salvas em {output_file}")
    print("\nPor favor, execute estas queries no seu banco de dados PostgreSQL ERP e me forneça os resultados para que eu possa refinar o MAPEAMENTO_BANCO.md.")
    print("Lembre-se de substituir 'XXXX' pelo número do pedido na última query de teste.")
