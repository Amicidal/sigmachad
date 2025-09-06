import { QdrantClient } from "@qdrant/js-client-rest";
import { IQdrantService } from "./interfaces";

export class QdrantService implements IQdrantService {
  private qdrantClient!: QdrantClient;
  private initialized = false;
  private config: { url: string; apiKey?: string };

  constructor(config: { url: string; apiKey?: string }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.qdrantClient = new QdrantClient({
        url: this.config.url,
        apiKey: this.config.apiKey,
      });

      // Test Qdrant connection
      await this.qdrantClient.getCollections();
      this.initialized = true;
      console.log("✅ Qdrant connection established");
    } catch (error) {
      console.error("❌ Qdrant initialization failed:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Qdrant client doesn't have a close method, but we can mark as not initialized
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient(): QdrantClient {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }
    return this.qdrantClient;
  }

  async setupCollections(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }

    try {
      // Create collections if they don't exist
      const collections = await this.qdrantClient.getCollections();
      if (!collections || !collections.collections) {
        throw new Error("Invalid collections response from Qdrant");
      }
      const existingCollections = collections.collections.map((c) => c.name);

      if (!existingCollections.includes("code_embeddings")) {
        await this.qdrantClient.createCollection("code_embeddings", {
          vectors: {
            size: 1536, // OpenAI Ada-002 dimensions
            distance: "Cosine",
          },
        });
      }

      // Create documentation_embeddings collection
      if (!existingCollections.includes("documentation_embeddings")) {
        try {
          await this.qdrantClient.createCollection("documentation_embeddings", {
            vectors: {
              size: 1536,
              distance: "Cosine",
            },
          });
        } catch (error: any) {
          if (
            error.status === 409 ||
            error.message?.includes("already exists")
          ) {
            console.log(
              "📊 documentation_embeddings collection already exists, skipping creation"
            );
          } else {
            throw error;
          }
        }
      }

      // Create integration_test collection
      if (!existingCollections.includes("integration_test")) {
        try {
          await this.qdrantClient.createCollection("integration_test", {
            vectors: {
              size: 1536,
              distance: "Cosine",
            },
          });
        } catch (error: any) {
          if (
            error.status === 409 ||
            error.message?.includes("already exists")
          ) {
            console.log(
              "📊 integration_test collection already exists, skipping creation"
            );
          } else {
            throw error;
          }
        }
      }

      console.log("✅ Qdrant collections setup complete");
    } catch (error) {
      console.error("❌ Qdrant setup failed:", error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized || !this.qdrantClient) {
      return false;
    }

    try {
      // Check if Qdrant is accessible by attempting to get collection info
      await this.qdrantClient.getCollections();
      return true;
    } catch (error) {
      console.error("Qdrant health check failed:", error);
      return false;
    }
  }
}
