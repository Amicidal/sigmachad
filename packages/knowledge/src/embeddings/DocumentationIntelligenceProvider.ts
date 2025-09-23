import { DocumentationIntent, DocumentationNodeType, DocumentationSource } from "../../models/relationships.js";

export interface DocumentationIntelligenceRequest {
  content: string;
  format: "markdown" | "plaintext" | "rst" | "asciidoc";
  filePath?: string;
  docTypeHint?: DocumentationNodeType;
  metadata?: Record<string, unknown>;
}

export interface DocumentationSignals {
  businessDomains: string[];
  stakeholders: string[];
  technologies: string[];
  docIntent?: DocumentationIntent;
  docSource?: DocumentationSource;
  docLocale?: string;
  rawModelResponse?: string;
  confidence?: number;
}

export interface DocumentationIntelligenceProvider {
  extractSignals(
    request: DocumentationIntelligenceRequest
  ): Promise<DocumentationSignals>;
  getExtractionPrompt?(): string;
}

export const LLM_EXTRACTION_PROMPT = `You are an expert technical documentation analyst assisting a knowledge graph ingestion pipeline.
Given a single document, produce a strict JSON object with the following keys:
  - businessDomains: array of canonical business-domain strings (kebab or lowercase, e.g. "payment processing", "user management").
  - stakeholders: array of relevant roles or teams (lowercase singular nouns, e.g. "product manager").
  - technologies: array of technologies directly mentioned (lowercase, snake/kebab case acceptable, e.g. "postgresql", "redis").
  - docIntent: one of ["ai-context", "governance", "mixed"]. Prefer "governance" for ADRs/runbooks/architecture decisions, "mixed" for user guides and design docs, otherwise "ai-context".
  - docSource (optional): one of ["parser", "manual", "llm", "imported", "sync", "other"]. Default to "llm" when unsure.
  - docLocale (optional): ISO language code detected from content (default "en").
If the document lacks information for a field, return an empty array (for lists) or omit the key.
DO NOT include explanations or comments, respond with raw JSON only.`;

class NarrativeSplitter {
  private static connectorPatterns = [
    " with ",
    " including ",
    " using ",
    " through ",
    " across ",
    " featuring ",
    " leveraging ",
    " for ",
  ];

  private static narrativeBreakers = [
    " we ",
    " our ",
    " handles ",
    " supports ",
    " provides ",
    " offers ",
    " includes ",
    " delivers ",
    " enables ",
    " ensures ",
    " powers ",
    " maintains ",
    " real-time ",
  ];

