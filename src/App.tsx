import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClinicalOrder, FilterState, OrderStatus, SummaryStats } from './types';
import { Header } from './components/Header';
import { SummaryStatsWidget } from './components/SummaryStats';
import { PendingQueueTriage } from './components/PendingQueueTriage';
import { MobileFilters } from './components/MobileFilters';
import { OrderCard } from './components/OrderCard';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { NewOrderModal } from './components/NewOrderModal';
import { WebhookSimulatorModal } from './components/WebhookSimulatorModal';
import { WebhookDocsModal } from './components/WebhookDocsModal';
import { orderService } from './services/orderService';
import { ClipboardCheck, RefreshCw, AlertCircle, Sparkles, Filter } from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<ClinicalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isWebhookDocsOpen, setIsWebhookDocsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'simulator' | 'docs'>('dashboard');

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'All',
    sortBy: 'time',
  });

  // Toast alert on new incoming orders
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);

  // Fetch orders from service (supports both backend API & GitHub Pages static mode)
  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err?.message || 'Error loading clinical order data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Live Sync / Polling interval (5 seconds)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchOrders]);

  // Handle status update
  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      const updated = await orderService.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`Could not update status: ${err?.message || 'Unknown error'}`);
    }
  };

  // Toggle single item in checklist
  const handleToggleItem = async (orderId: string, itemId: string, isCompleted: boolean) => {
    try {
      const updated = await orderService.toggleItem(orderId, itemId, isCompleted);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      console.error('Error toggling item:', err);
      alert('Could not update order item');
    }
  };

  // Complete all items in tile
  const handleCompleteAllItems = async (orderId: string) => {
    try {
      const updated = await orderService.completeAllItems(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      triggerToast('All order items checked & tile completed!');
    } catch (err: any) {
      console.error('Error completing all items:', err);
      alert('Could not complete all items');
    }
  };

  // Handle delete
  const handleDeleteOrder = async (id: string) => {
    try {
      await orderService.deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      console.error('Error deleting order:', err);
      alert(`Could not delete order: ${err?.message || 'Unknown error'}`);
    }
  };

  // Handle creating new order from text message
  const handleCreateOrderFromText = async (rawText: string) => {
    const created = await orderService.createOrderFromText(rawText);
    setOrders((prev) => [created, ...prev]);
    triggerToast(`Order tile created for ${created.bed_number}`);
  };

  // Handle Order Simulated via Webhook Simulator
  const handleOrderSimulated = (newOrder: ClinicalOrder) => {
    setOrders((prev) => {
      if (prev.some((o) => o.id === newOrder.id)) return prev;
      return [newOrder, ...prev];
    });
    triggerToast(`⚡ Telegram Message Parsed for ${newOrder.bed_number}!`);
  };

  // Reset seed sample data
  const handleResetSeedData = async () => {
    if (!confirm('Reset current clinical board to sample round patient tiles?')) return;
    setIsLoading(true);
    try {
      const resetList = await orderService.resetSeedData();
      setOrders(resetList);
      triggerToast('Board reset to sample round tiles');
    } catch (err: any) {
      alert('Error resetting data');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerToast = (msg: string) => {
    setNewOrderToast(msg);
    setTimeout(() => setNewOrderToast(null), 4000);
  };

  // Filter change helper
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Calculate Summary Stats
  const summaryStats: SummaryStats = useMemo(() => {
    let totalPending = 0;
    let inProgress = 0;
    let completedToday = 0;

    orders.forEach((o) => {
      if (o.status === 'Pending') totalPending++;
      else if (o.status === 'In Progress') inProgress++;
      else if (o.status === 'Done') completedToday++;
    });

    return {
      totalPending,
      inProgress,
      completedToday,
      totalOrders: orders.length,
    };
  }, [orders]);

  // Dedicated Pending Orders list for top triage section
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'Pending');
  }, [orders]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Search query filter
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchesBed = o.bed_number.toLowerCase().includes(q);
          const matchesName = o.patient_name.toLowerCase().includes(q);
          const matchesDoctor = o.ordered_by.toLowerCase().includes(q);
          const matchesCase = o.case_number.toLowerCase().includes(q);
          const matchesItems = o.items.some((i) => i.item_text.toLowerCase().includes(q));
          const matchesRaw = o.raw_text ? o.raw_text.toLowerCase().includes(q) : false;
          if (!matchesBed && !matchesName && !matchesDoctor && !matchesCase && !matchesItems && !matchesRaw) {
            return false;
          }
        }

        // Status filter
        if (filters.status !== 'All' && o.status !== filters.status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'bed') {
          return a.bed_number.localeCompare(b.bed_number, undefined, { numeric: true });
        } else if (filters.sortBy === 'patient') {
          return a.patient_name.localeCompare(b.patient_name);
        }
        return b.created_at - a.created_at;
      });
  }, [orders, filters]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased pb-20 lg:pb-8">
      {/* Toast Banner */}
      {newOrderToast && (
        <div className="fixed top-16 right-4 z-50 p-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{newOrderToast}</span>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenWebhookDocs={() => setIsWebhookDocsOpen(true)}
        onRefresh={() => fetchOrders(true)}
        isRefreshing={isRefreshing}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenWebhookDocs={() => setIsWebhookDocsOpen(true)}
          onResetSeedData={handleResetSeedData}
          totalOrdersCount={orders.length}
          pendingCount={summaryStats.totalPending}
        />

        {/* Main Dashboard Panel */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {/* Summary Statistic Widgets */}
          <SummaryStatsWidget
            stats={summaryStats}
            activeStatus={filters.status}
            onSelectStatus={(st) => handleFilterChange({ status: st as OrderStatus | 'All' })}
          />

          {/* Dedicated Pending Queue Triage Section */}
          <PendingQueueTriage
            pendingOrders={pendingOrders}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteOrder}
          />

          {/* Mobile Search & Filter Bar */}
          <MobileFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            totalCount={orders.length}
            filteredCount={filteredOrders.length}
          />

          {/* Desktop Search & Sort Toolbar */}
          <div className="hidden sm:flex items-center justify-between gap-4 mb-4 pt-1">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
              <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Round Orders Grid</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredOrders.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  handleFilterChange({ sortBy: e.target.value as 'time' | 'bed' | 'patient' })
                }
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="time">Newest First</option>
                <option value="patient">Patient Name</option>
                <option value="bed">Bed Number</option>
              </select>
            </div>
          </div>

          {/* Loading & Error States */}
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Connecting to Clinical Order Tracker...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center my-6">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Server Connection Error</h3>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-3">{error}</p>
              <button
                onClick={() => fetchOrders(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-4 shadow-2xs">
              <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No orders match your filter criteria
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Try clearing search terms or simulate a new Telegram message order.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() =>
                    handleFilterChange({
                      status: 'All',
                      searchQuery: '',
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setIsSimulatorOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Simulate Telegram Order
                </button>
              </div>
            </div>
          ) : (
            /* Order Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleItem={handleToggleItem}
                  onCompleteAllItems={handleCompleteAllItems}
                  onDelete={handleDeleteOrder}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar & FAB */}
      <BottomNav
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenWebhookDocs={() => setIsWebhookDocsOpen(true)}
        onRefresh={() => fetchOrders(true)}
        isRefreshing={isRefreshing}
        activeTab={mobileTab}
        setActiveTab={setMobileTab}
        pendingCount={summaryStats.totalPending}
      />

      {/* Modals */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSubmitOrderText={handleCreateOrderFromText}
      />

      <WebhookSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onOrderSimulated={handleOrderSimulated}
      />

      <WebhookDocsModal
        isOpen={isWebhookDocsOpen}
        onClose={() => setIsWebhookDocsOpen(false)}
      />
    </div>
  );
}
