/**
 * Relationship Model Definitions for Neogma OGM
 * Maps domain relationships to Neo4j edge models
 */
import { Neogma } from 'neogma';
/**
 * Create all relationship models for the knowledge graph
 */
export declare function createRelationshipModels(neogma: Neogma): {
    ContainsRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    DefinesRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ExportsRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ImportsRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    CallsRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ReferencesRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ImplementsRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ExtendsRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    DependsOnRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    TypeUsesRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ReturnsTypeRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ParamTypeRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    TestsRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ValidatesRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    RequiresRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ImpactsRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ImplementsSpecRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    DocumentedByRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    DocumentsSectionRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    PreviousVersionRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
    ModifiedByRelation: {
        label: string;
        schema: {
            id: {
                type: string;
                required: boolean;
            };
            created: {
                type: string;
                required: boolean;
            };
            lastModified: {
                type: string;
                required: boolean;
            };
            version: {
                type: string;
                required: boolean;
                minimum: number;
            };
            metadata: {
                type: string;
                required: boolean;
            };
            evidence: {
                type: string;
                required: boolean;
            };
            locations: {
                type: string;
                required: boolean;
            };
            sites: {
                type: string;
                required: boolean;
            };
            validFrom: {
                type: string;
                required: boolean;
            };
            validTo: {
                type: string;
                required: boolean;
            };
        };
        source: any;
        target: any;
    };
};
//# sourceMappingURL=RelationshipModels.d.ts.map