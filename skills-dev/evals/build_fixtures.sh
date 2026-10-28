#!/usr/bin/env bash
# Build the two eval fixtures: <dir>/fixture (shop admin mid-migration from axios
# to apiGet + TanStack Query) and <dir>/fixture2 (fixture plus look-alike
# formatters whose differences live only in commit messages).
set -euo pipefail
OUT=${1:?usage: build_fixtures.sh <dir>}
mkdir -p "$OUT"
rm -rf "$OUT/fixture" "$OUT/fixture2"
mkdir -p "$OUT/fixture"
cd "$OUT/fixture"
git init -q
git config user.email t@t
git config user.name tester
c(){ GIT_AUTHOR_DATE="$1" GIT_COMMITTER_DATE="$1" git commit -qm "$2"; }
mkdir -p src/api src/pages src/shared/ui src/shared/api src/types
cat > package.json <<'EOF'
{ "name": "shop-admin", "private": true, "type": "module",
  "dependencies": { "axios": "^1.6.0", "react": "^18.3.0", "react-dom": "^18.3.0", "react-router-dom": "^6.22.0" },
  "devDependencies": { "typescript": "^5.4.0", "vite": "^5.2.0" } }
EOF
cat > tsconfig.json <<'EOF'
{ "compilerOptions": { "strict": true, "jsx": "react-jsx", "baseUrl": ".", "paths": { "@/*": ["src/*"] } } }
EOF
cat > src/api/legacy.ts <<'EOF'
import axios from 'axios';

// Backend wraps every payload as { data: ... }
const http = axios.create({ baseURL: '/api', withCredentials: true });

export async function get<T>(url: string, params?: Record<string, string>): Promise<T> {
  const res = await http.get(url, { params });
  return res.data.data as T;
}
EOF
cat > src/types/index.ts <<'EOF'
export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export interface Order { id: string; customerId: string; status: OrderStatus; total: number; createdAt: string }
export interface Customer { id: string; name: string; email: string }
EOF
cat > src/shared/ui/Card.tsx <<'EOF'
import type { ReactNode } from 'react';

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2 className="card__title">{title}</h2>
      <div className="card__body">{children}</div>
    </section>
  );
}
EOF
cat > src/pages/OrdersPage.tsx <<'EOF'
import { useEffect, useState } from 'react';
import { get } from '../api/legacy';
import { Card } from '../shared/ui/Card';
import type { Order } from '../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Order[]>('/orders').then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading…</p>;
  return (
    <Card title="Orders">
      <table>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}><td>{o.id}</td><td>{o.status}</td><td>{o.total}</td></tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
EOF
cat > src/pages/CustomersPage.tsx <<'EOF'
import { useEffect, useState } from 'react';
import { get } from '../api/legacy';
import { Card } from '../shared/ui/Card';
import type { Customer } from '../types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  useEffect(() => { get<Customer[]>('/customers').then(setCustomers); }, []);
  return (
    <Card title="Customers">
      <ul>{customers.map((c) => <li key={c.id}>{c.name} — {c.email}</li>)}</ul>
    </Card>
  );
}
EOF
cat > src/pages/ReportsPage.tsx <<'EOF'
import { useEffect, useState } from 'react';
import { get } from '../api/legacy';
import { Card } from '../shared/ui/Card';

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<number | null>(null);
  useEffect(() => { get<{ revenue: number }>('/reports/summary', { period: 'month' }).then((r) => setRevenue(r.revenue)); }, []);
  return <Card title="Reports"><p>Revenue this month: {revenue ?? '—'}</p></Card>;
}
EOF
git add -A && c "2025-01-10T10:00:00" "init shop admin with orders, customers, reports"
for i in 1 2 3; do echo "// tweak $i" >> src/pages/OrdersPage.tsx; git add -A; c "2025-0$((i+2))-05T10:00:00" "orders: small fix $i"; done
cat > src/shared/api/client.ts <<'EOF'
// The one HTTP client for new code. Unwraps the backend's { data } envelope.
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`/api${path}${qs}`, { credentials: 'include' });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  const body = (await res.json()) as { data: T };
  return body.data;
}
EOF
python3 - <<'EOF'
import json; p='package.json'; d=json.load(open(p)); d['dependencies']['@tanstack/react-query']='^5.40.0'; json.dump(d,open(p,'w'),indent=2)
EOF
cat > src/pages/CustomersPage.tsx <<'EOF'
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/client';
import { Card } from '@/shared/ui/Card';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const { data: customers = [], isPending, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiGet<Customer[]>('/customers'),
  });
  if (isPending) return <p>Loading…</p>;
  if (error) return <p role="alert">Could not load customers.</p>;
  return (
    <Card title="Customers">
      <ul>{customers.map((c) => <li key={c.id}>{c.name} — {c.email}</li>)}</ul>
    </Card>
  );
}
EOF
git add -A && c "2026-03-02T10:00:00" "feat: add apiClient + TanStack Query; move customers off axios"
cat > src/pages/InvoicesPage.tsx <<'EOF'
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiGet } from '@/shared/api/client';
import { Card } from '@/shared/ui/Card';

