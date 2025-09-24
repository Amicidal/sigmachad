import neo4j from "neo4j-driver";
export class Neo4jService {
    constructor(config) {
        this.initialized = false;
        this.config = config;
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            this.driver = neo4j.driver(this.config.uri, neo4j.auth.basic(this.config.username, this.config.password), {
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 60000,
                maxTransactionRetryTime: 30000,
            });
            // Test Neo4j connection
            const session = this.driver.session();
            try {
                await session.run("RETURN 1");
                this.initialized = true;
                console.log("✅ Neo4j connection established");
            }
            finally {
                await session.close();
            }
        }
        catch (error) {
            console.error("❌ Neo4j initialization failed:", error);
            throw error;
        }
    }
    async close() {
        if (this.driver) {
            await this.driver.close();
        }
        this.initialized = false;
    }
    isInitialized() {
        return this.initialized;
    }
    getDriver() {
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        return this.driver;
    }
    async query(cypher, params = {}, options) {
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        const session = this.driver.session({
            database: (options === null || options === void 0 ? void 0 : options.database) || this.config.database || "neo4j",
        });
        try {
            const result = await session.run(cypher, params);
            return result;
        }
        finally {
            await session.close();
        }
    }
    async transaction(callback, options) {
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        const session = this.driver.session({
            database: (options === null || options === void 0 ? void 0 : options.database) || this.config.database || "neo4j",
        });
        try {
            return await session.executeWrite(callback);
        }
        finally {
            await session.close();
        }
    }
    async setupGraph() {
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        const session = this.driver.session();
        try {
            // Create constraints for unique IDs
            const constraints = [
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Function) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Class) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Module) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Interface) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Type) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Variable) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Enum) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Parameter) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Property) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Method) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Constructor) REQUIRE n.id IS UNIQUE",
            ];
            for (const constraint of constraints) {
                await session.run(constraint);
            }
            // Create indexes for common queries
            const indexes = [
                "CREATE INDEX IF NOT EXISTS FOR (n:Entity) ON (n.name)",
                "CREATE INDEX IF NOT EXISTS FOR (n:Entity) ON (n.path)",
                "CREATE INDEX IF NOT EXISTS FOR (n:Entity) ON (n.type)",
                "CREATE INDEX IF NOT EXISTS FOR (n:Entity) ON (n.timestamp)",
            ];
            for (const index of indexes) {
                await session.run(index);
            }
            console.log("✅ Neo4j graph constraints and indexes created");
        }
        finally {
            await session.close();
        }
    }
    async setupVectorIndexes() {
        var _a;
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        const session = this.driver.session();
        try {
            // Create vector indexes for different embedding types
            const vectorIndexes = [
                {
                    name: "code_embeddings",
                    query: `
            CREATE VECTOR INDEX code_embeddings IF NOT EXISTS
            FOR (n:CodeEmbedding)
            ON (n.embedding)
            OPTIONS {indexConfig: {
              \`vector.dimensions\`: 1536,
              \`vector.similarity_function\`: 'cosine'
            }}
          `,
                },
                {
                    name: "documentation_embeddings",
                    query: `
            CREATE VECTOR INDEX documentation_embeddings IF NOT EXISTS
            FOR (n:DocEmbedding)
            ON (n.embedding)
            OPTIONS {indexConfig: {
              \`vector.dimensions\`: 1536,
              \`vector.similarity_function\`: 'cosine'
            }}
          `,
                },
                {
                    name: "integration_test_embeddings",
                    query: `
            CREATE VECTOR INDEX integration_test_embeddings IF NOT EXISTS
            FOR (n:TestEmbedding)
            ON (n.embedding)
            OPTIONS {indexConfig: {
              \`vector.dimensions\`: 1536,
              \`vector.similarity_function\`: 'cosine'
            }}
          `,
                },
            ];
            for (const index of vectorIndexes) {
                try {
                    await session.run(index.query);
                    console.log(`✅ Vector index ${index.name} created`);
                }
                catch (error) {
                    if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("already exists")) {
                        console.log(`📊 Vector index ${index.name} already exists`);
                    }
                    else {
                        throw error;
                    }
                }
            }
        }
        finally {
            await session.close();
        }
    }
    async upsertVector(collection, id, vector, metadata = {}) {
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        const labelMap = {
            code_embeddings: "CodeEmbedding",
            documentation_embeddings: "DocEmbedding",
            integration_test: "TestEmbedding",
        };
        const label = labelMap[collection] || "Embedding";
        const session = this.driver.session();
        try {
            await session.run(`
        MERGE (n:${label} {id: $id})
        SET n.embedding = $vector,
            n.metadata = $metadata,
            n.updatedAt = datetime()
        `, {
                id,
                vector,
                metadata: JSON.stringify(metadata),
            });
        }
        finally {
            await session.close();
        }
    }
    async searchVector(collection, vector, limit = 10, filter) {
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        const labelMap = {
            code_embeddings: "CodeEmbedding",
            documentation_embeddings: "DocEmbedding",
            integration_test: "TestEmbedding",
        };
        const label = labelMap[collection] || "Embedding";
        const indexMap = {
            code_embeddings: "code_embeddings",
            documentation_embeddings: "documentation_embeddings",
            integration_test: "integration_test_embeddings",
        };
        const indexName = indexMap[collection] || "code_embeddings";
        let filterClause = "";
        if (filter) {
            const filterConditions = Object.entries(filter)
                .map(([key, value]) => {
                if (typeof value === "string") {
                    return `n.metadata CONTAINS '"${key}":"${value}"'`;
                }
                return `n.metadata CONTAINS '"${key}":${value}'`;
            })
                .join(" AND ");
            if (filterConditions) {
                filterClause = `WHERE ${filterConditions}`;
            }
        }
        const session = this.driver.session();
        try {
            const result = await session.run(`
        CALL db.index.vector.queryNodes($indexName, $limit, $vector)
        YIELD node, score
        ${filterClause}
        RETURN node.id AS id, score, node.metadata AS metadata
        ORDER BY score DESC
        LIMIT $limit
        `, {
                indexName,
                vector,
                limit,
            });
            return result.records.map((record) => ({
                id: record.get("id"),
                score: record.get("score"),
                metadata: record.get("metadata")
                    ? JSON.parse(record.get("metadata"))
                    : undefined,
            }));
        }
        finally {
            await session.close();
        }
    }
    async deleteVector(collection, id) {
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        const labelMap = {
            code_embeddings: "CodeEmbedding",
            documentation_embeddings: "DocEmbedding",
            integration_test: "TestEmbedding",
        };
        const label = labelMap[collection] || "Embedding";
        const session = this.driver.session();
        try {
            await session.run(`
        MATCH (n:${label} {id: $id})
        DELETE n
        `, { id });
        }
        finally {
            await session.close();
        }
    }
    async scrollVectors(collection, limit = 100, offset = 0) {
        if (!this.initialized) {
            throw new Error("Neo4j not initialized");
        }
        const labelMap = {
            code_embeddings: "CodeEmbedding",
            documentation_embeddings: "DocEmbedding",
            integration_test: "TestEmbedding",
        };
        const label = labelMap[collection] || "Embedding";
        const session = this.driver.session();
        try {
            // Get total count
            const countResult = await session.run(`MATCH (n:${label}) RETURN count(n) AS total`);
            const total = countResult.records[0].get("total").toNumber();
            // Get paginated results
            const result = await session.run(`
        MATCH (n:${label})
        RETURN n.id AS id, n.embedding AS vector, n.metadata AS metadata
        ORDER BY n.id
        SKIP $offset
        LIMIT $limit
        `, { offset, limit });
            const points = result.records.map((record) => ({
                id: record.get("id"),
                vector: record.get("vector"),
                metadata: record.get("metadata")
                    ? JSON.parse(record.get("metadata"))
                    : undefined,
            }));
            return { points, total };
        }
        finally {
            await session.close();
        }
    }
    async healthCheck() {
        if (!this.initialized) {
            return false;
        }
        const session = this.driver.session();
        try {
            await session.run("RETURN 1");
            return true;
        }
        catch (_a) {
            return false;
        }
        finally {
            await session.close();
        }
    }
    async command(...args) {
        // For compatibility with FalkorDB command interface
        // Parse the command type and execute appropriate Neo4j operation
        const [command, ...params] = args;
        switch (command) {
            case "GRAPH.QUERY": {
                const [database, cypher, ...queryParams] = params;
                const paramObj = queryParams.length > 0 ? queryParams[0] : {};
                return this.query(cypher, paramObj, { database });
            }
            case "GRAPH.DELETE": {
                const [database] = params;
                const session = this.driver.session({ database });
                try {
                    await session.run("MATCH (n) DETACH DELETE n");
                    return { success: true };
                }
                finally {
                    await session.close();
                }
            }
            default:
                throw new Error(`Unsupported command: ${command}`);
        }
    }
}
//# sourceMappingURL=Neo4jService.js.map