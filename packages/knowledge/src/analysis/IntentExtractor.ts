/**
 * Intent Extractor
 * Handles inference of document intent, domains, stakeholders, and technologies
 */

import { DocumentationIntelligenceProvider } from '../embeddings/DocumentationIntelligenceProvider.js';
import type { ParsedDocument } from '../embeddings/DocTokenizer.js';
import {
  DocumentationIntent,
  DocumentationSource,
} from '@memento/shared-types.js';

export interface DomainExtraction {
  name: string;
  description: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  stakeholders: string[];
  keyProcesses: string[];
  confidence: number;
}

export class IntentExtractor {
  constructor(
    private intelligenceProvider: DocumentationIntelligenceProvider
  ) {}

  /**
   * Infer document intent based on file path and type
   */
  inferDocIntent(
    filePath: string,
    docType: ParsedDocument['docType']
  ): ParsedDocument['docIntent'] {
    const normalizedPath = filePath.toLowerCase();

    if (
      normalizedPath.includes('/adr') ||
      normalizedPath.includes('adr-') ||
      normalizedPath.includes('/architecture') ||
      normalizedPath.includes('/decisions') ||
      docType === 'architecture'
    ) {
      return 'governance';
    }

    if (docType === 'api-doc' || docType === 'readme') {
      return 'reference';
    }

    if (docType === 'user-guide') {
      return 'tutorial';
    }

    if (docType === 'design-doc') {
      return 'mixed';
    }

    return 'ai-context';
  }

  /**
   * Infer document locale from file path and metadata
   */
  inferDocLocale(
    filePath: string,
    metadata: Record<string, any>
  ): string | undefined {
    const localeMatch = filePath
      .toLowerCase()
      .match(/\.([a-z]{2}(?:-[a-z0-9]+)?)\.(md|txt|rst|adoc)$/);
    if (localeMatch) {
      return localeMatch[1];
    }

    if (
      typeof metadata?.language === 'string' &&
      metadata.language.length > 0
    ) {
      return metadata.language;
    }

    return 'en';
  }

  /**
   * Extract business domains from document signals
   */
  async extractDomains(
    document: ParsedDocument,
    content: string
  ): Promise<DomainExtraction[]> {
    try {
      const signals = await this.intelligenceProvider.extractSignals({
        content,
        format: document.metadata?.format || 'markdown',
        filePath: document.metadata?.filePath,
        docTypeHint: document.docType as any, // Type conversion due to mismatch
        metadata: document.metadata,
      });

      return signals.businessDomains.map((domainName) => ({
        name: domainName,
        description: '',
        criticality: this.inferDomainCriticality(domainName, content),
        stakeholders: [],
        keyProcesses: [],
        confidence: 0.5,
      }));
    } catch (error) {
      console.warn('Failed to extract domains:', error);
      return [];
    }
  }

  /**
   * Extract stakeholders from document
   */
  async extractStakeholders(
    document: ParsedDocument,
    content: string
  ): Promise<string[]> {
    try {
      const signals = await this.intelligenceProvider.extractSignals({
        content,
        format: document.metadata?.format || 'markdown',
        filePath: document.metadata?.filePath,
        docTypeHint: document.docType as any, // Type conversion due to mismatch
        metadata: document.metadata,
      });

      return signals.stakeholders || [];
    } catch (error) {
      console.warn('Failed to extract stakeholders:', error);
      return [];
    }
  }

  /**
   * Extract technologies from document
   */
  async extractTechnologies(
    document: ParsedDocument,
    content: string
  ): Promise<string[]> {
    try {
      const signals = await this.intelligenceProvider.extractSignals({
        content,
        format: document.metadata?.format || 'markdown',
        filePath: document.metadata?.filePath,
        docTypeHint: document.docType as any, // Type conversion due to mismatch
        metadata: document.metadata,
      });

      return signals.technologies || [];
    } catch (error) {
      console.warn('Failed to extract technologies:', error);
      return [];
    }
  }

  /**
   * Infer domain criticality based on domain name and content
   */
  private inferDomainCriticality(
    domainName: string,
    content: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const normalizedDomain = domainName.toLowerCase();
    const normalizedContent = content.toLowerCase();

    // Critical domains
    if (
      normalizedDomain.includes('security') ||
      normalizedDomain.includes('compliance') ||
      normalizedDomain.includes('privacy') ||
      normalizedDomain.includes('authentication')
    ) {
      return 'critical';
    }

    // High criticality domains
    if (
      normalizedDomain.includes('payment') ||
      normalizedDomain.includes('billing') ||
      normalizedDomain.includes('infrastructure') ||
      normalizedDomain.includes('data')
    ) {
      return 'high';
    }

    // Medium criticality domains
    if (
      normalizedDomain.includes('user') ||
      normalizedDomain.includes('customer') ||
      normalizedDomain.includes('product') ||
      normalizedContent.includes('business critical')
    ) {
      return 'medium';
    }

    // Low criticality (default)
    return 'low';
  }

  /**
   * Enhance parsed document with extracted intent information
   */
  async enhanceDocument(
    document: ParsedDocument,
    content: string
  ): Promise<ParsedDocument> {
    const [businessDomains, stakeholders, technologies] = await Promise.all([
      this.extractDomains(document, content),
      this.extractStakeholders(document, content),
      this.extractTechnologies(document, content),
    ]);

    return {
      ...document,
      businessDomains: businessDomains.map((d) => d.name),
      stakeholders,
      technologies,
      docIntent:
        document.docIntent ||
        this.inferDocIntent(
          document.metadata?.filePath || '',
          document.docType
        ),
      docLocale:
        document.docLocale ||
        this.inferDocLocale(
          document.metadata?.filePath || '',
          document.metadata || {}
        ),
      metadata: {
        ...document.metadata,
        extractedDomains: businessDomains,
        extractedStakeholders: stakeholders,
        extractedTechnologies: technologies,
      },
    };
  }
}
