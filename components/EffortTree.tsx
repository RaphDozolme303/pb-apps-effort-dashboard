'use client'

import { useState } from 'react'
import type { EffortEntity, TreeNode } from '@/types/index'
import StatusBadge from './StatusBadge'
import EffortBar from './EffortBar'
import { collectFilteredFeatures, sumEffort, maxProductEffort } from '@/lib/transform'

interface Props {
  tree: TreeNode[]
  releases: EffortEntity[]
}

export default function EffortTree({ tree, releases }: Props) {
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const globalMax = maxProductEffort(tree, selectedRelease)

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filter out nodes with no features matching the release
  function hasMatchingFeatures(node: TreeNode): boolean {
    return collectFilteredFeatures(node, selectedRelease).length > 0
  }

  return (
    <div>
      {/* Release filter */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-medium text-gray-600">Filter by release</label>
        <select
          value={selectedRelease ?? ''}
          onChange={(e) => setSelectedRelease(e.target.value || null)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--pb-blue)]"
        >
          <option value="">All releases</option>
          {releases.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        {selectedRelease && (
          <button
            onClick={() => setSelectedRelease(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Tree */}
      <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {tree.filter(hasMatchingFeatures).map((productNode) => {
          const productFeatures = collectFilteredFeatures(productNode, selectedRelease)
          const productEffort = sumEffort(productFeatures)
          const isCollapsed = collapsed.has(productNode.entity.id)

          return (
            <div key={productNode.entity.id}>
              {/* Product row */}
              <div
                className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer select-none"
                onClick={() => toggle(productNode.entity.id)}
              >
                <span className="text-gray-400 text-xs w-3">{isCollapsed ? '▶' : '▼'}</span>
                <span className="font-bold text-gray-900 flex-1 text-sm">{productNode.entity.name}</span>
                <div className="flex items-center gap-3">
                  <EffortBar value={productEffort} max={globalMax} />
                  <span className="font-bold text-gray-800 text-sm w-12 text-right">{productEffort}</span>
                </div>
              </div>

              {/* Children: components / sub-components */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-100">
                  {/* Direct features on the product (no component) */}
                  {productNode.features
                    .filter((f) => selectedRelease === null || f.releaseIds.includes(selectedRelease))
                    .map((f) => (
                      <FeatureRow key={f.id} feature={f} depth={1} />
                    ))}

                  {/* Component rows */}
                  {productNode.children
                    .filter(hasMatchingFeatures)
                    .map((compNode) => (
                      <ComponentSubtree
                        key={compNode.entity.id}
                        node={compNode}
                        depth={1}
                        selectedRelease={selectedRelease}
                        globalMax={globalMax}
                        collapsed={collapsed}
                        toggle={toggle}
                        hasMatchingFeatures={hasMatchingFeatures}
                      />
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {tree.filter(hasMatchingFeatures).length === 0 && (
        <div className="text-sm text-gray-400 italic py-8 text-center">
          No features found{selectedRelease ? ' for the selected release' : ''}.
        </div>
      )}
    </div>
  )
}

// ─── Component subtree (recursive) ────────────────────────────────────────────

interface SubtreeProps {
  node: TreeNode
  depth: number
  selectedRelease: string | null
  globalMax: number
  collapsed: Set<string>
  toggle: (id: string) => void
  hasMatchingFeatures: (node: TreeNode) => boolean
}

function ComponentSubtree({ node, depth, selectedRelease, globalMax, collapsed, toggle, hasMatchingFeatures }: SubtreeProps) {
  const filteredFeatures = collectFilteredFeatures(node, selectedRelease)
  const effort = sumEffort(filteredFeatures)
  const isCollapsed = collapsed.has(node.entity.id)
  const indent = depth * 20

  return (
    <div>
      {/* Component header row */}
      <div
        className="flex items-center gap-4 px-4 py-2.5 hover:bg-gray-50 cursor-pointer select-none"
        style={{ paddingLeft: 16 + indent }}
        onClick={() => toggle(node.entity.id)}
      >
        <span className="text-gray-400 text-xs w-3">{isCollapsed ? '▶' : '▼'}</span>
        <span className="font-semibold text-gray-700 flex-1 text-sm">{node.entity.name}</span>
        <div className="flex items-center gap-3">
          <EffortBar value={effort} max={globalMax} height="xs" />
          <span className="text-gray-700 text-sm w-12 text-right">{effort}</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="divide-y divide-gray-50">
          {/* Direct features on this component */}
          {node.features
            .filter((f) => selectedRelease === null || f.releaseIds.includes(selectedRelease))
            .map((f) => (
              <FeatureRow key={f.id} feature={f} depth={depth + 1} />
            ))}

          {/* Sub-components */}
          {node.children
            .filter(hasMatchingFeatures)
            .map((child) => (
              <ComponentSubtree
                key={child.entity.id}
                node={child}
                depth={depth + 1}
                selectedRelease={selectedRelease}
                globalMax={globalMax}
                collapsed={collapsed}
                toggle={toggle}
                hasMatchingFeatures={hasMatchingFeatures}
              />
            ))}
        </div>
      )}
    </div>
  )
}

// ─── Feature row (leaf) ───────────────────────────────────────────────────────

function FeatureRow({ feature, depth }: { feature: EffortEntity; depth: number }) {
  const indent = depth * 20

  return (
    <div
      className="flex items-center gap-3 py-2 pr-4"
      style={{ paddingLeft: 16 + indent + 16 /* extra for no chevron */ }}
    >
      <StatusBadge status={feature.status} />
      <span className="text-sm text-gray-700 flex-1 truncate" title={feature.name}>
        {feature.name}
      </span>
      {feature.effort !== null && (
        <span className="text-sm text-gray-500 w-12 text-right shrink-0">{feature.effort}</span>
      )}
    </div>
  )
}
