import { useEffect, useState, useCallback } from 'react';
import { axiosInstance } from '../../../core/api/client';

interface AdminPaymentDto {
  id: string;
  orderId: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  chapterId?: string | null;
  chapterNumber?: number | null;
  chapterName?: string | null;
  titleName?: string | null;
  amount: number;
  currency: string;
  status: string;
  liqPayPaymentId?: string | null;
  liqPayStatus?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  Pending:  'bg-yellow-500/20 text-yellow-400',
  Success:  'bg-green-500/20 text-green-400',
  Sandbox:  'bg-blue-500/20 text-blue-400',
  Failure:  'bg-red-500/20 text-red-400',
  Reversed: 'bg-orange-500/20 text-orange-400',
};

const STATUS_OPTIONS = ['', 'Pending', 'Success', 'Sandbox', 'Failure', 'Reversed'];
const STATUS_LABELS: Record<string, string> = {
  '': 'Всі статуси',
  Pending: 'Очікує',
  Success: 'Успішно',
  Sandbox: 'Тест (sandbox)',
  Failure: 'Помилка',
  Reversed: 'Повернення',
};

const PAGE_SIZE = 30;

export function AdminPaymentsPage() {
  const [items, setItems] = useState<AdminPaymentDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const load = useCallback((p: number, st: string, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
    if (st) params.set('status', st);
    if (q) params.set('search', q);

    axiosInstance.get<PagedResult<AdminPaymentDto>>(`/admin/payments?${params}`)
      .then((r) => {
        setItems(r.data.data);
        setTotalCount(r.data.totalCount);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(page, statusFilter, search);
  }, [page, statusFilter, search, load]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleRefresh = async (orderId: string) => {
    setRefreshingId(orderId);
    try {
      await axiosInstance.post(`/admin/payments/${orderId}/refresh`);
      load(page, statusFilter, search);
    } finally {
      setRefreshingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Summary counts from loaded data (cheap approximation)
  const successCount = items.filter(i => i.status === 'Success' || i.status === 'Sandbox').length;
  const pendingCount = items.filter(i => i.status === 'Pending').length;
  const totalRevenue = items
    .filter(i => i.status === 'Success' || i.status === 'Sandbox')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Платежі</h1>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Успішних (поточна стор.)', value: successCount, color: 'text-green-400' },
          { label: 'Очікують (поточна стор.)', value: pendingCount, color: 'text-yellow-400' },
          { label: 'Виручка (поточна стор.)', value: `${totalRevenue.toFixed(2)} ₴`, color: 'text-primary-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-800 rounded-lg px-5 py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="orderId, username, liqpay ID..."
            className="flex-1 min-w-0 bg-surface-800 border border-surface-600 rounded-lg px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg"
          >
            Знайти
          </button>
          {search && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="px-3 py-2 bg-surface-700 hover:bg-surface-600 text-text-secondary text-sm rounded-lg"
            >
              Скинути
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">Платежів не знайдено</div>
      ) : (
        <div className="bg-surface-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-left">
                  <th className="px-4 py-3 text-text-muted font-medium">Користувач</th>
                  <th className="px-4 py-3 text-text-muted font-medium">Розділ</th>
                  <th className="px-4 py-3 text-text-muted font-medium">Сума</th>
                  <th className="px-4 py-3 text-text-muted font-medium">Статус</th>
                  <th className="px-4 py-3 text-text-muted font-medium">Order ID</th>
                  <th className="px-4 py-3 text-text-muted font-medium">Дата</th>
                  <th className="px-4 py-3 text-text-muted font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/50">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-700/30 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-surface-700 flex items-center justify-center text-xs text-text-muted shrink-0">
                            {p.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-text-primary font-medium truncate max-w-[120px]">{p.username}</span>
                      </div>
                    </td>

                    {/* Chapter */}
                    <td className="px-4 py-3">
                      {p.titleName ? (
                        <div>
                          <p className="text-text-primary truncate max-w-[160px]">{p.titleName}</p>
                          <p className="text-text-muted text-xs">
                            Розд. {p.chapterNumber}{p.chapterName ? ` — ${p.chapterName}` : ''}
                          </p>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-semibold text-text-primary whitespace-nowrap">
                      {p.amount.toFixed(2)} {p.currency}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[p.status] ?? 'bg-surface-600 text-text-muted'}`}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                        {p.liqPayStatus && p.liqPayStatus !== p.status.toLowerCase() && (
                          <p className="text-xs text-text-muted mt-0.5">LiqPay: {p.liqPayStatus}</p>
                        )}
                      </div>
                    </td>

                    {/* Order ID */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-text-secondary truncate max-w-[140px]" title={p.orderId}>
                        {p.orderId}
                      </p>
                      {p.liqPayPaymentId && (
                        <p className="font-mono text-xs text-text-muted mt-0.5">LP: {p.liqPayPaymentId}</p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-text-secondary text-xs">
                        {new Date(p.createdAt).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                      {p.completedAt && (
                        <p className="text-text-muted text-xs">
                          {new Date(p.completedAt).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {p.status === 'Pending' && (
                        <button
                          onClick={() => handleRefresh(p.orderId)}
                          disabled={refreshingId === p.orderId}
                          className="text-xs px-2 py-1 bg-surface-700 hover:bg-surface-600 text-text-secondary rounded disabled:opacity-50 whitespace-nowrap"
                          title="Перевірити статус у LiqPay"
                        >
                          {refreshingId === p.orderId ? '...' : 'Перевірити'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-text-muted">
            {totalCount} платежів · стор. {page} з {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 rounded text-sm disabled:opacity-40"
            >
              ←
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 rounded text-sm disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
