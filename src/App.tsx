import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClinicalOrder, FilterState, OrderItem, OrderStatus, SummaryStats } from './types';
import { Header } from './components/Header';
import { SummaryStatsWidget } from './components/SummaryStats';
import { MobileFilters } from './components/MobileFilters';
import { OrderCard } from './components/OrderCard';
import { PendingQueueTriage } from './components/PendingQueueTriage';
import { BottomNav } from './components/BottomNav';
import { NewOrderModal } from './components/NewOrderModal';
import { WebhookSimulatorModal } from './components/WebhookSimulatorModal';
import { ManageBlockedSendersModal } from './components/ManageBlockedSendersModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { SoundSelectorModal } from './components/SoundSelectorModal';
import { PwaNotificationModal } from './components/PwaNotificationModal';
import { orderService } from './services/orderService';
import { subscribeToSupabaseRealtime, deleteSupabaseOrder } from './services/supabaseOrderService';
import { registerServiceWorker } from './utils/notifications';
import {
  getBlockedSenders,
  saveBlockedSenders,
  isSenderBlocked,
  fetchSupabaseMutedSenders,
  addMutedSender,
  removeMutedSender,
  subscribeToMutedSendersRealtime,
} from './services/senderService';
import { playStatAlarmSound } from './utils/statSound';
import { isStatMessage } from './utils/statFilter';
import { ClipboardCheck, RefreshCw, AlertCircle, Sparkles, Filter, Bed, BellRing, ShieldAlert, Trash2 } from 'lucide-react';

// Known raw/unparsed placeholder strings that should never overwrite parsed clinical data
const NAME_PLACEHOLDERS = [
  'raw pending message',
  'patient unassigned',
  'er patient',
  'unassigned patient',
  'pending',
  'no patient name',
  'unassigned',
];

const BED_PLACEHOLDERS = [
  'unassigned',
  'bed unassigned',
  'er bed',
  'n/a',
  'unspecified',
  'port a (default)',
];

const AGE_SEX_PLACEHOLDERS = ['n/a', 'unspecified', 'na'];
const BIRTHDAY_PLACEHOLDERS = ['unspecified', 'n/a', 'na'];

function isPlaceholderVal(val: string | undefined | null, placeholders: string[]): boolean {
  if (!val || !val.trim()) return true;
  return placeholders.includes(val.trim().toLowerCase());
}

// Helper to safely merge existing parsed order state with incoming backend/realtime updates without reverting parsed fields
function mergeOrderData(existing: ClinicalOrder, incoming: ClinicalOrder): ClinicalOrder {
  const isExistingParsedName = !isPlaceholderVal(existing.patient_name, NAME_PLACEHOLDERS);
  const isExistingParsedBed = !isPlaceholderVal(existing.bed_number, BED_PLACEHOLDERS);

  // Merge status: protect against reverting In Progress / Done back to Pending
  let mergedStatus = incoming.status;
  if (existing.status !== 'Pending' && incoming.status === 'Pending') {
    mergedStatus = existing.status;
  }

  // Merge items: use incoming items if available, or fallback to existing items
  let mergedItems = existing.items;
  if (incoming.items && incoming.items.length > 0) {
    mergedItems = incoming.items;
  }

  const finalName =
    isExistingParsedName && isPlaceholderVal(incoming.patient_name, NAME_PLACEHOLDERS)
      ? existing.patient_name
      : incoming.patient_name || existing.patient_name;

  const finalBed =
    isExistingParsedBed && isPlaceholderVal(incoming.bed_number, BED_PLACEHOLDERS)
      ? existing.bed_number
      : incoming.bed_number || existing.bed_number;

  const finalAgeSex = isPlaceholderVal(incoming.age_sex, AGE_SEX_PLACEHOLDERS)
    ? existing.age_sex
    : incoming.age_sex || existing.age_sex;

  const finalBirthday = isPlaceholderVal(incoming.birthday, BIRTHDAY_PLACEHOLDERS)
    ? existing.birthday
    : incoming.birthday || existing.birthday;

  const finalCaseNumber =
    !incoming.case_number || incoming.case_number.length <= 3
      ? existing.case_number
      : incoming.case_number;

  const finalOrderedBy =
    !incoming.ordered_by || incoming.ordered_by === 'Dr. Rounding'
      ? existing.ordered_by || incoming.ordered_by
      : incoming.ordered_by;

  return {
    ...existing,
    ...incoming,
    patient_name: finalName,
    bed_number: finalBed,
    age_sex: finalAgeSex,
    birthday: finalBirthday,
    case_number: finalCaseNumber,
    ordered_by: finalOrderedBy,
    status: mergedStatus,
    items: mergedItems,
    raw_text: existing.raw_text || incoming.raw_text,
  };
}

