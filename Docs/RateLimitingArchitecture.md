# Architecture: Rate Limiting Module

This document describes the architecture and design decisions behind the API rate limiting module.
It outlines the components, data flow, and how metrics are collected.

## Key Components

- Token buckets stored per-identity
- Refill scheduler and bucket stores
- Monitoring utilities

## Implementation Notes

- The function `getRateLimitStats` provides a snapshot of current rate limiting statistics
  (total buckets, active buckets, oldest/newest refill timestamps).
- Buckets are refilled based on the configured window and max requests.
- Hooks expose lightweight introspection for health and metrics.

## Dependencies

- Fastify middleware integration
- In-memory stores with optional persistence

## Non-Goals

- This module does not handle authentication or authorization; it focuses solely on rate control.

