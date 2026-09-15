/**
 * Cross-surface wire types shared by server and web.
 *
 * This package is the phase-3 integration seam: generated per-language
 * artifacts replace hand-written types here, and contract edits must update
 * provider and consumer in the same change. Until then it holds the single
 * hand-written source of truth.
 */

/** Payload of `GET /health`. */
export interface HealthStatus {
  status: 'ok'
  uptimeSeconds: number
}