export default function App() {
  const [orders, setOrders] = useState<ClinicalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Muted Senders State
  const [blockedSenders, setBlockedSenders] = useState<string[]>(() => getBlockedSenders());
  const [showBlockedOrders, setShowBlockedOrders] = useState(false);

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isManageSendersOpen, setIsManageSendersOpen] = useState(false);
  const [isSupabaseSettingsOpen, setIsSupabaseSettingsOpen] = useState(false);
  const [isSoundSelectorOpen, setIsSoundSelectorOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'simulator'>('dashboard');

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'All',
    sortBy: 'time',
  });

  // Toast alert on new incoming orders
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);

  // Block sender helpers
  const handleBlockSender = async (senderName: string) => {
    if (!senderName) return;
    const clean = senderName.trim();
    if (blockedSenders.some((s) => s.toLowerCase() === clean.toLowerCase())) return;
    const updated = await addMutedSender(clean);
    setBlockedSenders(updated);
    triggerToast(`Muted order messages from "${clean}"`);
  };

  const handleUnblockSender = async (senderName: string) => {
    const updated = await removeMutedSender(senderName);
    setBlockedSenders(updated);
    triggerToast(`Allowed messages from "${senderName}" again`);
  };

  const handleToggleBlockSender = (senderName: string) => {
    if (isSenderBlocked(senderName, blockedSenders)) {
      handleUnblockSender(senderName);
    } else {
      handleBlockSender(senderName);
    }
  };

  // Fetch orders from service (supports both backend API & GitHub Pages static mode)
  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const data = await orderService.getOrders();
      const currentBlocked = getBlockedSenders();
      // Filter out non-STAT orders and delete non-STAT messages from Supabase right away
      const statOrders: ClinicalOrder[] = [];
      for (const order of data) {
        const isMuted = isSenderBlocked(order.ordered_by, currentBlocked);
        const hasStat = isStatMessage(order);

        if (hasStat && !isMuted) {
          statOrders.push(order);
        } else {
          // Immediately purge non-STAT or muted message from Supabase
          deleteSupabaseOrder(order.id).catch(() => {});
        }
      }

      setOrders((prev) => {
        if (!prev || prev.length === 0) return statOrders;

        const dataMap = new Map(statOrders.map((item) => [item.id, item]));

        const mergedPrev = prev.map((oldOrder) => {
          const fresh = dataMap.get(oldOrder.id);
          if (fresh) {
            dataMap.delete(oldOrder.id);
            return mergeOrderData(oldOrder, fresh);
          }
          return oldOrder;
        });

        const newFromData = Array.from(dataMap.values());
        const freshBlocked = getBlockedSenders();
        return [...newFromData, ...mergedPrev].filter(
          (o) => isStatMessage(o) && !isSenderBlocked(o.ordered_by, freshBlocked)
        );
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err?.message || 'Error loading clinical order data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load & Supabase Real-time listener
  useEffect(() => {
    // Register Service Worker for PWA notifications
    registerServiceWorker().catch(() => {});

    // Sync muted senders from Supabase DB on load & subscribe to realtime muted updates
    fetchSupabaseMutedSenders().then((remoteSenders) => {
      if (remoteSenders && remoteSenders.length > 0) {
        setBlockedSenders(remoteSenders);
      }
    });

    const unsubMuted = subscribeToMutedSendersRealtime((updatedSenders) => {
      console.log('⚡ Realtime muted senders update received:', updatedSenders);
      setBlockedSenders(updatedSenders);
    });

    fetchOrders();

    const unsubscribe = subscribeToSupabaseRealtime({
      onInsert: async (newOrder) => {
        console.log('📥 New Real-Time Order Received via Supabase:', newOrder);

        const currentBlocked = getBlockedSenders();
        const isMuted = isSenderBlocked(newOrder.ordered_by, currentBlocked);
        const hasStat = isStatMessage(newOrder);

        // If message does not contain "STAT" or is from muted sender -> DO NOT PROCESS & DELETE RIGHT AWAY!
        if (!hasStat || isMuted) {
          console.log(`[STAT Filter] Deleting non-STAT/muted message immediately (${newOrder.id})`);
          await deleteSupabaseOrder(newOrder.id);
          return;
        }

        // STAT message received! Play STAT alarm sound
        playStatAlarmSound();

        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        triggerToast(`🚨 STAT ALARM: New STAT message for ${newOrder.patient_name || newOrder.bed_number}!`);
      },
      onUpdate: (updatedOrder) => {
        const currentBlocked = getBlockedSenders();
        const isMuted = isSenderBlocked(updatedOrder.ordered_by, currentBlocked);
        const hasStat = isStatMessage(updatedOrder);

        if (!hasStat || isMuted) {
          deleteSupabaseOrder(updatedOrder.id).catch(() => {});
          setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
          return;
        }

        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? mergeOrderData(o, updatedOrder) : o))
        );
      },
      onDelete: (deletedId) => {
        setOrders((prev) => prev.filter((o) => o.id !== deletedId));
      },
    });

    return () => {
      unsubMuted();
      unsubscribe();
    };
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
    const existing = orders.find((o) => o.id === id);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, updated_at: Date.now() } : o))
    );

    try {
      const updated = await orderService.updateStatus(id, status, existing);
      setOrders((prev) => prev.map((o) => (o.id === id ? mergeOrderData(o, updated) : o)));
    } catch (err: any) {
      console.error('Error updating status:', err);
    }
  };

  // Toggle single item in checklist
  const handleToggleItem = async (orderId: string, itemId: string, isCompleted: boolean) => {
    const existing = orders.find((o) => o.id === orderId);

    // Immediate optimistic local UI update for instantaneous responsiveness
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedItems = o.items.map((it) =>
          it.id === itemId ? { ...it, is_completed: isCompleted } : it
        );
        const allCompleted = updatedItems.length > 0 && updatedItems.every((it) => it.is_completed);
        let newStatus = o.status;
        if (allCompleted) newStatus = 'Done';
        else if (o.status === 'Done') newStatus = 'In Progress';
        return {
          ...o,
          items: updatedItems,
          status: newStatus,
          updated_at: Date.now(),
        };
      })
    );

    try {
      const updated = await orderService.toggleItem(orderId, itemId, isCompleted, existing);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? mergeOrderData(o, updated) : o))
      );
    } catch (err: any) {
      console.error('Error toggling item:', err);
    }
  };

  // Complete all items in tile
  const handleCompleteAllItems = async (orderId: string) => {
    const existing = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'Done',
          items: o.items.map((it) => ({ ...it, is_completed: true })),
          updated_at: Date.now(),
        };
      })
    );

    try {
      const updated = await orderService.completeAllItems(orderId, existing);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? mergeOrderData(o, updated) : o))
      );
      triggerToast('All order items checked & tile completed!');
    } catch (err: any) {
      console.error('Error completing all items:', err);
    }
  };

  // Handle delete
  const handleDeleteOrder = async (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    triggerToast('Order tile removed');
    try {
      await orderService.deleteOrder(id);
    } catch (err: any) {
      console.error('Error deleting order:', err);
    }
  };

  // Handle creating new order from text message
  const handleCreateOrderFromText = async (rawText: string) => {
    const created = await orderService.createOrderFromText(rawText);
    const hasStat = isStatMessage(created) || isStatMessage({ raw_text: rawText });
    const isMuted = isSenderBlocked(created.ordered_by, blockedSenders);

    if (!hasStat || isMuted) {
      await deleteSupabaseOrder(created.id);
      triggerToast('⚠️ Non-STAT message deleted immediately! Only messages with "STAT" are kept.');
      return;
    }

    playStatAlarmSound();
    setOrders((prev) => [created, ...prev]);
    triggerToast(`🚨 STAT Alarm Triggered for ${created.bed_number}!`);
  };

  // Handle Order Simulated via Webhook Simulator
  const handleOrderSimulated = async (newOrder: ClinicalOrder) => {
    const hasStat = isStatMessage(newOrder);
    const isMuted = isSenderBlocked(newOrder.ordered_by, blockedSenders);

    if (!hasStat || isMuted) {
      await deleteSupabaseOrder(newOrder.id);
      triggerToast('⚠️ Non-STAT message deleted immediately! Only messages with "STAT" are processed.');
      return;
    }

    playStatAlarmSound();
    setOrders((prev) => {
      if (prev.some((o) => o.id === newOrder.id)) return prev;
      return [newOrder, ...prev];
    });
    triggerToast(`🚨 STAT Emergency Order Received for ${newOrder.bed_number}!`);
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
      triggerToast('Error resetting data');
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

  // Handle Approve action on Raw Pending Order (Displays message as-is without Gemini AI)
  const handleApproveAndParse = async (id: string) => {
    const target = orders.find((o) => o.id === id);
    const rawText = target?.raw_text || (target?.patient_name !== 'Raw Pending Message' ? target?.patient_name : '');

    // 1. Immediate optimistic UI update so tile moves out of Pending Queue instantly
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'In Progress' as const } : o))
    );

    try {
      const updated = await orderService.approveAndParseOrder(id, rawText, target);
      const activeOrder = { ...updated, status: 'In Progress' as const };
      setOrders((prev) => prev.map((o) => (o.id === id ? activeOrder : o)));
      const locationLabel =
        updated.bed_number && !updated.bed_number.toLowerCase().includes('unassigned')
          ? updated.bed_number
          : updated.patient_name || 'Patient';
      triggerToast(`✅ Approved & Displayed order for ${locationLabel}!`);
    } catch (err: any) {
      console.error('Error in approve order:', err);
    }
  };

  // Delete all pending messages in inbox
  const handleDeleteAllPending = async () => {
    const pendingToClear = orders.filter((o) => o.status === 'Pending');
    if (pendingToClear.length === 0) return;

    const idsToDelete = pendingToClear.map((o) => o.id);

    // 1. Optimistically purge all pending orders from state
    setOrders((prev) => prev.filter((o) => o.status !== 'Pending'));

    // 2. Parallel deletion across Supabase, Express API & localStorage
    await Promise.allSettled(idsToDelete.map((id) => orderService.deleteOrder(id)));

    triggerToast(`🗑️ Cleared all ${idsToDelete.length} pending messages!`);
  };

  // Dedicated Raw Pending Orders Inbox list
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'Pending' && !isSenderBlocked(o.ordered_by, blockedSenders));
  }, [orders, blockedSenders]);

  // Filtered & Sorted Active Orders (Including Pending, In Progress, Done in single view)
  const filteredActiveOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Muted sender filter
        if (!showBlockedOrders && isSenderBlocked(o.ordered_by, blockedSenders)) {
          return false;
        }

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
  }, [orders, filters, blockedSenders, showBlockedOrders]);

  // Group Active Tracked Orders by Bed / Location
  const activeOrdersByBed = useMemo(() => {
    const groups: Record<string, ClinicalOrder[]> = {};
    filteredActiveOrders.forEach((o) => {
      const bedKey = o.bed_number || 'Unassigned Bed';
      if (!groups[bedKey]) groups[bedKey] = [];
      groups[bedKey].push(o);
    });
    return groups;
  }, [filteredActiveOrders]);

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
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenManageSenders={() => setIsManageSendersOpen(true)}
        onOpenSupabaseSettings={() => setIsSupabaseSettingsOpen(true)}
        onOpenSoundSelector={() => setIsSoundSelectorOpen(true)}
        onOpenPwaNotifications={() => setIsPwaModalOpen(true)}
        onRefresh={() => fetchOrders(true)}
        isRefreshing={isRefreshing}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
        blockedSendersCount={blockedSenders.length}
        onTestStatSound={() => playStatAlarmSound()}
      />

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto">
        {/* Main Dashboard Panel */}
        <main className="p-2.5 sm:p-6 min-w-0">
          {/* Compact Status Counter Bar */}
          <SummaryStatsWidget
            stats={summaryStats}
            activeStatus={filters.status}
            totalCount={orders.length}
            onSelectStatus={(st) => handleFilterChange({ status: st as OrderStatus | 'All' })}
          />

          {/* Mobile Search & Filter Bar */}
          <MobileFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            totalCount={orders.length}
            filteredCount={filteredActiveOrders.length}
          />

          {/* Desktop Search & Sort Toolbar */}
          <div className="hidden sm:flex items-center justify-between gap-4 mb-4 pt-1">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
              <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Clinical Orders (Grouped by Bed / Location)</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {filteredActiveOrders.length}
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
          ) : filteredActiveOrders.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-4 shadow-2xs">
              <ClipboardCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No active tracked orders found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Approve incoming items from the Pending Inbox above or simulate a new Telegram message.
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
                  Clear Filters
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
            /* Active Tracked Orders Grouped by Bed / Location */
            <div className="space-y-6">
              {(Object.entries(activeOrdersByBed) as [string, ClinicalOrder[]][]).map(([bedName, bedOrders]) => (
                <div key={bedName} className="space-y-3">
                  <div className="flex items-center gap-2 bg-slate-200/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 w-fit shadow-2xs">
                    <Bed className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Location: {bedName}</span>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                      {bedOrders.length} {bedOrders.length === 1 ? 'Card' : 'Cards'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {bedOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateStatus}
                        onToggleItem={handleToggleItem}
                        onCompleteAllItems={handleCompleteAllItems}
                        onDelete={handleDeleteOrder}
                        isBlockedSender={isSenderBlocked(order.ordered_by, blockedSenders)}
                        onToggleBlockSender={handleToggleBlockSender}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar & FAB */}
      <BottomNav
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
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

      <ManageBlockedSendersModal
        isOpen={isManageSendersOpen}
        onClose={() => setIsManageSendersOpen(false)}
        blockedSenders={blockedSenders}
        onBlockSender={handleBlockSender}
        onUnblockSender={handleUnblockSender}
        showBlockedOrders={showBlockedOrders}
        onToggleShowBlockedOrders={setShowBlockedOrders}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseSettingsOpen}
        onClose={() => setIsSupabaseSettingsOpen(false)}
        onConnected={() => fetchOrders(true)}
      />

      <SoundSelectorModal
        isOpen={isSoundSelectorOpen}
        onClose={() => setIsSoundSelectorOpen(false)}
        onSoundChange={() => triggerToast('Saved new STAT alarm sound setting')}
        onOpenPwaNotifications={() => setIsPwaModalOpen(true)}
      />

      <PwaNotificationModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}
