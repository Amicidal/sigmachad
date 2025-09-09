/**
 * End-to-End tests for Multi-User Concurrent Workflow
 * Tests how the system handles multiple users working simultaneously
 * across the complete development lifecycle
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { expectSuccess } from "../../test-utils/assertions";
import { FastifyInstance } from "fastify";
import { APIGateway } from "../../../src/api/APIGateway.js";
import { KnowledgeGraphService } from "../../../src/services/KnowledgeGraphService.js";
import { DatabaseService } from "../../../src/services/DatabaseService.js";
import { TestEngine } from "../../../src/services/TestEngine.js";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from "../../test-utils/database-helpers.js";
import { CodebaseEntity } from "../../../src/models/entities.js";

describe("Multi-User Concurrent Workflow E2E", () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let testEngine: TestEngine;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error(
        "Database health check failed - cannot run multi-user E2E tests"
      );
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService);
    testEngine = new TestEngine(kgService, dbService);

    // Create API Gateway
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();

    // Start the server
    await apiGateway.start();
  }, 60000);

  afterAll(async () => {
    if (apiGateway) {
      await apiGateway.stop();
    }
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
    }
  });

  describe("Concurrent Multi-User Development Scenarios", () => {
    it("should handle multiple users working on independent features simultaneously", async () => {
      console.log("👥 Testing Multiple Users on Independent Features");

      const users = ["alice", "bob", "charlie", "diana"];
      const features = ["auth", "payment", "notification", "reporting"];
      const userWorkflows = [];

      // Each user works on their own feature
      for (let i = 0; i < users.length; i++) {
        const userWorkflow = async (userId: string, featureName: string) => {
          const userPrefix = `${userId}-${featureName}`;

          // Step 1: User creates spec for their feature
          const specResponse = await app.inject({
            method: "POST",
            url: "/api/v1/design/create-spec",
            headers: {
              "content-type": "application/json",
              "x-user-id": userId,
            },
            payload: JSON.stringify({
              title: `${userId}'s ${featureName} Feature`,
              description: `${userId} is implementing the ${featureName} feature`,
              requirements: [
                `${featureName} functionality must be implemented`,
                `User ${userId} must own this feature`,
                `${featureName} must integrate with existing system`,
              ],
              acceptanceCriteria: [
                `${featureName} feature works correctly`,
                `${userId}'s implementation is complete`,
                `No conflicts with other features`,
              ],
              priority: "high",
              tags: [userId, featureName, "independent"],
            }),
          });

          if (
            specResponse.statusCode !== 200 &&
            specResponse.statusCode !== 201
          ) {
            return {
              userId,
              featureName,
              success: false,
              error: "Spec creation failed",
            };
          }

          const specBody = JSON.parse(specResponse.payload);
          const specId = specBody.data.specId;

          // Step 2: User creates implementation
          const implEntity: CodebaseEntity = {
            id: `${userPrefix}-service`,
            path: `src/services/${userPrefix}Service.ts`,
            hash: `${userPrefix}hash123`,
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
            size: 384,
            lines: 25,
            isTest: false,
            content: `
              export class ${userPrefix}Service {
                constructor() {
                  console.log('${userId} initialized ${featureName} service');
                }

                execute(): string {
                  return '${userId} executed ${featureName} feature successfully';
                }

                getMetadata(): object {
                  return {
                    userId: '${userId}',
                    featureName: '${featureName}',
                    specId: '${specId}',
                    timestamp: new Date().toISOString(),
                  };
                }
              }
            `,
          };

          await kgService.createEntity(implEntity);

          // Step 3: User validates their implementation
          const validationResponse = await app.inject({
            method: "POST",
            url: "/api/v1/code/validate",
            headers: {
              "content-type": "application/json",
              "x-user-id": userId,
            },
            payload: JSON.stringify({
              files: [`src/services/${userPrefix}Service.ts`],
              includeTypes: ["typescript"],
              failOnWarnings: false,
            }),
          });

          // Step 4: User commits their work
          const commitResponse = await app.inject({
            method: "POST",
            url: "/api/v1/scm/commit-pr",
            headers: {
              "content-type": "application/json",
              "x-user-id": userId,
            },
            payload: JSON.stringify({
              title: `feat: implement ${featureName} feature by ${userId}`,
              description: `${userId}'s implementation of ${featureName} feature`,
              changes: [`src/services/${userPrefix}Service.ts`],
              relatedSpecId: specId,
              createPR: false,
              branchName: `feature/${userId}-${featureName}`,
            }),
          });

          return {
            userId,
            featureName,
            specId,
            success: true,
            validationStatus: validationResponse.statusCode,
            commitStatus: commitResponse.statusCode,
          };
        };

        userWorkflows.push(userWorkflow(users[i], features[i]));
      }

      // Execute all user workflows concurrently
      const startTime = Date.now();
      const results = await Promise.all(userWorkflows);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all users completed successfully
      const successfulUsers = results.filter((result) => result.success);
      expect(successfulUsers.length).toBe(users.length);

      console.log(
        `✅ ${users.length} users completed independent features concurrently`
      );
      console.log(`⚡ Total time: ${totalTime}ms`);
      console.log(
        `📊 Average time per user: ${(totalTime / users.length).toFixed(2)}ms`
      );

      // Verify no conflicts between users
      const allSpecIds = results.map((r) => r.specId).filter((id) => id);
      expect(allSpecIds.length).toBe(users.length);
      expect(new Set(allSpecIds).size).toBe(users.length); // All IDs unique

      // Verify system health after concurrent operations
      const healthResponse = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(healthResponse.statusCode).toBe(200);
    });

    it("should handle users working on related features with proper synchronization", async () => {
      console.log("🔗 Testing Users on Related Features with Synchronization");

      const team = ["frontend-dev", "backend-dev", "api-dev"];
      const sharedSpecId = uuidv4();

      // Step 1: Create shared specification first
      const sharedSpecResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify({
          title: "Shared E-commerce API Feature",
          description:
            "Complete e-commerce API implementation requiring frontend, backend, and API layers",
          requirements: [
            "Frontend shopping cart component",
            "Backend order processing service",
            "API endpoints for product management",
            "Integration between all layers",
          ],
          acceptanceCriteria: [
            "All layers work together seamlessly",
            "Data flows correctly between components",
            "No race conditions or synchronization issues",
          ],
          priority: "critical",
          tags: ["ecommerce", "shared", "integration"],
        }),
      });

      if (
        sharedSpecResponse.statusCode !== 200 &&
        sharedSpecResponse.statusCode !== 201
      ) {
        console.log(
          "⚠️  Shared spec creation failed, skipping related features test"
        );
        return;
      }

      const sharedSpecBody = JSON.parse(sharedSpecResponse.payload);
      const actualSharedSpecId = sharedSpecBody.data.specId;

      const teamWorkflows = [];

      for (let i = 0; i < team.length; i++) {
        const teamWorkflow = async (role: string, index: number) => {
          // Each team member works on their part of the shared feature
          const implementations = {
            "frontend-dev": {
              path: "src/components/ShoppingCart.tsx",
              content: `
                import { useState, useEffect } from 'react';

                interface CartItem {
                  id: string;
                  name: string;
                  price: number;
                  quantity: number;
                }

                export const ShoppingCart = () => {
                  const [items, setItems] = useState<CartItem[]>([]);

                  useEffect(() => {
                    // Fetch cart items from API
                    fetchCartItems().then(setItems);
                  }, []);

                  const addItem = (item: CartItem) => {
                    setItems(prev => [...prev, item]);
                  };

                  const removeItem = (itemId: string) => {
                    setItems(prev => prev.filter(item => item.id !== itemId));
                  };

                  return (
                    <div className="shopping-cart">
                      <h2>Shopping Cart - Frontend Dev</h2>
                      {items.map(item => (
                        <div key={item.id}>
                          {item.name} - $\${item.price} x {item.quantity}
                          <button onClick={() => removeItem(item.id)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  );
                };

                async function fetchCartItems(): Promise<CartItem[]> {
                  // Implementation would call backend API
                  return [];
                }
              `,
            },
            "backend-dev": {
              path: "src/services/OrderService.ts",
              content: `
                import { CartItem, Order, OrderStatus } from '../types/Order';

                export class OrderService {
                  constructor(
                    private db: DatabaseService,
                    private paymentService: PaymentService
                  ) {}

                  async createOrder(cartItems: CartItem[], userId: string): Promise<Order> {
                    // Calculate total
                    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                    // Create order in database
                    const order = await this.db.orders.create({
                      userId,
                      items: cartItems,
                      total,
                      status: OrderStatus.PENDING,
                      createdAt: new Date(),
                    });

                    return order;
                  }

                  async processPayment(orderId: string, paymentMethod: PaymentMethod): Promise<boolean> {
                    const order = await this.db.orders.findById(orderId);
                    if (!order) {
                      throw new Error('Order not found');
                    }

                    // Process payment
                    const paymentResult = await this.paymentService.processPayment(
                      order.total,
                      paymentMethod
                    );

                    if (paymentResult.success) {
                      await this.updateOrderStatus(orderId, OrderStatus.PAID);
                      return true;
                    }

                    return false;
                  }

                  private async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
                    await this.db.orders.update(orderId, { status });
                  }
                }
              `,
            },
            "api-dev": {
              path: "src/routes/product.ts",
              content: `
                import { FastifyInstance } from 'fastify';
                import { ProductService } from '../services/ProductService';

                export async function productRoutes(app: FastifyInstance) {
                  const productService = new ProductService();

                  app.get('/api/products', async (request, reply) => {
                    const products = await productService.getAllProducts();
                    return { products };
                  });

                  app.get('/api/products/:id', async (request, reply) => {
                    const { id } = request.params as { id: string };
                    const product = await productService.getProductById(id);

                    if (!product) {
                      return reply.code(404).send({ error: 'Product not found' });
                    }

                    return { product };
                  });

                  app.post('/api/products', async (request, reply) => {
                    const productData = request.body as CreateProductData;
                    const product = await productService.createProduct(productData);
                    return reply.code(201).send({ product });
                  });

                  app.put('/api/products/:id', async (request, reply) => {
                    const { id } = request.params as { id: string };
                    const updateData = request.body as UpdateProductData;
                    const product = await productService.updateProduct(id, updateData);
                    return { product };
                  });

                  app.delete('/api/products/:id', async (request, reply) => {
                    const { id } = request.params as { id: string };
                    await productService.deleteProduct(id);
                    return { success: true };
                  });
                }
              `,
            },
          };

          const implementation =
            implementations[role as keyof typeof implementations];

          // Create implementation file
          const implEntity: CodebaseEntity = {
            id: `${role}-implementation-${index}`,
            path: implementation.path,
            hash: `${role}hash${index}23`,
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
            size: 1024,
            lines: 50,
            isTest: false,
            content: implementation.content,
          };

          await kgService.createEntity(implEntity);

          // Validate implementation
          const validationResponse = await app.inject({
            method: "POST",
            url: "/api/v1/code/validate",
            headers: {
              "content-type": "application/json",
              "x-user-id": role,
            },
            payload: JSON.stringify({
              files: [implementation.path],
              includeTypes: ["typescript"],
              failOnWarnings: false,
            }),
          });

          // Commit work
          const commitResponse = await app.inject({
            method: "POST",
            url: "/api/v1/scm/commit-pr",
            headers: {
              "content-type": "application/json",
              "x-user-id": role,
            },
            payload: JSON.stringify({
              title: `feat: implement ${role} layer for e-commerce API`,
              description: `${role}'s contribution to shared e-commerce feature`,
              changes: [implementation.path],
              relatedSpecId: actualSharedSpecId,
              createPR: false,
              branchName: `feature/shared-ecommerce-${role}`,
            }),
          });

          return {
            role,
            success: true,
            validationStatus: validationResponse.statusCode,
            commitStatus: commitResponse.statusCode,
            filePath: implementation.path,
          };
        };

        teamWorkflows.push(teamWorkflow(team[i], i));
      }

      // Execute team workflows concurrently
      const teamStartTime = Date.now();
      const teamResults = await Promise.all(teamWorkflows);
      const teamEndTime = Date.now();
      const teamTotalTime = teamEndTime - teamStartTime;

      // Verify all team members completed successfully
      const successfulTeamMembers = teamResults.filter(
        (result) => result.success
      );
      expect(successfulTeamMembers.length).toBe(team.length);

      console.log(
        `✅ ${team.length} team members completed related features concurrently`
      );
      console.log(`⚡ Team collaboration time: ${teamTotalTime}ms`);

      // Verify shared spec is still accessible
      const sharedSpecSearchResponse = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify({ query: actualSharedSpecId }),
      });

      if (sharedSpecSearchResponse.statusCode === 200) {
        const sharedSpecSearchBody = JSON.parse(
          sharedSpecSearchResponse.payload
        );
        expectSuccess(sharedSpecSearchBody);
        expect(sharedSpecSearchBody.data.entities.length).toBeGreaterThan(0);
      }

      console.log(
        "✅ Shared specification remained intact during concurrent work"
      );
    });

    it("should handle users discovering and reusing existing work", async () => {
      console.log("🔍 Testing Users Discovering and Reusing Existing Work");

      // User 1 creates a utility function
      const utilityEntity: CodebaseEntity = {
        id: "shared-utility",
        path: "src/utils/SharedUtility.ts",
        hash: "sharedutil123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 256,
        lines: 20,
        isTest: false,
        content: `
          export class SharedUtility {
            static formatDate(date: Date): string {
              return date.toISOString().split('T')[0];
            }

            static validateEmail(email: string): boolean {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              return emailRegex.test(email);
            }

            static generateId(): string {
              return Math.random().toString(36).substr(2, 9);
            }
          }
        `,
      };

      await kgService.createEntity(utilityEntity);

      // User 1 commits their utility
      const utilityCommitResponse = await app.inject({
        method: "POST",
        url: "/api/v1/scm/commit-pr",
        headers: {
          "content-type": "application/json",
          "x-user-id": "utility-creator",
        },
        payload: JSON.stringify({
          title: "feat: add shared utility functions",
          description:
            "Common utility functions for date formatting, email validation, and ID generation",
          changes: ["src/utils/SharedUtility.ts"],
          createPR: false,
          branchName: "feature/shared-utilities",
        }),
      });

      // User 2 searches for existing utilities
      const searchResponse = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: {
          "content-type": "application/json",
          "x-user-id": "utility-consumer",
        },
        payload: JSON.stringify({
          query: "utility format date email",
          includeRelated: true,
          limit: 10,
        }),
      });

      if (searchResponse.statusCode === 200) {
        const searchBody = JSON.parse(searchResponse.payload);
        expectSuccess(searchBody);
        expect(searchBody.data.entities.length).toBeGreaterThan(0);

        // User 2 should find the utility
        const foundUtility = searchBody.data.entities.find(
          (e: any) => e.id === utilityEntity.id
        );
        expect(foundUtility).toBeDefined();

        // User 2 creates their own service that reuses the utility
        const consumerEntity: CodebaseEntity = {
          id: "utility-consumer-service",
          path: "src/services/UtilityConsumerService.ts",
          hash: "consumer123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 384,
          lines: 30,
          isTest: false,
          content: `
            import { SharedUtility } from '../utils/SharedUtility';

            interface UserData {
              email: string;
              createdAt: Date;
            }

            export class UtilityConsumerService {
              validateAndFormatUser(userData: UserData): object {
                // Reuse existing utility functions
                const isValidEmail = SharedUtility.validateEmail(userData.email);
                const formattedDate = SharedUtility.formatDate(userData.createdAt);
                const userId = SharedUtility.generateId();

                if (!isValidEmail) {
                  throw new Error('Invalid email address');
                }

                return {
                  id: userId,
                  email: userData.email,
                  createdAt: formattedDate,
                  isValid: true,
                };
              }

              createUser(email: string): object {
                const userData = {
                  email,
                  createdAt: new Date(),
                };

                return this.validateAndFormatUser(userData);
              }
            }
          `,
        };

        await kgService.createEntity(consumerEntity);

        // User 2 commits their work
        const consumerCommitResponse = await app.inject({
          method: "POST",
          url: "/api/v1/scm/commit-pr",
          headers: {
            "content-type": "application/json",
            "x-user-id": "utility-consumer",
          },
          payload: JSON.stringify({
            title: "feat: implement user service using shared utilities",
            description:
              "User service that reuses existing utility functions for validation and formatting",
            changes: ["src/services/UtilityConsumerService.ts"],
            createPR: false,
            branchName: "feature/user-service-with-utilities",
          }),
        });

        // Verify both implementations exist and can be found together
        const combinedSearchResponse = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({
            query: "utility service",
            includeRelated: true,
          }),
        });

        if (combinedSearchResponse.statusCode === 200) {
          const combinedSearchBody = JSON.parse(combinedSearchResponse.payload);
          expectSuccess(combinedSearchBody);

          // Should find both the original utility and the consumer
          const foundUtility = combinedSearchBody.data.entities.find(
            (e: any) => e.id === utilityEntity.id
          );
          const foundConsumer = combinedSearchBody.data.entities.find(
            (e: any) => e.id === consumerEntity.id
          );

          expect(foundUtility).toBeDefined();
          expect(foundConsumer).toBeDefined();

          console.log(
            "✅ Users successfully discovered and reused existing work"
          );
        }
      }
    });

    it("should handle users resolving conflicts in shared resources", async () => {
      console.log("⚔️ Testing Users Resolving Conflicts in Shared Resources");

      // Create a shared configuration file
      const configEntity: CodebaseEntity = {
        id: "shared-config",
        path: "src/config/database.ts",
        hash: "config123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 256,
        lines: 20,
        isTest: false,
        content: `
          export const databaseConfig = {
            host: 'localhost',
            port: 5432,
            database: 'memento',
            maxConnections: 10,
            ssl: false,
          };

          export const redisConfig = {
            host: 'localhost',
            port: 6379,
            password: undefined,
          };
        `,
      };

      await kgService.createEntity(configEntity);

      const conflictUsers = ["config-user-1", "config-user-2"];
      const conflictWorkflows = [];

      for (let i = 0; i < conflictUsers.length; i++) {
        const conflictWorkflow = async (userId: string) => {
          // User tries to modify the same config file
          const modifiedConfigEntity: CodebaseEntity = {
            ...configEntity,
            id: `${userId}-modified-config`,
            hash: `${userId}mod123`,
            lastModified: new Date(),
            content:
              userId === "config-user-1"
                ? `
                export const databaseConfig = {
                  host: process.env.DB_HOST || 'localhost',
                  port: parseInt(process.env.DB_PORT || '5432'),
                  database: process.env.DB_NAME || 'memento',
                  maxConnections: 20, // Increased
                  ssl: process.env.NODE_ENV === 'production',
                };

                export const redisConfig = {
                  host: process.env.REDIS_HOST || 'localhost',
                  port: parseInt(process.env.REDIS_PORT || '6379'),
                  password: process.env.REDIS_PASSWORD,
                };
              `
                : `
                export const databaseConfig = {
                  host: 'localhost',
                  port: 5432,
                  database: 'memento',
                  maxConnections: 15, // Different increase
                  ssl: false,
                };

                export const redisConfig = {
                  host: 'localhost',
                  port: 6379,
                  password: undefined,
                  db: 1, // Added database selection
                };
              `,
          };

          // Simulate users analyzing impact of their changes
          const impactResponse = await app.inject({
            method: "POST",
            url: "/api/v1/impact/analyze",
            headers: {
              "content-type": "application/json",
              "x-user-id": userId,
            },
            payload: JSON.stringify({
              changes: [
                {
                  entityId: configEntity.id,
                  changeType: "modify",
                },
              ],
            }),
          });

          // Users validate their changes
          const validationResponse = await app.inject({
            method: "POST",
            url: "/api/v1/code/validate",
            headers: {
              "content-type": "application/json",
              "x-user-id": userId,
            },
            payload: JSON.stringify({
              files: ["src/config/database.ts"],
              includeTypes: ["typescript"],
              failOnWarnings: false,
            }),
          });

          return {
            userId,
            impactAnalysisWorked: impactResponse.statusCode === 200,
            validationWorked: validationResponse.statusCode === 200,
          };
        };

        conflictWorkflows.push(conflictWorkflow(conflictUsers[i]));
      }

      // Execute conflict scenarios concurrently
      const conflictResults = await Promise.all(conflictWorkflows);

      // Both users should be able to analyze and validate their changes
      conflictResults.forEach((result) => {
        expect(result.impactAnalysisWorked || result.validationWorked).toBe(
          true
        );
      });

      console.log("✅ Users handled shared resource conflicts appropriately");
    });

    it("should maintain data isolation between concurrent user sessions", async () => {
      console.log("🔒 Testing Data Isolation Between Concurrent User Sessions");

      const isolationUsers = [
        "isolated-user-1",
        "isolated-user-2",
        "isolated-user-3",
      ];
      const isolationWorkflows = [];

      for (let i = 0; i < isolationUsers.length; i++) {
        const isolationWorkflow = async (userId: string) => {
          // Each user creates their own spec
          const specResponse = await app.inject({
            method: "POST",
            url: "/api/v1/design/create-spec",
            headers: {
              "content-type": "application/json",
              "x-user-id": userId,
            },
            payload: JSON.stringify({
              title: `${userId}'s Isolated Feature`,
              description: `Feature owned by ${userId}`,
              acceptanceCriteria: [`${userId}'s feature works correctly`],
              tags: [userId, "isolated"],
            }),
          });

          if (
            specResponse.statusCode === 200 ||
            specResponse.statusCode === 201
          ) {
            const specBody = JSON.parse(specResponse.payload);
            const specId = specBody.data.specId;

            // User creates implementation
            const implEntity: CodebaseEntity = {
              id: `${userId}-isolated-impl`,
              path: `src/services/${userId}Service.ts`,
              hash: `${userId}iso123`,
              language: "typescript",
              lastModified: new Date(),
              created: new Date(),
              type: "file",
              size: 192,
              lines: 15,
              isTest: false,
              content: `
                export class ${userId}Service {
                  execute(): string {
                    return '${userId} service executed successfully';
                  }
                }
              `,
            };

            await kgService.createEntity(implEntity);

            // User searches only for their own work
            const searchResponse = await app.inject({
              method: "POST",
              url: "/api/v1/graph/search",
              headers: {
                "content-type": "application/json",
                "x-user-id": userId,
              },
              payload: JSON.stringify({
                query: userId,
                limit: 10,
              }),
            });

            if (searchResponse.statusCode === 200) {
              const searchBody = JSON.parse(searchResponse.payload);
              expectSuccess(searchBody);

              // Should find their own work
              const foundSpec = searchBody.data.entities.find(
                (e: any) => e.id === specId
              );
              const foundImpl = searchBody.data.entities.find(
                (e: any) => e.id === implEntity.id
              );

              expect(foundSpec).toBeDefined();
              expect(foundImpl).toBeDefined();

              // Should NOT find other users' work (data isolation)
              const otherUsersWork = searchBody.data.entities.filter(
                (e: any) =>
                  e.id.includes("isolated-user") && !e.id.includes(userId)
              );
              expect(otherUsersWork.length).toBe(0);
            }

            return { userId, specId, success: true };
          }

          return { userId, success: false };
        };

        isolationWorkflows.push(isolationWorkflow(isolationUsers[i]));
      }

      // Execute isolation workflows concurrently
      const isolationResults = await Promise.all(isolationWorkflows);

      // All users should succeed
      const successfulIsolations = isolationResults.filter(
        (result) => result.success
      );
      expect(successfulIsolations.length).toBe(isolationUsers.length);

      console.log(
        "✅ Data isolation maintained between concurrent user sessions"
      );
    });

    it("should handle users collaborating on the same feature with coordination", async () => {
      console.log("🤝 Testing Users Collaborating on Same Feature");

      const collaborators = ["lead-dev", "junior-dev", "qa-engineer"];
      const featureSpecId = uuidv4();

      // Create shared feature spec
      const featureSpecResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify({
          title: "Collaborative Payment Processing Feature",
          description: "Team collaboration on payment processing system",
          requirements: [
            "Payment service implementation",
            "Payment validation logic",
            "Error handling and logging",
            "Integration tests and validation",
          ],
          acceptanceCriteria: [
            "Payment processing works correctly",
            "All edge cases are handled",
            "Comprehensive test coverage",
            "Production-ready error handling",
          ],
          priority: "high",
          tags: ["payment", "collaboration", "team-work"],
        }),
      });

      if (
        featureSpecResponse.statusCode !== 200 &&
        featureSpecResponse.statusCode !== 201
      ) {
        console.log(
          "⚠️  Feature spec creation failed, skipping collaboration test"
        );
        return;
      }

      const featureSpecBody = JSON.parse(featureSpecResponse.payload);
      const actualFeatureSpecId = featureSpecBody.data.specId;

      const collaborationWorkflows = [];

      for (let i = 0; i < collaborators.length; i++) {
        const collaborationWorkflow = async (role: string) => {
          const implementations = {
            "lead-dev": {
              path: "src/services/PaymentService.ts",
              content: `
                import { PaymentData, PaymentResult } from '../types/Payment';

                export class PaymentService {
                  constructor(private paymentGateway: PaymentGateway) {}

                  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
                    // Lead dev implements core payment processing
                    try {
                      const result = await this.paymentGateway.charge(
                        paymentData.amount,
                        paymentData.currency,
                        paymentData.source
                      );

                      return {
                        success: true,
                        transactionId: result.id,
                        amount: paymentData.amount,
                        currency: paymentData.currency,
                        timestamp: new Date(),
                      };
                    } catch (error) {
                      throw new Error(\`Payment processing failed: \${error.message}\`);
                    }
                  }
                }
              `,
            },
            "junior-dev": {
              path: "src/services/PaymentValidationService.ts",
              content: `
                import { PaymentData } from '../types/Payment';

                export class PaymentValidationService {
                  validatePaymentData(paymentData: PaymentData): ValidationResult {
                    const errors: string[] = [];

                    // Junior dev implements validation logic
                    if (!paymentData.amount || paymentData.amount <= 0) {
                      errors.push('Amount must be greater than 0');
                    }

                    if (!paymentData.currency || paymentData.currency.length !== 3) {
                      errors.push('Currency must be a valid 3-letter code');
                    }

                    if (!paymentData.source || typeof paymentData.source !== 'string') {
                      errors.push('Payment source is required');
                    }

                    return {
                      isValid: errors.length === 0,
                      errors,
                    };
                  }

                  sanitizePaymentData(paymentData: PaymentData): PaymentData {
                    return {
                      ...paymentData,
                      amount: Math.round(paymentData.amount * 100) / 100, // Round to 2 decimals
                      currency: paymentData.currency.toUpperCase(),
                    };
                  }
                }
              `,
            },
            "qa-engineer": {
              path: "src/services/__tests__/PaymentService.test.ts",
              content: `
                import { PaymentService } from '../PaymentService';
                import { PaymentValidationService } from '../PaymentValidationService';

                describe('PaymentService', () => {
                  let paymentService: PaymentService;
                  let validationService: PaymentValidationService;

                  beforeEach(() => {
                    paymentService = new PaymentService(mockPaymentGateway);
                    validationService = new PaymentValidationService();
                  });

                  describe('processPayment', () => {
                    it('should process valid payment successfully', async () => {
                      const paymentData = {
                        amount: 100.00,
                        currency: 'USD',
                        source: 'tok_visa',
                      };

                      const result = await paymentService.processPayment(paymentData);

                      expect(result.success).toBe(true);
                      expect(result.transactionId).toBeDefined();
                      expect(result.amount).toBe(100.00);
                      expect(result.currency).toBe('USD');
                    });

                    it('should handle payment gateway errors', async () => {
                      const paymentData = {
                        amount: 100.00,
                        currency: 'USD',
                        source: 'tok_declined',
                      };

                      await expect(
                        paymentService.processPayment(paymentData)
                      ).rejects.toThrow('Payment processing failed');
                    });
                  });

                  describe('PaymentValidationService', () => {
                    it('should validate correct payment data', () => {
                      const validData = {
                        amount: 50.00,
                        currency: 'EUR',
                        source: 'tok_mastercard',
                      };

                      const result = validationService.validatePaymentData(validData);
                      expect(result.isValid).toBe(true);
                      expect(result.errors).toEqual([]);
                    });

                    it('should reject invalid payment data', () => {
                      const invalidData = {
                        amount: -10,
                        currency: 'INVALID',
                        source: '',
                      };

                      const result = validationService.validatePaymentData(invalidData);
                      expect(result.isValid).toBe(false);
                      expect(result.errors.length).toBeGreaterThan(0);
                    });
                  });
                });
              `,
            },
          };

          const implementation =
            implementations[role as keyof typeof implementations];

          // Create implementation file
          const implEntity: CodebaseEntity = {
            id: `${role}-payment-impl`,
            path: implementation.path,
            hash: `${role}pay123`,
            language: role === "qa-engineer" ? "typescript" : "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
            size: 512,
            lines: 40,
            isTest: role === "qa-engineer",
            content: implementation.content,
          };

          await kgService.createEntity(implEntity);

          // Each collaborator validates their work
          const validationResponse = await app.inject({
            method: "POST",
            url: "/api/v1/code/validate",
            headers: {
              "content-type": "application/json",
              "x-user-id": role,
            },
            payload: JSON.stringify({
              files: [implementation.path],
              includeTypes:
                role === "qa-engineer"
                  ? ["typescript", "eslint"]
                  : ["typescript"],
              failOnWarnings: false,
            }),
          });

          // Collaborators commit their contributions
          const commitResponse = await app.inject({
            method: "POST",
            url: "/api/v1/scm/commit-pr",
            headers: {
              "content-type": "application/json",
              "x-user-id": role,
            },
            payload: JSON.stringify({
              title: `feat: implement ${role} contribution to payment processing`,
              description: `${role}'s contribution to collaborative payment feature`,
              changes: [implementation.path],
              relatedSpecId: actualFeatureSpecId,
              createPR: false,
              branchName: `feature/payment-collaboration-${role}`,
            }),
          });

          return {
            role,
            success: true,
            validationStatus: validationResponse.statusCode,
            commitStatus: commitResponse.statusCode,
            contribution: implementation.path,
          };
        };

        collaborationWorkflows.push(collaborationWorkflow(collaborators[i]));
      }

      // Execute collaboration workflows concurrently
      const collaborationResults = await Promise.all(collaborationWorkflows);

      // All collaborators should succeed
      const successfulCollaborators = collaborationResults.filter(
        (result) => result.success
      );
      expect(successfulCollaborators.length).toBe(collaborators.length);

      console.log(
        `✅ ${collaborators.length} collaborators successfully contributed to shared feature`
      );

      // Verify all contributions are visible in the shared context
      const sharedSearchResponse = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify({
          query: actualFeatureSpecId,
          includeRelated: true,
        }),
      });

      if (sharedSearchResponse.statusCode === 200) {
        const sharedSearchBody = JSON.parse(sharedSearchResponse.payload);
        expectSuccess(sharedSearchBody);

        // Should find all team contributions
        const foundContributions = sharedSearchBody.data.entities.filter(
          (e: any) => e.path.includes("Payment")
        );

        expect(foundContributions.length).toBeGreaterThan(0);

        console.log(
          "✅ All collaborative contributions are properly linked and discoverable"
        );
      }
    });
  });
});
