import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// ─── GET /api/admin/api-docs — Scan all API routes [ADMIN] ───

interface MethodInfo {
  method: string;
  description: string;
}

interface ApiEndpoint {
  path: string;
  methods: MethodInfo[];
  auth: 'public' | 'user' | 'admin';
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

// Parse: // ─── GET /api/persons — Person list (public) ───
const DESC_REGEX = /\/\/\s*─+\s*(GET|POST|PUT|PATCH|DELETE)\s+\S+\s*[—–-]\s*(.+?)\s*─+/g;

function scanApiRoutes(dir: string, basePath: string = '/api'): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const segment = entry.name.replace(/\[([^\]]+)\]/g, ':$1');
      endpoints.push(...scanApiRoutes(fullPath, `${basePath}/${segment}`));
    } else if (entry.name === 'route.ts') {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Extract descriptions from comments
      const descMap: Record<string, string> = {};
      let match;
      const regex = new RegExp(DESC_REGEX.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        descMap[match[1]] = match[2].trim();
      }

      // Extract exported HTTP methods
      const methods: MethodInfo[] = HTTP_METHODS
        .filter((m) =>
          new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(content)
        )
        .map((m) => ({
          method: m,
          description: descMap[m] || '',
        }));

      // Detect auth level
      let auth: ApiEndpoint['auth'] = 'public';
      if (content.includes('requireAdmin')) auth = 'admin';
      else if (content.includes('requireUser')) auth = 'user';

      if (methods.length > 0) {
        endpoints.push({ path: basePath, methods, auth });
      }
    }
  }

  return endpoints;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const apiDir = path.join(process.cwd(), 'app', 'api');
  const endpoints = scanApiRoutes(apiDir).sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  // Build tree structure
  interface TreeNode {
    name: string;
    path?: string;
    methods?: MethodInfo[];
    auth?: string;
    children: TreeNode[];
  }

  const root: TreeNode = { name: 'api', children: [] };

  for (const ep of endpoints) {
    const parts = ep.path.split('/').filter(Boolean);
    let current = root;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, children: [] };
        current.children.push(child);
      }
      current = child;
    }

    current.path = ep.path;
    current.methods = ep.methods;
    current.auth = ep.auth;
  }

  // Flat list for list view
  const flat = endpoints.flatMap((ep) =>
    ep.methods.map((m) => ({
      path: ep.path,
      method: m.method,
      description: m.description,
      auth: ep.auth,
    }))
  );

  return apiSuccess({ endpoints: flat, tree: root, total: flat.length });
}
