import type { EffortCacheFile, EffortEntity, TreeNode } from '@/types/index'

// ─── Tree builder ─────────────────────────────────────────────────────────────

/**
 * Builds a recursive product → component → (sub-component) → feature tree.
 * Handles sub-components: components whose parentId points to another component.
 */
export function buildTree(cache: EffortCacheFile): TreeNode[] {
  const { products, components, features } = cache

  const productMap = new Map(products.map((p) => [p.id, p]))
  const componentMap = new Map(components.map((c) => [c.id, c]))

  // Group components by their parent (product or component)
  const componentsByParent = new Map<string, EffortEntity[]>()
  for (const comp of components) {
    if (!comp.parentId) continue
    const list = componentsByParent.get(comp.parentId) ?? []
    list.push(comp)
    componentsByParent.set(comp.parentId, list)
  }

  // Group features by their parent (component or product)
  const featuresByParent = new Map<string, EffortEntity[]>()
  for (const feature of features) {
    if (!feature.parentId) continue
    const list = featuresByParent.get(feature.parentId) ?? []
    list.push(feature)
    featuresByParent.set(feature.parentId, list)
  }

  // Recursively build a component node and its sub-component children
  function buildComponentNode(comp: EffortEntity): TreeNode {
    const subComponents = componentsByParent.get(comp.id) ?? []
    return {
      entity: comp,
      children: subComponents.map(buildComponentNode),
      features: featuresByParent.get(comp.id) ?? [],
    }
  }

  // Build root nodes: products that have components or direct features
  const roots: TreeNode[] = []

  for (const product of products) {
    const directComponents = componentsByParent.get(product.id) ?? []
    roots.push({
      entity: product,
      children: directComponents.map(buildComponentNode),
      features: featuresByParent.get(product.id) ?? [],
    })
  }

  // Also include orphan components (no product parent found)
  for (const comp of components) {
    if (comp.parentId && !productMap.has(comp.parentId) && !componentMap.has(comp.parentId)) {
      roots.push(buildComponentNode(comp))
    }
  }

  return roots
}

// ─── Rollup ───────────────────────────────────────────────────────────────────

/** Collects all features from a node and its descendants that match the release filter */
export function collectFilteredFeatures(
  node: TreeNode,
  releaseFilter: string | null
): EffortEntity[] {
  const ownFeatures = node.features.filter(
    (f) => releaseFilter === null || f.releaseIds.includes(releaseFilter)
  )
  const childFeatures = node.children.flatMap((child) =>
    collectFilteredFeatures(child, releaseFilter)
  )
  return [...ownFeatures, ...childFeatures]
}

/** Sums effort across a list of features (null efforts treated as 0) */
export function sumEffort(features: EffortEntity[]): number {
  return features.reduce((acc, f) => acc + (f.effort ?? 0), 0)
}

/** Max effort across product-level nodes, for proportional bar sizing */
export function maxProductEffort(tree: TreeNode[], releaseFilter: string | null): number {
  const sums = tree.map((node) => sumEffort(collectFilteredFeatures(node, releaseFilter)))
  return Math.max(...sums, 1)
}
