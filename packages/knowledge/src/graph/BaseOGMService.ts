/**
 * Base class for OGM services with common initialization and event forwarding
 */

import { EventEmitter } from 'events';
import { NeogmaService } from './NeogmaService.js';

/**
 * Abstract base class that provides common functionality for all OGM services
 * Eliminates code duplication in constructor patterns and event forwarding
 */
export abstract class BaseOGMService extends EventEmitter {
  protected neogma: any;

  constructor(protected neogmaService: NeogmaService) {
    super();
    this.neogma = this.neogmaService.getNeogmaInstance();
    this.setupEventForwarding();
  }

  /**
   * Sets up event forwarding from NeogmaService to this service
   * This pattern was duplicated across EntityServiceOGM, RelationshipServiceOGM, and SearchServiceOGM
   */
  private setupEventForwarding(): void {
    this.neogmaService.on('error', (data) => {
      this.emit('error', { source: 'neogma', ...data });
    });
  }

  /**
   * Gets the Neogma instance for use in child classes
   */
  protected getNeogmaInstance() {
    return this.neogma;
  }
}