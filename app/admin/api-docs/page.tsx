'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface MethodInfo {
  method: string;
  description: string;
}

interface TreeNode {
  name: string;
  path?: string;
  methods?: MethodInfo[];
  auth?: string;
  children: TreeNode[];
}

interface FlatEndpoint {
  path: string;
  method: string;
  description: string;
  auth: string;
}

interface ApiDocsData {
  endpoints: FlatEndpoint[];
  tree: TreeNode;
  total: number;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

const AUTH_LABELS: Record<string, { label: string; className: string }> = {
  public: { label: 'Public', className: 'text-gray-400' },
  user: { label: 'User', className: 'text-blue-500' },
  admin: { label: 'Admin', className: 'text-red-500' },
};

// ─── Filters ───

function Filters({
  search,
  onSearchChange,
  methodFilter,
  onMethodChange,
  authFilter,
  onAuthChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  methodFilter: string;
  onMethodChange: (v: string) => void;
  authFilter: string;
  onAuthChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search path or description..."
          className="w-full min-w-[200px] rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Method filter */}
      <select
        value={methodFilter}
        onChange={(e) => onMethodChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <option value="">All Methods</option>
        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* Auth filter */}
      <select
        value={authFilter}
        onChange={(e) => onAuthChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <option value="">All Auth</option>
        <option value="public">Public</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}

// ─── Tree View ───

function TreeItem({
  node,
  depth = 0,
  search,
  methodFilter,
  authFilter,
}: {
  node: TreeNode;
  depth?: number;
  search: string;
  methodFilter: string;
  authFilter: string;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isEndpoint = !!node.methods && node.methods.length > 0;
  const isParam = node.name.startsWith(':');

  // Filter: check if this node or any descendant matches
  const isVisible = useMemo(() => {
    return nodeMatchesFilter(node, search, methodFilter, authFilter);
  }, [node, search, methodFilter, authFilter]);

  if (!isVisible) return null;

  // Filter methods for display
  const visibleMethods = isEndpoint
    ? (node.methods ?? []).filter((m) => {
        if (methodFilter && m.method !== methodFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!node.path?.toLowerCase().includes(q) && !m.description.toLowerCase().includes(q)) return false;
        }
        return true;
      })
    : [];

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Toggle */}
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Icon */}
        {hasChildren && !isEndpoint ? (
          <svg className="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}

        {/* Name */}
        <span
          className={`shrink-0 text-sm font-medium ${
            isParam ? 'text-purple-600' : isEndpoint ? 'text-gray-900' : 'text-gray-700'
          }`}
        >
          {node.name}
        </span>

        {/* Methods + descriptions */}
        {isEndpoint && visibleMethods.length > 0 && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex shrink-0 items-center gap-1">
              {visibleMethods.map((m) => (
                <span
                  key={m.method}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${METHOD_COLORS[m.method] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {m.method}
                </span>
              ))}
            </div>
            {visibleMethods.length === 1 && visibleMethods[0].description && (
              <span className="truncate text-xs text-gray-400">
                {visibleMethods[0].description}
              </span>
            )}
          </div>
        )}

        {/* Auth */}
        {node.auth && (
          <span className={`ml-auto shrink-0 text-[11px] font-medium ${AUTH_LABELS[node.auth]?.className ?? 'text-gray-400'}`}>
            {AUTH_LABELS[node.auth]?.label ?? node.auth}
          </span>
        )}
      </div>

      {/* Method detail rows when multiple methods have descriptions */}
      {isEndpoint && visibleMethods.length > 1 && visibleMethods.some((m) => m.description) && (
        <div style={{ paddingLeft: `${depth * 20 + 52}px` }}>
          {visibleMethods
            .filter((m) => m.description)
            .map((m) => (
              <div key={m.method} className="flex items-center gap-2 py-0.5 text-xs text-gray-400">
                <span className={`rounded px-1 py-px text-[9px] font-bold ${METHOD_COLORS[m.method]}`}>
                  {m.method}
                </span>
                <span>{m.description}</span>
              </div>
            ))}
        </div>
      )}

      {/* Children */}
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.name}
              node={child}
              depth={depth + 1}
              search={search}
              methodFilter={methodFilter}
              authFilter={authFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function nodeMatchesFilter(
  node: TreeNode,
  search: string,
  methodFilter: string,
  authFilter: string,
): boolean {
  // Check this node
  if (node.methods && node.methods.length > 0) {
    const authMatch = !authFilter || node.auth === authFilter;
    const methodMatch = !methodFilter || node.methods.some((m) => m.method === methodFilter);
    const searchMatch =
      !search ||
      node.path?.toLowerCase().includes(search.toLowerCase()) ||
      node.methods.some((m) => m.description.toLowerCase().includes(search.toLowerCase()));

    if (authMatch && methodMatch && searchMatch) return true;
  }

  // Check children recursively
  return node.children.some((child) =>
    nodeMatchesFilter(child, search, methodFilter, authFilter)
  );
}

// ─── Page ───

export default function ApiDocsPage() {
  const { data, isLoading } = useSWR<ApiDocsData>('/api/admin/api-docs', fetcher);
  const [view, setView] = useState<'tree' | 'list'>('tree');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [authFilter, setAuthFilter] = useState('');

  const filteredEndpoints = useMemo(() => {
    if (!data) return [];
    return data.endpoints.filter((ep) => {
      if (methodFilter && ep.method !== methodFilter) return false;
      if (authFilter && ep.auth !== authFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!ep.path.toLowerCase().includes(q) && !ep.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, search, methodFilter, authFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        Failed to load API documentation.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {data.total} endpoints detected
            {(search || methodFilter || authFilter) && (
              <span className="ml-1 text-brand-600">
                ({filteredEndpoints.length} shown)
              </span>
            )}
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            onClick={() => setView('tree')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'tree' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tree
          </button>
          <button
            onClick={() => setView('list')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Filters */}
      <Filters
        search={search}
        onSearchChange={setSearch}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
        authFilter={authFilter}
        onAuthChange={setAuthFilter}
      />

      {/* Content */}
      <div className="card-flat overflow-hidden">
        {view === 'tree' ? (
          <div className="p-2">
            <TreeItem
              node={data.tree}
              search={search}
              methodFilter={methodFilter}
              authFilter={authFilter}
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="w-20 px-4 py-3">Method</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Description</th>
                <th className="w-16 px-4 py-3">Auth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEndpoints.map((ep) => (
                <tr key={ep.method + ep.path} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${METHOD_COLORS[ep.method] ?? 'bg-gray-100'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-900">{ep.path}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {ep.description || <span className="italic text-gray-300">No description</span>}
                  </td>
                  <td className={`px-4 py-2.5 text-xs font-medium ${AUTH_LABELS[ep.auth]?.className ?? ''}`}>
                    {AUTH_LABELS[ep.auth]?.label ?? ep.auth}
                  </td>
                </tr>
              ))}
              {filteredEndpoints.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    No endpoints match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