interface Invoice { id: string; amount: number; overdue: boolean }

export default function InvoicesPage() {
  const [params, setParams] = useSearchParams();
  const overdueOnly = params.get('overdue') === '1';
  const { data: invoices = [], isPending } = useQuery({
    queryKey: ['invoices', { overdueOnly }],
    queryFn: () => apiGet<Invoice[]>('/invoices', overdueOnly ? { overdue: '1' } : undefined),
  });
  return (
    <Card title="Invoices">
      <label>
        <input type="checkbox" checked={overdueOnly}
          onChange={(e) => setParams(e.target.checked ? { overdue: '1' } : {})} />
        Overdue only
      </label>
      {isPending ? <p>Loading…</p> : <ul>{invoices.map((i) => <li key={i.id}>{i.id}: {i.amount}</li>)}</ul>}
    </Card>
  );
}
EOF
git add -A && c "2026-06-20T10:00:00" "feat: invoices page with overdue filter"

# fixture2: look-alike formatters; the reasons for their differences are only in commit messages.
cp -r "$OUT/fixture" "$OUT/fixture2"
cd "$OUT/fixture2"
mkdir -p src/utils
cat > src/utils/orderFormat.ts <<'EOF'
const fmt = new Intl.NumberFormat('vi-VN');

export function formatOrderTotal(total: number): string {
  if (!Number.isFinite(total)) return '—';
  const sign = total < 0 ? '-' : '';
  const value = Math.abs(total);
  return `${sign}${fmt.format(value)} đ`;
}
EOF
sed 's/formatOrderTotal(total/formatInvoiceAmount(amount/; s/(total)/(amount)/; s/total < 0/amount < 0/; s/Math.abs(total)/Math.abs(amount)/' \
  src/utils/orderFormat.ts > src/utils/invoiceFormat.ts
python3 - <<'EOF'
from pathlib import Path
o = Path('src/pages/OrdersPage.tsx'); s = o.read_text()
s = s.replace("import type { Order } from '../types';", "import type { Order } from '../types';\nimport { formatOrderTotal } from '../utils/orderFormat';")
s = s.replace("<td>{o.total}</td>", "<td>{formatOrderTotal(o.total)}</td>")
o.write_text(s)
i = Path('src/pages/InvoicesPage.tsx'); s = i.read_text()
s = s.replace("import { Card } from '@/shared/ui/Card';", "import { Card } from '@/shared/ui/Card';\nimport { formatInvoiceAmount } from '@/utils/invoiceFormat';")
s = s.replace("{i.id}: {i.amount}", "{i.id}: {formatInvoiceAmount(i.amount)}")
i.write_text(s)
EOF
git add -A && c "2026-07-01T10:00:00" "feat: format order totals and invoice amounts"
python3 - <<'EOF'
from pathlib import Path
p = Path('src/utils/orderFormat.ts'); s = p.read_text()
s = s.replace("  return `${sign}${fmt.format(value)} đ`;", "  const rounded = Math.round(value / 1000) * 1000;\n  return `${sign}${fmt.format(rounded)} đ`;")
p.write_text(s)
EOF
git add -A && c "2026-08-10T10:00:00" "orders: round totals to the nearest thousand (marketing request #142)"
sed -i 's/} đ`;/} VND`;/' src/utils/invoiceFormat.ts
git add -A && c "2026-09-02T10:00:00" "invoices: show exact amount with VND code (tax compliance #188)"
echo "built $OUT/fixture and $OUT/fixture2"
