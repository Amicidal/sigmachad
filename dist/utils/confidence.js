import { noiseConfig } from "../config/noise.js";
/**
 * Compute a confidence score (0..1) for an inferred relationship using simple, configurable weights.
 * Defaults are chosen to match prior constants so existing tests remain stable.
 */
export function scoreInferredEdge(features) {
    const { toId, fromFileRel, usedTypeChecker, isExported, nameLength, importDepth } = features;
    // Base score by resolution bucket
    let score;
    if (toId.startsWith("external:")) {
        score = noiseConfig.AST_CONF_EXTERNAL;
    }
    else if (toId.startsWith("file:")) {
        score = noiseConfig.AST_CONF_FILE;
    }
    else {
        // Concrete id (entity id)
        score = noiseConfig.AST_CONF_CONCRETE;
    }
    // Optional boosts based on simple, explainable signals
    try {
        // Same-file boost when file: points back to current file
        if (toId.startsWith("file:") && fromFileRel) {
            const parts = toId.split(":");
            if (parts.length >= 3) {
                const toRel = parts[1];
                if (normalizePath(toRel) === normalizePath(fromFileRel)) {
                    score += noiseConfig.AST_BOOST_SAME_FILE;
                }
            }
        }
        // Type-checker resolution boost
        if (usedTypeChecker) {
            score += noiseConfig.AST_BOOST_TYPECHECK;
        }
        // Exported symbol boost (when local resolution)
        if (isExported) {
            score += noiseConfig.AST_BOOST_EXPORTED;
        }
        // Name length step (above min length)
        if (typeof nameLength === 'number' && Number.isFinite(nameLength)) {
            const over = Math.max(0, nameLength - 3);
            score += Math.min(10, over) * noiseConfig.AST_STEP_NAME_LEN;
        }
        // Import depth penalty (if available)
        if (typeof importDepth === 'number' && Number.isFinite(importDepth) && importDepth > 0) {
            score -= importDepth * noiseConfig.AST_PENALTY_IMPORT_DEPTH;
        }
    }
    catch (_a) {
        // ignore safe boosts
    }
    // Phase 3: lightweight calibration via env overrides
    try {
        const mult = parseFloat(process.env.AST_CONF_MULTIPLIER || '1');
        if (Number.isFinite(mult))
            score *= mult;
        const minClamp = process.env.AST_CONF_MIN ? parseFloat(process.env.AST_CONF_MIN) : undefined;
        const maxClamp = process.env.AST_CONF_MAX ? parseFloat(process.env.AST_CONF_MAX) : undefined;
        if (Number.isFinite(minClamp))
            score = Math.max(score, minClamp);
        if (Number.isFinite(maxClamp))
            score = Math.min(score, maxClamp);
    }
    catch (_b) { }
    // Clamp
    if (!Number.isFinite(score))
        score = 0.5;
    return Math.max(0, Math.min(1, score));
}
function normalizePath(p) {
    return String(p || "").replace(/\\/g, "/").replace(/\/+/g, "/");
}
//# sourceMappingURL=confidence.js.map