  static cleanCandidate(raw: string): string | undefined {
    if (!raw) return undefined;
    let candidate = raw
      .replace(/[`*_~]/g, "")
      .replace(/\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\((?:[^)])+\)/g, "")
      .replace(/^[^A-Za-z0-9]+/, "")
      .replace(/[:\-–—]+$/g, "")
      .trim();

    if (!candidate) return undefined;
    candidate = candidate.replace(/\s*\n\s*/g, " ");

    const lowerCandidate = candidate.toLowerCase();
    for (const connector of this.connectorPatterns) {
      const index = lowerCandidate.indexOf(connector);
      if (index > 0) {
        candidate = candidate.slice(0, index).trim();
        break;
      }
    }

    const lowerForBreakers = candidate.toLowerCase();
    for (const breaker of this.narrativeBreakers) {
      const idx = lowerForBreakers.indexOf(breaker);
      if (idx > 0) {
        candidate = candidate.slice(0, idx).trim();
        break;
      }
    }

    candidate = candidate
      .replace(/\bdomains?\b/gi, "")
      .replace(/\b(?:core|key|primary|major|main)\s+(?=business\b)/gi, "")
      .replace(/\b(?:business|critical|core|key|primary|major|main)\s+(?=domain\b)/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!candidate) return undefined;
    if (/^(and|or|the|with)\b/i.test(candidate)) return undefined;

    const words = candidate.split(/\s+/);
    if (words.length > 6) {
      return undefined;
    }

    return candidate.toLowerCase();
  }
}

const STOP_VALUES = new Set<string>([
  "",
  "domain",
  "domains",
  "business",
  "core",
  "core business",
  "key",
  "key business",
  "primary",
  "primary business",
  "overview",
  "introduction",
  "summary",
  "governance",
  "capability",
  "capabilities",
  "function",
  "functions",
]);

const SUFFIX_KEYWORDS = [
  "management",
  "processing",
  "services",
  "service",
  "operations",
  "support",
  "experience",
  "governance",
  "compliance",
  "authentication",
  "analytics",
  "reporting",
  "integration",
  "intelligence",
  "platform",
  "security",
  "architecture",
  "automation",
  "enablement",
  "monitoring",
  "delivery",
  "engagement",
  "observability",
  "continuity",
  "planning",
  "assurance",
  "registration",
  "onboarding",
  "billing",
  "payment",
  "payments",
  "logistics",
  "chain",
  "inventory",
  "relationship",
  "marketing",
  "sales",
];

const SINGLE_KEYWORDS = [
  "authentication",
  "security",
  "compliance",
  "financial",
  "risk",
  "governance",
  "analytics",
  "reporting",
  "observability",
  "infrastructure",
  "architecture",
  "marketing",
  "sales",
  "logistics",
  "inventory",
  "payments",
  "payment",
  "billing",
];

const STAKEHOLDER_PATTERNS = [
  /\b(?:product|project|tech|engineering|development|qa|testing|devops|security)\s+(?:team|manager|lead|director|specialist|engineer|coordinator)\b/gi,
  /\b(?:business|product|system|technical|solution|data)\s+(?:analyst|architect|owner|consultant)\b/gi,
  /\b(?:end\s+)?(?:user|customer|client|consumer|subscriber|member|participant|visitor)s?\b/gi,
  /\b(?:admin|administrator|operator|maintainer|supervisor|moderator)s?\b/gi,
  /\b(?:partner|vendor|supplier|contractor)s?\b/gi,
  /\b(?:stakeholder|shareholder|investor)s?\b/gi,
  /\b(?:developer|programmer|coder|architect|designer)s?\b/gi,
  /\b(?:sales|marketing|support|customer service|help desk|it|hr)\s+(?:team|manager|representative|specialist|agent)\b/gi,
  /\busers?\b/gi,
  /\bpeople\b/gi,
  /\bpersonnel\b/gi,
];

const TECHNOLOGY_PATTERNS = [
  /\b(?:javascript|typescript|python|java|go|rust|cpp|c\+\+|c#)\b/gi,
  /\b(?:react|vue|angular|svelte|next\.js|nuxt)\b/gi,
  /\b(?:node\.js|express|fastify|django|flask|spring)\b/gi,
  /\b(?:postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
  /\b(?:docker|kubernetes|aws|gcp|azure)\b/gi,
  /\b(?:rest|grpc|websocket)\b/gi,
];

export class HeuristicDocumentationIntelligenceProvider
  implements DocumentationIntelligenceProvider
{
  async extractSignals(
    request: DocumentationIntelligenceRequest
  ): Promise<DocumentationSignals> {
    const businessDomains = this.extractBusinessDomains(request.content, request.metadata);
    const stakeholders = this.extractStakeholders(request.content);
    const technologies = this.extractTechnologies(request.content);

    return {
      businessDomains,
      stakeholders,
      technologies,
      docIntent: undefined,
      docSource: "parser",
    };
  }

  private extractBusinessDomains(
    content: string,
    metadata?: Record<string, unknown>
  ): string[] {
    const normalizedContent = content.replace(/\r\n/g, "\n");
    const lines = normalizedContent.split("\n");
    const domains = new Set<string>();

    const addCandidate = (raw: string | undefined, options: { split?: boolean } = {}) => {
      if (!raw) return;

      if (options.split) {
        const segments = raw
          .split(/[;,\/]/)
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 0);
        if (segments.length > 1) {
          for (const segment of segments) {
            addCandidate(segment);
          }
          return;
        }
      }

      const cleaned = NarrativeSplitter.cleanCandidate(raw);
      if (!cleaned) return;
      if (STOP_VALUES.has(cleaned)) return;
      if (/^(?:core|key|primary|major|main|business|capabilities?|functions?)$/.test(cleaned)) return;

      if (/\sand\s/i.test(cleaned)) {
        const andSegments = cleaned
          .split(/\sand\s/gi)
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 2);
        if (andSegments.length > 1 && andSegments.length <= 3 && andSegments.every((segment) => /\s/.test(segment))) {
          for (const segment of andSegments) {
            addCandidate(segment);
          }
          return;
        }
      }

      if (cleaned.length >= 3) {
        domains.add(cleaned);
      }
    };

    const headingRegex = /^(#{1,6})\s+(.*)$/;
    const bulletRegex = /^\s*(?:[-*+•]|\d+\.)\s+(.*)$/;
    let domainSectionLevel: number | null = null;
    let collectingList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(headingRegex);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        const lowerHeading = headingText.toLowerCase();

        if (domainSectionLevel !== null && level <= domainSectionLevel) {
          domainSectionLevel = null;
          collectingList = false;
        }

        if (/\bdomains?\b/.test(lowerHeading)) {
          domainSectionLevel = level;
          collectingList = true;
          const baseHeading = lowerHeading.replace(/\bdomains?\b/g, "").trim();
          if (baseHeading && !/^(?:business|core\s+business|key\s+business)$/.test(baseHeading)) {
            addCandidate(headingText);
          }
        }

        if (domainSectionLevel !== null && level > domainSectionLevel) {
          collectingList = false;
        }

        if (/\bdomain\b/.test(lowerHeading) && !/\bdomains\b/.test(lowerHeading)) {
          addCandidate(headingText);
        }

        continue;
      }

      if (domainSectionLevel !== null) {
        if (bulletRegex.test(line) && collectingList) {
          const bulletText = line.replace(bulletRegex, "$1").trim();
          addCandidate(bulletText);
          continue;
        }

        const colonMatch = line.match(/\bdomains?\s*:\s*(.+)$/i);
        if (colonMatch) {
          addCandidate(colonMatch[1], { split: true });
        }

        continue;
      }

      const colonMatch = line.match(/\bdomains?\s*:\s*(.+)$/i);
      if (colonMatch) {
        addCandidate(colonMatch[1], { split: true });
      }
    }

    const extractionText = normalizedContent.replace(/&/g, " and ");

    for (const keyword of SUFFIX_KEYWORDS) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(
        `\\b([A-Za-z][A-Za-z/&-]*(?:\\s+[A-Za-z][A-Za-z/&-]*){0,3})\\s+${escaped}\\b`,
        "gi"
      );
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(extractionText)) !== null) {
        addCandidate(match[0]);
      }
    }

    for (const keyword of SINGLE_KEYWORDS) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(extractionText)) !== null) {
        addCandidate(match[0]);
      }
    }

    const inlineDomainRegex = /\b([A-Z][A-Za-z0-9/&\- ]{2,})\s+Domain\b/g;
    let match: RegExpExecArray | null;
    while ((match = inlineDomainRegex.exec(content)) !== null) {
      addCandidate(match[1]);
    }

    const headings = Array.isArray(metadata?.headings)
      ? (metadata!.headings as Array<{ text: string }>)
      : [];
    for (const heading of headings) {
      if (typeof heading?.text === "string") {
        addCandidate(heading.text);
      }
    }

    return Array.from(domains);
  }

  private extractStakeholders(content: string): string[] {
    const stakeholders = new Set<string>();

    for (const pattern of STAKEHOLDER_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          let s = match.toLowerCase().trim();

          s = s
            .replace(/\bdevelopers\b/g, "developer")
            .replace(/\busers\b/g, "user")
            .replace(/\bcustomers\b/g, "customer")
            .replace(/\bclients\b/g, "client")
            .replace(/\bpartners\b/g, "partner")
            .replace(/\bvendors\b/g, "vendor")
            .replace(/\bstakeholders\b/g, "stakeholder")
            .replace(/\badministrators\b/g, "administrator")
            .replace(/\bmanagers\b/g, "manager")
            .replace(/\bteams\b/g, "team")
            .replace(/\bengineers\b/g, "engineer")
            .replace(/\banalysts\b/g, "analyst")
            .replace(/\barchitects\b/g, "architect")
            .replace(/\bspecialists\b/g, "specialist")
            .replace(/\bsupervisors\b/g, "supervisor")
            .replace(/\bmoderators\b/g, "moderator")
            .replace(/\boperators\b/g, "operator")
            .replace(/\bmaintainers\b/g, "maintainer")
            .replace(/\bcoordinators\b/g, "coordinator")
            .replace(/\bconsultants\b/g, "consultant")
            .replace(/\bdesigners\b/g, "designer")
            .replace(/\bprogrammers\b/g, "programmer")
            .replace(/\bcoders\b/g, "coder")
            .replace(/\brepresentatives\b/g, "representative")
            .replace(/\bagents\b/g, "agent")
            .replace(/\bowners\b/g, "owner")
            .replace(/\bleads\b/g, "lead")
            .replace(/\bdirectors\b/g, "director")
            .replace(/\bvisitors\b/g, "visitor")
            .replace(/\bmembers\b/g, "member")
            .replace(/\bparticipants\b/g, "participant")
            .replace(/\bsubscribers\b/g, "subscriber")
            .replace(/\bconsumers\b/g, "consumer")
            .replace(/\bshareholders\b/g, "shareholder")
            .replace(/\binvestors\b/g, "investor")
            .replace(/\bcontractors\b/g, "contractor")
            .replace(/\bsuppliers\b/g, "supplier")
            .replace(/\bpeople\b/g, "person")
            .replace(/\bpersonnel\b/g, "person")
            .replace(/\bend users\b/g, "end user")
            .replace(/\bsales teams\b/g, "sales team")
            .replace(/\bmarketing teams\b/g, "marketing team")
            .replace(/\bsupport teams\b/g, "support team")
            .replace(/\bcustomer service teams\b/g, "customer service team")
            .replace(/\bhelp desk teams\b/g, "help desk team")
            .replace(/\bit teams\b/g, "it team")
            .replace(/\bhr teams\b/g, "hr team");

          if (s !== "person" && s !== "people" && s !== "personnel" && s.length > 2) {
            stakeholders.add(s);
          }
        });
      }
    }

    return Array.from(stakeholders);
  }

  private extractTechnologies(content: string): string[] {
    const technologies = new Set<string>();
    const normalizedContent = content.replace(/\bC\+\+\b/g, "cpp");
    if (/c\+\+/i.test(content)) {
      technologies.add("cpp");
    }
    for (const pattern of TECHNOLOGY_PATTERNS) {
      const matches = normalizedContent.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          let m = match.toLowerCase().trim();
          if (m === "c++") m = "cpp";
          technologies.add(m);
        });
      }
    }
    return Array.from(technologies);
  }
}
