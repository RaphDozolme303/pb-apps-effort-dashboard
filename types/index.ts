export type EffortEntityType = 'product' | 'component' | 'feature' | 'release'

export interface EffortEntity {
  id: string
  type: EffortEntityType
  name: string
  effort: number | null
  status: string | null
  /** Direct parent ID (product/component for components; component/product for features) */
  parentId: string | null
  /** Release IDs this feature is linked to — populated only for features */
  releaseIds: string[]
  archived: boolean
}

/** Recursive node: products at the root, components/sub-components as children */
export interface TreeNode {
  entity: EffortEntity
  /** Sub-components (or components under a product) */
  children: TreeNode[]
  /** Features directly under this component node */
  features: EffortEntity[]
}

export interface EffortCacheFile {
  fetchedAt: string
  products: EffortEntity[]
  components: EffortEntity[]
  features: EffortEntity[]
  releases: EffortEntity[]
}

export interface CacheStatus {
  fetchedAt: string | null
  isStale: boolean
  entityCounts: {
    products: number
    components: number
    features: number
    releases: number
  } | null
}

// ─── Raw API types (subset needed for this app) ───────────────────────────────

export interface PBApiRelationship {
  type: 'link' | 'parent' | 'child'
  target: { id: string; type: string; links: { self: string } }
}

export interface PBApiEntity {
  id: string
  type: string
  fields: {
    name: string
    status?: { id: string; name: string } | null
    effort?: { value: number | null } | null
    archived?: boolean
    [key: string]: unknown
  }
  relationships?: {
    data: PBApiRelationship[]
    links?: { next: string | null }
  }
}

export interface PBApiPage<T> {
  data: T[]
  links: { next: string | null }
}
