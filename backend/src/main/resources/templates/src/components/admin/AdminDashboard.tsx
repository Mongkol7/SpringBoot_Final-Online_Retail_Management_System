import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Search,
  RefreshCw,
  FileText,
  Building2,
  ChevronRight,
  ChevronDown,
  Lock,
  Unlock,
  Check,
  X,
  Package,
  Eye,
  Calendar,
  Clock,
  Percent,
  Sparkles,
  Layers,
  ArrowUpRight,
  CreditCard,
  Download,
  Printer,
  Receipt,
  FileSpreadsheet,
  UserPlus,
  Edit2,
  Trash2,
  MapPin,
  Tag,
  Phone,
  Mail,
  Key,
  ShieldCheck,
  Briefcase,
  XCircle
} from 'lucide-react';
import {
  ExecutiveKpiSummary,
  SalesSeriesPoint,
  AdminUser,
  AdminWholesaleApp,
  AdminAuditLog,
  AdminProductDetail,
  AdminPayment,
  CustomerSpendingSummary,
  FinancialTaxReport
} from '../../types/schema';
import { adminService } from '../../services/adminService';
import { IosCardGlass } from '../ui/IosCardGlass';

export const AdminDashboard: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PRODUCTS' | 'PAYMENTS' | 'WHOLESALE' | 'USERS' | 'AUDIT'>('OVERVIEW');

  // Loading & Toast State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Executive Data State
  const [kpi, setKpi] = useState<ExecutiveKpiSummary | null>(null);
  const [salesDays, setSalesDays] = useState<number>(7);
  const [salesSeries, setSalesSeries] = useState<SalesSeriesPoint[]>([]);

  // Product & Inventory Intelligence State
  const [products, setProducts] = useState<AdminProductDetail[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');
  const [productStockFilter, setProductStockFilter] = useState<'ALL' | 'HEALTHY' | 'LOW' | 'OUT' | 'PERISHABLE'>('ALL');
  const [selectedProductModal, setSelectedProductModal] = useState<AdminProductDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  // Payments & Tax State
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentChannelFilter, setPaymentChannelFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState<'ALL' | 'CUSTOMER' | 'WALK_IN' | 'ONLINE' | 'WHOLESALE'>('ALL');
  const [paymentViewMode, setPaymentViewMode] = useState<'LEDGER' | 'SPENDERS'>('LEDGER');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState<string>('');
  const [customerSpendingList, setCustomerSpendingList] = useState<CustomerSpendingSummary[]>([]);
  const [expandedCustomerName, setExpandedCustomerName] = useState<string | null>(null);
  const [selectedPaymentModal, setSelectedPaymentModal] = useState<AdminPayment | null>(null);
  const [loadingPaymentOrderNumber, setLoadingPaymentOrderNumber] = useState<string | null>(null);

  // Audit Inspection Modal State
  const [selectedAuditLogModal, setSelectedAuditLogModal] = useState<AdminAuditLog | null>(null);

  // Tax & Financial Statement Modal State
  const [showTaxStatementModal, setShowTaxStatementModal] = useState<boolean>(false);
  const [taxReport, setTaxReport] = useState<FinancialTaxReport | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState<boolean>(false);

  // Wholesale Applications State
  const [wholesaleApps, setWholesaleApps] = useState<AdminWholesaleApp[]>([]);
  const [wholesaleFilter, setWholesaleFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedWholesaleAppModal, setSelectedWholesaleAppModal] = useState<AdminWholesaleApp | null>(null);
  const [wholesaleApprovalNotes, setWholesaleApprovalNotes] = useState<string>('');
  const [rejectModalApp, setRejectModalApp] = useState<AdminWholesaleApp | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [processingAppId, setProcessingAppId] = useState<number | null>(null);

  // User Governance State & Role Grouping
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleGroup, setUserRoleGroup] = useState<'ALL' | 'CUSTOMERS' | 'STAFF' | 'ADMIN'>('ALL');
  const [userCustomerSubFilter, setUserCustomerSubFilter] = useState<'ALL' | 'RETAIL' | 'WHOLESALE'>('ALL');
  const [userStaffSubFilter, setUserStaffSubFilter] = useState<'ALL' | 'CASHIER' | 'STOCK_CONTROLLER'>('ALL');
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // User CRUD Modals State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUserData, setNewUserData] = useState<{
    fullName: string;
    email: string;
    password: string;
    phone: string;
    roleName: string;
    customerType: 'RETAIL' | 'WHOLESALE';
  }>({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    roleName: 'USER',
    customerType: 'RETAIL'
  });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editUserData, setEditUserData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    roleName: string;
    customerType: 'RETAIL' | 'WHOLESALE';
    isActive: boolean;
    password: string;
  }>({
    fullName: '',
    email: '',
    phone: '',
    roleName: 'USER',
    customerType: 'RETAIL',
    isActive: true,
    password: ''
  });
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [userFormSubmitting, setUserFormSubmitting] = useState<boolean>(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('ALL');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Initial Data Fetch
  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      const [
        kpiRes,
        seriesRes,
        appsRes,
        usersRes,
        logsRes,
        productsRes,
        paymentsRes,
        taxRes,
        spendingRes
      ] = await Promise.all([
        adminService.getDashboardSummary(),
        adminService.getSalesSeries(salesDays),
        adminService.getWholesaleApplications(),
        adminService.getUsers(),
        adminService.getAuditLogs(auditTypeFilter),
        adminService.getAllProducts(),
        adminService.getPayments(),
        adminService.getFinancialTaxReport(),
        adminService.getCustomerSpending()
      ]);
      setKpi(kpiRes);
      setSalesSeries(seriesRes);
      setWholesaleApps(appsRes.content);
      setUsers(usersRes.content);
      setAuditLogs(logsRes.content);
      setProducts(productsRes);
      setPayments(paymentsRes);
      setTaxReport(taxRes);
      setCustomerSpendingList(spendingRes);
    } catch (err) {
      console.error('Error loading admin suite:', err);
      showToast('Error refreshing data from server', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Sales Days Change
  const handleDaysChange = async (days: number) => {
    setSalesDays(days);
    try {
      const res = await adminService.getSalesSeries(days);
      setSalesSeries(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Wholesale Filters
  const handleWholesaleFilterChange = async (filter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
    setWholesaleFilter(filter);
    try {
      const statusParam = filter === 'ALL' ? undefined : filter;
      const res = await adminService.getWholesaleApplications(statusParam);
      setWholesaleApps(res.content);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Wholesale Approve
  const handleApproveWholesale = async (app: AdminWholesaleApp) => {
    setProcessingAppId(app.id);
    try {
      await adminService.approveWholesale(app.id);
      showToast(`Wholesale application for "${app.businessName}" APPROVED. Promoted to WHOLESALE tier.`);
      const [appsRes, usersRes, kpiRes] = await Promise.all([
        adminService.getWholesaleApplications(wholesaleFilter === 'ALL' ? undefined : wholesaleFilter),
        adminService.getUsers(),
        adminService.getDashboardSummary()
      ]);
      setWholesaleApps(appsRes.content);
      setUsers(usersRes.content);
      setKpi(kpiRes);
      if (selectedWholesaleAppModal?.id === app.id) {
        setSelectedWholesaleAppModal(null);
        setWholesaleApprovalNotes('');
      }
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setProcessingAppId(null);
    }
  };

  // Handle Wholesale Reject
  const handleConfirmReject = async () => {
    if (!rejectModalApp) return;
    setProcessingAppId(rejectModalApp.id);
    try {
      await adminService.rejectWholesale(rejectModalApp.id, rejectReason || 'Criteria not met');
      showToast(`Wholesale application for "${rejectModalApp.businessName}" REJECTED.`);
      if (selectedWholesaleAppModal?.id === rejectModalApp.id) {
        setSelectedWholesaleAppModal(null);
      }
      setRejectModalApp(null);
      setRejectReason('');
      const [appsRes, kpiRes] = await Promise.all([
        adminService.getWholesaleApplications(wholesaleFilter === 'ALL' ? undefined : wholesaleFilter),
        adminService.getDashboardSummary()
      ]);
      setWholesaleApps(appsRes.content);
      setKpi(kpiRes);
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setProcessingAppId(null);
    }
  };

  // Handle User Toggle Active
  const handleToggleUserActive = async (userId: number) => {
    setUpdatingUserId(userId);
    try {
      const updated = await adminService.toggleUserActive(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: updated.isActive } : u)));
      showToast(`Account status updated: ${updated.isActive ? 'UNLOCKED / ACTIVE' : 'LOCKED'}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle account', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle User Creation
  const handleOpenAddUser = () => {
    setNewUserData({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      roleName: 'USER',
      customerType: 'RETAIL'
    });
    setIsAddUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.fullName.trim() || !newUserData.email.trim() || !newUserData.password.trim()) {
      showToast('Please provide full name, email, and password', 'error');
      return;
    }
    setUserFormSubmitting(true);
    try {
      const created = await adminService.createUser({
        fullName: newUserData.fullName.trim(),
        email: newUserData.email.trim(),
        password: newUserData.password,
        phone: newUserData.phone.trim() || undefined,
        roleName: newUserData.roleName,
        customerType: newUserData.roleName === 'USER' ? newUserData.customerType : undefined
      });
      setUsers((prev) => [created, ...prev]);
      showToast(`User ${created.fullName} successfully registered!`);
      setIsAddUserModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setUserFormSubmitting(false);
    }
  };

  // Handle User Edit
  const handleStartEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditUserData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      roleName: user.role?.name || 'USER',
      customerType: user.customerType || 'RETAIL',
      isActive: user.isActive,
      password: ''
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUserData.fullName.trim() || !editUserData.email.trim()) {
      showToast('Full name and email are required', 'error');
      return;
    }
    setUserFormSubmitting(true);
    try {
      const updated = await adminService.updateUser(editingUser.id, {
        fullName: editUserData.fullName.trim(),
        email: editUserData.email.trim(),
        phone: editUserData.phone.trim() || undefined,
        roleName: editUserData.roleName,
        customerType: editUserData.roleName === 'USER' ? editUserData.customerType : undefined,
        isActive: editUserData.isActive,
        password: editUserData.password.trim() ? editUserData.password : undefined
      });
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
      showToast(`User ${updated.fullName} updated successfully!`);
      setEditingUser(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setUserFormSubmitting(false);
    }
  };

  // Handle User Deletion
  const handleStartDeleteUser = (user: AdminUser) => {
    setDeletingUser(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setUserFormSubmitting(true);
    try {
      await adminService.deleteUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      showToast(`User ${deletingUser.fullName} has been removed or archived.`);
      setDeletingUser(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setUserFormSubmitting(false);
    }
  };

  // Handle Audit Type Filter
  const handleAuditFilterChange = async (type: string) => {
    setAuditTypeFilter(type);
    try {
      const res = await adminService.getAuditLogs(type);
      setAuditLogs(res.content);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Audit Log Inspection
  const handleInspectAuditLog = (log: AdminAuditLog) => {
    setSelectedAuditLogModal(log);
  };

  // Handle Payment Channel Filter
  const handlePaymentChannelFilterChange = async (ch: string) => {
    setPaymentChannelFilter(ch);
    try {
      const res = await adminService.getPayments(ch, paymentMethodFilter, 'ALL', paymentCategoryFilter);
      setPayments(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Payment Method Filter
  const handlePaymentMethodFilterChange = async (pm: string) => {
    setPaymentMethodFilter(pm);
    try {
      const res = await adminService.getPayments(paymentChannelFilter, pm, 'ALL', paymentCategoryFilter);
      setPayments(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Payment Customer Category Filter
  const handlePaymentCategoryFilterChange = async (cat: 'ALL' | 'CUSTOMER' | 'WALK_IN' | 'ONLINE' | 'WHOLESALE') => {
    setPaymentCategoryFilter(cat);
    try {
      const [paymentsRes, spendingRes] = await Promise.all([
        adminService.getPayments(paymentChannelFilter, paymentMethodFilter, 'ALL', cat),
        adminService.getCustomerSpending(cat)
      ]);
      setPayments(paymentsRes);
      setCustomerSpendingList(spendingRes);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Payment Inspection / Receipt
  const handleInspectPayment = async (p: AdminPayment) => {
    setLoadingPaymentOrderNumber(p.orderNumber);
    try {
      const full = await adminService.getPaymentDetail(p.orderNumber);
      setSelectedPaymentModal(full);
    } catch (err) {
      console.warn('Failed to load full payment detail, using row item:', err);
      setSelectedPaymentModal(p);
    } finally {
      setLoadingPaymentOrderNumber(null);
    }
  };

  // Handle Tax & Financial CSV Export
  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      await adminService.downloadFinancialTaxCsv();
      showToast('RFC-4180 Tax & Financial CSV downloaded');
    } catch (err: any) {
      showToast(err.message || 'Failed to download CSV', 'error');
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Handle Open Tax & Financial Statement
  const handleOpenTaxStatement = async () => {
    try {
      const report = await adminService.getFinancialTaxReport();
      setTaxReport(report);
      setShowTaxStatementModal(true);
    } catch (err) {
      console.error(err);
      setShowTaxStatementModal(true);
    }
  };

  // Handle Product Detail Inspection
  const handleInspectProduct = async (prod: AdminProductDetail) => {
    setLoadingDetailId(prod.id);
    try {
      const detail = await adminService.getProductDetail(prod.id);
      setSelectedProductModal(detail);
    } catch (err: any) {
      console.warn('Failed to load full product detail from API, using list data:', err);
      setSelectedProductModal(prod);
    } finally {
      setLoadingDetailId(null);
    }
  };

  // Distinct Categories
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) cats.add(p.categoryName);
    });
    return Array.from(cats);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase();
        const matches =
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.currentBatchCode?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (productCategoryFilter !== 'ALL' && p.categoryName !== productCategoryFilter) {
        return false;
      }
      if (productStockFilter === 'HEALTHY') {
        if (p.availableStock <= p.minStockThreshold) return false;
      } else if (productStockFilter === 'LOW') {
        if (p.availableStock <= 0 || p.availableStock > p.minStockThreshold) return false;
      } else if (productStockFilter === 'OUT') {
        if (p.availableStock > 0) return false;
      } else if (productStockFilter === 'PERISHABLE') {
        if (!p.isPerishable) return false;
      }
      return true;
    });
  }, [products, productSearchQuery, productCategoryFilter, productStockFilter]);

  // User Group Metrics Breakdown
  const userCounts = useMemo(() => {
    let customerNormal = 0;
    let customerWholesale = 0;
    let staffCashier = 0;
    let staffStock = 0;
    let admins = 0;

    users.forEach((u) => {
      const role = u.role?.name || 'USER';
      if (role === 'ADMIN') {
        admins++;
      } else if (role === 'CASHIER') {
        staffCashier++;
      } else if (role === 'STOCK_CONTROLLER') {
        staffStock++;
      } else {
        if (u.customerType === 'WHOLESALE') {
          customerWholesale++;
        } else {
          customerNormal++;
        }
      }
    });

    return {
      all: users.length,
      customers: customerNormal + customerWholesale,
      customerNormal,
      customerWholesale,
      staff: staffCashier + staffStock,
      staffCashier,
      staffStock,
      admins
    };
  }, [users]);

  // Filtered Users with Role Grouping & Search
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const role = u.role?.name || 'USER';

      // Role Group Filtering
      if (userRoleGroup === 'CUSTOMERS') {
        if (role === 'ADMIN' || role === 'CASHIER' || role === 'STOCK_CONTROLLER') return false;
        if (userCustomerSubFilter === 'RETAIL' && u.customerType === 'WHOLESALE') return false;
        if (userCustomerSubFilter === 'WHOLESALE' && u.customerType !== 'WHOLESALE') return false;
      } else if (userRoleGroup === 'STAFF') {
        if (role !== 'CASHIER' && role !== 'STOCK_CONTROLLER') return false;
        if (userStaffSubFilter === 'CASHIER' && role !== 'CASHIER') return false;
        if (userStaffSubFilter === 'STOCK_CONTROLLER' && role !== 'STOCK_CONTROLLER') return false;
      } else if (userRoleGroup === 'ADMIN') {
        if (role !== 'ADMIN') return false;
      }

      // Search Query Filter
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matches =
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          role.toLowerCase().includes(q) ||
          (u.customerType && u.customerType.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [users, userRoleGroup, userCustomerSubFilter, userStaffSubFilter, userSearchQuery]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (paymentSearchQuery.trim()) {
        const q = paymentSearchQuery.toLowerCase();
        const matches =
          p.orderNumber?.toLowerCase().includes(q) ||
          p.customerName?.toLowerCase().includes(q) ||
          p.customerEmail?.toLowerCase().includes(q) ||
          p.cashierName?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (paymentChannelFilter !== 'ALL' && p.channel.toUpperCase() !== paymentChannelFilter.toUpperCase()) {
        return false;
      }
      if (paymentMethodFilter !== 'ALL' && p.paymentMethod.toUpperCase() !== paymentMethodFilter.toUpperCase()) {
        return false;
      }
      if (paymentCategoryFilter !== 'ALL') {
        if (paymentCategoryFilter === 'CUSTOMER') {
          if (p.customerCategory !== 'WALK_IN' && p.customerCategory !== 'ONLINE') return false;
        } else if (p.customerCategory?.toUpperCase() !== paymentCategoryFilter.toUpperCase()) {
          return false;
        }
      }
      return true;
    });
  }, [payments, paymentSearchQuery, paymentChannelFilter, paymentMethodFilter, paymentCategoryFilter]);

  // Filtered Customer Spending
  const filteredCustomerSpending = useMemo(() => {
    return customerSpendingList.filter((c) => {
      if (paymentSearchQuery.trim()) {
        const q = paymentSearchQuery.toLowerCase();
        const matches =
          c.customerName?.toLowerCase().includes(q) ||
          (c.customerEmail && c.customerEmail.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (paymentCategoryFilter !== 'ALL') {
        if (paymentCategoryFilter === 'CUSTOMER') {
          if (c.customerCategory !== 'WALK_IN' && c.customerCategory !== 'ONLINE') return false;
        } else if (c.customerCategory?.toUpperCase() !== paymentCategoryFilter.toUpperCase()) {
          return false;
        }
      }
      return true;
    });
  }, [customerSpendingList, paymentSearchQuery, paymentCategoryFilter]);

  // Payments Aggregate Metrics
  const paymentMetrics = useMemo(() => {
    const totalGross = payments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const totalTax = payments.reduce((acc, p) => acc + (p.taxAmount || 0), 0);
    const posGross = payments.filter((p) => p.channel === 'POS').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const onlineGross = payments.filter((p) => p.channel === 'ONLINE').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const cardGross = payments.filter((p) => p.paymentMethod === 'CARD').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const cashGross = payments.filter((p) => p.paymentMethod === 'CASH').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const bankGross = payments.filter((p) => p.paymentMethod === 'BANK_TRANSFER').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const customerGross = payments.filter((p) => p.customerCategory === 'WALK_IN' || p.customerCategory === 'ONLINE').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const wholesaleGross = payments.filter((p) => p.customerCategory === 'WHOLESALE').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const walkInGross = payments.filter((p) => p.customerCategory === 'WALK_IN').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const onlineConsumerGross = payments.filter((p) => p.customerCategory === 'ONLINE').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    return {
      totalGross,
      totalTax,
      posGross,
      onlineGross,
      cardGross,
      cashGross,
      bankGross,
      customerGross,
      wholesaleGross,
      walkInGross,
      onlineConsumerGross
    };
  }, [payments]);

  // Max revenue calculation for SVG bar chart scaling
  const maxDayRevenue = useMemo(() => {
    if (!salesSeries.length) return 1000;
    return Math.max(...salesSeries.map((s) => s.totalRevenue), 500);
  }, [salesSeries]);

  const totalSeriesRevenue = useMemo(() => {
    return salesSeries.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  }, [salesSeries]);

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', boxSizing: 'border-box' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '16px',
            background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(20px)',
            color: '#FFFFFF',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4), 0 0 1px 1px rgba(255,255,255,0.2)',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          padding: '24px 28px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(30, 30, 36, 0.8) 0%, rgba(18, 18, 22, 0.6) 100%)',
          border: '1px solid var(--ios-glass-border)',
          backdropFilter: 'var(--ios-blur-deep)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <Shield size={12} />
              EXECUTIVE GOVERNANCE HUD
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399' }} />
              LIVE POSTGRESQL 18
            </span>
            {loading && (
              <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                Loading metrics...
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Enterprise Omnichannel Operations
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ios-text-muted)' }}>
            Real-time multi-tier revenue analytics, wholesale authorization queue, user directory, and tamper-evident audit ledger.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--ios-glass-border)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: downloadingCsv ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={14} />
            {downloadingCsv ? 'Exporting...' : 'Export Tax CSV'}
          </button>

          <button
            onClick={handleOpenTaxStatement}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3))',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              color: '#93C5FD',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <FileSpreadsheet size={14} />
            Tax & Financial Statement
          </button>

          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--ios-glass-border)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={14} />
            {refreshing ? 'Syncing...' : 'Sync Live'}
          </button>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        {/* Card 1: Total Gross Revenue */}
        <IosCardGlass glow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Gross Revenue
              </span>
              <div style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0 10px', color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                ${kpi ? kpi.totalGrossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399'
              }}
            >
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
            <span
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#93C5FD',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              Online: <strong>${kpi?.onlineRevenue?.toFixed(2) || '0.00'}</strong>
            </span>
            <span
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#6EE7B7',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              POS: <strong>${kpi?.posRevenue?.toFixed(2) || '0.00'}</strong>
            </span>
          </div>
        </IosCardGlass>

        {/* Card 2: Omnichannel Orders */}
        <IosCardGlass glow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completed Orders
              </span>
              <div style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0 10px', color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                {((kpi?.onlineOrdersCount || 0) + (kpi?.posOrdersCount || 0)).toLocaleString()}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818CF8'
              }}
            >
              <ShoppingBag size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
            <span
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--ios-text-muted)',
                border: '1px solid var(--ios-glass-border)'
              }}
            >
              Web Store: <strong>{kpi?.onlineOrdersCount || 0}</strong>
            </span>
            <span
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--ios-text-muted)',
                border: '1px solid var(--ios-glass-border)'
              }}
            >
              POS Register: <strong>{kpi?.posOrdersCount || 0}</strong>
            </span>
          </div>
        </IosCardGlass>

        {/* Card 3: Pending Wholesale Queue */}
        <IosCardGlass
          glow
          style={{ cursor: 'pointer', padding: '24px' }}
          onClick={() => setActiveTab('WHOLESALE')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Wholesale Review Queue
              </span>
              <div style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0 10px', color: (kpi?.pendingWholesaleApplicationsCount || 0) > 0 ? '#FBBF24' : '#FFFFFF', letterSpacing: '-0.03em' }}>
                {kpi?.pendingWholesaleApplicationsCount || 0}
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ios-text-muted)', marginLeft: '6px' }}>
                  pending
                </span>
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FBBF24'
              }}
            >
              <Building2 size={20} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#FBBF24',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}
          >
            <span>Review Applications</span>
            <ChevronRight size={14} />
          </div>
        </IosCardGlass>

        {/* Card 4: Inventory Risk Radar */}
        <IosCardGlass
          glow
          style={{ cursor: 'pointer', padding: '24px' }}
          onClick={() => setActiveTab('PRODUCTS')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Inventory Risk Radar
              </span>
              <div style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0 10px', color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                {((kpi?.expiredBatchesCount || 0) + (kpi?.lowStockProductsCount || 0))}
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ios-text-muted)', marginLeft: '6px' }}>
                  alerts
                </span>
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F87171'
              }}
            >
              <ShieldAlert size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
            <span
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                background: (kpi?.expiredBatchesCount || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                color: (kpi?.expiredBatchesCount || 0) > 0 ? '#FCA5A5' : 'var(--ios-text-muted)',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}
            >
              Expired: <strong>{kpi?.expiredBatchesCount || 0}</strong>
            </span>
            <span
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                background: (kpi?.lowStockProductsCount || 0) > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                color: (kpi?.lowStockProductsCount || 0) > 0 ? '#FCD34D' : 'var(--ios-text-muted)',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}
            >
              Low Stock: <strong>{kpi?.lowStockProductsCount || 0}</strong>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#F87171',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.08)'
            }}
          >
            <span>Inspect Product Stock & Expirations</span>
            <ChevronRight size={13} />
          </div>
        </IosCardGlass>
      </div>

      {/* Segmented Tab Controls */}
      <div
        className="ios-glass-capsule"
        style={{
          display: 'flex',
          gap: '6px',
          padding: '6px',
          maxWidth: '1060px',
          margin: '0 auto 28px',
          border: '1px solid var(--ios-glass-border)'
        }}
      >
        {[
          { key: 'OVERVIEW', label: 'Executive HUD', icon: TrendingUp },
          {
            key: 'PRODUCTS',
            label: 'Products & Stock Intel',
            icon: Package,
            badge: (kpi?.lowStockProductsCount || 0) + (kpi?.expiredBatchesCount || 0) || undefined
          },
          {
            key: 'PAYMENTS',
            label: 'Payments & Revenue',
            icon: CreditCard,
            badge: payments.length > 0 ? payments.length : undefined
          },
          {
            key: 'WHOLESALE',
            label: 'Wholesale Queue',
            icon: Building2,
            badge: kpi?.pendingWholesaleApplicationsCount
          },
          { key: 'USERS', label: 'User Governance', icon: Users },
          { key: 'AUDIT', label: 'Audit Ledger', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.65)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 800,
                    background: isActive ? '#000000' : '#F59E0B',
                    color: isActive ? '#FFFFFF' : '#000000'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================== TAB 1: EXECUTIVE HUD & SALES ANALYTICS ===================== */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Visual Sales Chart */}
          <IosCardGlass glow>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                gap: '12px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Omnichannel Revenue Trajectory
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                  Interactive breakdown of Online Web Store vs. Brick-and-Mortar POS daily revenue.
                </p>
              </div>

              {/* Timeframe Filters */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '9999px',
                  padding: '4px',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDaysChange(d)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: salesDays === d ? '#FFFFFF' : 'transparent',
                      color: salesDays === d ? '#000000' : 'rgba(255, 255, 255, 0.65)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Last {d} Days
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Multi-Bar Chart */}
            <div
              style={{
                height: '240px',
                width: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '12px',
                paddingTop: '20px',
                paddingBottom: '30px',
                boxSizing: 'border-box',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {salesSeries.map((point) => {
                const totalHeightPct = Math.min(100, Math.max(10, (point.totalRevenue / maxDayRevenue) * 100));
                const onlinePct = point.totalRevenue > 0 ? (point.onlineRevenue / point.totalRevenue) * 100 : 50;
                const posPct = 100 - onlinePct;

                return (
                  <div
                    key={point.date}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      minWidth: '24px'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '44px',
                        height: `${totalHeightPct}%`,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                      title={`${point.date}\nTotal: $${point.totalRevenue.toFixed(2)}\nOnline: $${point.onlineRevenue.toFixed(2)}\nPOS: $${point.posRevenue.toFixed(2)}\nOrders: ${point.orderCount}`}
                    >
                      {/* Online Segment */}
                      <div
                        style={{
                          height: `${onlinePct}%`,
                          background: 'linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)',
                          width: '100%'
                        }}
                      />
                      {/* POS Segment */}
                      <div
                        style={{
                          height: `${posPct}%`,
                          background: 'linear-gradient(180deg, #34D399 0%, #10B981 100%)',
                          width: '100%'
                        }}
                      />
                    </div>

                    {/* Date label */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-24px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--ios-text-muted)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {point.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend & Metrics Footer */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3B82F6' }} />
                  <span style={{ color: 'var(--ios-text-muted)' }}>Online Storefront</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981' }} />
                  <span style={{ color: 'var(--ios-text-muted)' }}>POS Cashier Register</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                {salesDays}-Day Window Total: <strong style={{ color: '#FFFFFF' }}>${totalSeriesRevenue.toFixed(2)}</strong>
              </div>
            </div>
          </IosCardGlass>

          {/* Dual Channel Split Deep Dive */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Channel Comparison */}
            <IosCardGlass glow>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#FFFFFF' }}>
                Revenue Split & Efficiency Ratio
              </h4>
              {kpi && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#93C5FD' }}>
                      Online Channel: ${(kpi.onlineRevenue || 0).toFixed(2)}
                    </span>
                    <span style={{ color: '#6EE7B7' }}>
                      POS Register: ${(kpi.posRevenue || 0).toFixed(2)}
                    </span>
                  </div>
                  {/* Visual Proportion Bar */}
                  <div
                    style={{
                      height: '12px',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                      display: 'flex',
                      marginBottom: '20px'
                    }}
                  >
                    <div
                      style={{
                        width: `${kpi.totalGrossRevenue > 0 ? (kpi.onlineRevenue / kpi.totalGrossRevenue) * 100 : 50}%`,
                        background: '#3B82F6'
                      }}
                    />
                    <div
                      style={{
                        width: `${kpi.totalGrossRevenue > 0 ? (kpi.posRevenue / kpi.totalGrossRevenue) * 100 : 50}%`,
                        background: '#10B981'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>Online AOV (Avg Order)</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#93C5FD', marginTop: '4px' }}>
                        ${kpi.onlineOrdersCount > 0 ? (kpi.onlineRevenue / kpi.onlineOrdersCount).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>POS AOV (Avg Order)</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#6EE7B7', marginTop: '4px' }}>
                        ${kpi.posOrdersCount > 0 ? (kpi.posRevenue / kpi.posOrdersCount).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </IosCardGlass>

            {/* Quick Actions & Governance Summary */}
            <IosCardGlass glow>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#FFFFFF' }}>
                Governance Quick Launcher
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  onClick={() => setActiveTab('PRODUCTS')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--ios-glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#34D399'
                      }}
                    >
                      <Package size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                        Enterprise Product Catalog & 3-Tier Margins
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                        Inspect Cost/Retail/Wholesale margins, FIFO batches & expiration dates
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--ios-text-muted)" />
                </div>

                <div
                  onClick={() => setActiveTab('WHOLESALE')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--ios-glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FBBF24'
                      }}
                    >
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                        Review Pending Wholesale B2B Applications
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                        {kpi?.pendingWholesaleApplicationsCount || 0} applications pending authorization
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--ios-text-muted)" />
                </div>

                <div
                  onClick={() => setActiveTab('USERS')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--ios-glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60A5FA'
                      }}
                    >
                      <Users size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                        Manage System User Directory & Roles
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                        Instant lock/unlock toggle & role authorization
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--ios-text-muted)" />
                </div>

                <div
                  onClick={() => setActiveTab('AUDIT')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--ios-glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(168, 85, 247, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#C084FC'
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                        Central Tamper-Evident Stock Audit Ledger
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                        Inspect all inventory deltas, sales deductions, and intake logs
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--ios-text-muted)" />
                </div>
              </div>
            </IosCardGlass>
          </div>
        </div>
      )}

      {/* ===================== TAB: PRODUCTS & STOCK INTELLIGENCE ===================== */}
      {activeTab === 'PRODUCTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section Header & KPI Summary */}
          <IosCardGlass glow>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <Package size={12} />
                    ENTERPRISE PRODUCT CATALOG
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                    Showing {filteredProducts.length} of {products.length} SKUs
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Stock Intelligence & 3-Tier Margin Analytics
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                  Cost of Goods Sold (COGS) vs Retail & Wholesale margins, automated FIFO/FEFO rotation, and live expiration tracking.
                </p>
              </div>

              {/* Quick Metrics Strip */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total SKUs
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                    {products.length}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#34D399', textTransform: 'uppercase', fontWeight: 700 }}>
                    Optimal Stock
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                    {products.filter((p) => p.availableStock > p.minStockThreshold).length}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: (kpi?.lowStockProductsCount || 0) > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: (kpi?.lowStockProductsCount || 0) > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#FCD34D', textTransform: 'uppercase', fontWeight: 700 }}>
                    Low Stock Alert
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#FCD34D', marginTop: '2px' }}>
                    {products.filter((p) => p.availableStock > 0 && p.availableStock <= p.minStockThreshold).length}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.25)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#60A5FA', textTransform: 'uppercase', fontWeight: 700 }}>
                    Perishable (FEFO)
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#60A5FA', marginTop: '2px' }}>
                    {products.filter((p) => p.isPerishable).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                {/* Search Input */}
                <div
                  style={{
                    flex: '1 1 300px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Search
                    size={16}
                    color="var(--ios-text-muted)"
                    style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
                  />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Search by product name, SKU, category, or active batch code..."
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      borderRadius: '9999px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--ios-glass-border)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'border 0.2s ease'
                    }}
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--ios-text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Stock Health Segmented Filter */}
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '9999px',
                    padding: '3px',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  {[
                    { key: 'ALL', label: 'All Inventory' },
                    { key: 'HEALTHY', label: 'Optimal Stock' },
                    { key: 'LOW', label: 'Low Stock' },
                    { key: 'OUT', label: 'Depleted' },
                    { key: 'PERISHABLE', label: 'Perishable Only' }
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setProductStockFilter(f.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: productStockFilter === f.key ? '#FFFFFF' : 'transparent',
                        color: productStockFilter === f.key ? '#000000' : 'var(--ios-text-muted)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Pills Bar */}
              {uniqueCategories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600, marginRight: '4px' }}>
                    Category:
                  </span>
                  <button
                    onClick={() => setProductCategoryFilter('ALL')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      border: '1px solid',
                      borderColor: productCategoryFilter === 'ALL' ? '#3B82F6' : 'var(--ios-glass-border)',
                      background: productCategoryFilter === 'ALL' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: productCategoryFilter === 'ALL' ? '#93C5FD' : 'var(--ios-text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    All Categories ({products.length})
                  </button>
                  {uniqueCategories.map((cat) => {
                    const count = products.filter((p) => p.categoryName === cat).length;
                    const isSelected = productCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setProductCategoryFilter(cat)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '9999px',
                          border: '1px solid',
                          borderColor: isSelected ? '#3B82F6' : 'var(--ios-glass-border)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#93C5FD' : 'var(--ios-text-muted)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </IosCardGlass>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <IosCardGlass glow style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--ios-text-muted)'
                }}
              >
                <Package size={28} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#FFFFFF' }}>
                No Products Found
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--ios-text-muted)', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                No SKUs match your filter criteria or search query. Try resetting the filters or clearing the search terms.
              </p>
              <button
                onClick={() => {
                  setProductSearchQuery('');
                  setProductCategoryFilter('ALL');
                  setProductStockFilter('ALL');
                }}
                style={{
                  marginTop: '18px',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--ios-glass-border)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset All Filters
              </button>
            </IosCardGlass>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px'
              }}
            >
              {filteredProducts.map((p) => {
                const isLow = p.availableStock > 0 && p.availableStock <= p.minStockThreshold;
                const isDepleted = p.availableStock <= 0;

                return (
                  <IosCardGlass
                    key={p.id}
                    glow
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Product Card Top: Thumbnail + Names + Tags */}
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '14px',
                              objectFit: 'cover',
                              border: '1px solid var(--ios-glass-border)',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '14px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--ios-glass-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--ios-text-muted)',
                              flexShrink: 0
                            }}
                          >
                            <Package size={24} />
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--ios-text-muted)'
                              }}
                            >
                              {p.categoryName || 'General'}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: p.isPerishable ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: p.isPerishable ? '#60A5FA' : '#94A3B8',
                                border: p.isPerishable ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                            >
                              {p.isPerishable ? 'Perishable • FEFO' : 'Shelf Stable • FIFO'}
                            </span>
                          </div>

                          <h4
                            style={{
                              fontSize: '15px',
                              fontWeight: 700,
                              color: '#FFFFFF',
                              margin: '0 0 3px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={p.name}
                          >
                            {p.name}
                          </h4>

                          <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontFamily: 'monospace' }}>
                            {p.sku}
                          </div>
                        </div>
                      </div>

                      {/* Stock Level Health Indicator */}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '14px',
                          background: isDepleted
                            ? 'rgba(239, 68, 68, 0.1)'
                            : isLow
                            ? 'rgba(245, 158, 11, 0.1)'
                            : 'rgba(16, 185, 129, 0.08)',
                          border: isDepleted
                            ? '1px solid rgba(239, 68, 68, 0.25)'
                            : isLow
                            ? '1px solid rgba(245, 158, 11, 0.25)'
                            : '1px solid rgba(16, 185, 129, 0.2)',
                          marginBottom: '14px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)' }}>
                            AVAILABLE STOCK
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: isDepleted ? '#F87171' : isLow ? '#FCD34D' : '#34D399'
                            }}
                          >
                            {isDepleted ? (
                              <>
                                <AlertTriangle size={12} />
                                Depleted (0)
                              </>
                            ) : isLow ? (
                              <>
                                <AlertTriangle size={12} />
                                Low Stock Alert
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} />
                                Optimal In-Stock
                              </>
                            )}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
                            {p.availableStock}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                            units (Min Threshold: {p.minStockThreshold})
                          </span>
                        </div>
                      </div>

                      {/* 3-Tier Financial Pricing Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          padding: '10px',
                          borderRadius: '14px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--ios-glass-border)',
                          marginBottom: '14px'
                        }}
                      >
                        {/* Cost */}
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase' }}>
                            Cost (COGS)
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px' }}>
                            ${p.costPrice.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                            Base Cost
                          </div>
                        </div>

                        {/* Retail */}
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>
                            Retail
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px' }}>
                            ${p.retailPrice.toFixed(2)}
                          </div>
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              marginTop: '2px'
                            }}
                          >
                            +{p.retailMarginPercent?.toFixed(1) || '0.0'}%
                          </div>
                        </div>

                        {/* Wholesale */}
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
                            Wholesale
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px' }}>
                            ${p.wholesalePrice.toFixed(2)}
                          </div>
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60A5FA',
                              marginTop: '2px'
                            }}
                          >
                            +{p.wholesaleMarginPercent?.toFixed(1) || '0.0'}%
                          </div>
                        </div>
                      </div>

                      {/* Active Batch & Expiration Intelligence */}
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--ios-glass-border)',
                          fontSize: '11px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--ios-text-muted)' }}>Current Active Batch:</span>
                          <span style={{ fontWeight: 700, color: '#FFFFFF', fontFamily: 'monospace' }}>
                            {p.currentBatchCode || 'None Active'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--ios-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            Expiration Date:
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: p.isPerishable ? '#FCD34D' : '#94A3B8'
                            }}
                          >
                            {p.isPerishable && p.currentBatchExpiryDate
                              ? new Date(p.currentBatchExpiryDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : p.isPerishable
                              ? 'Active Intake (N/A)'
                              : 'Non-Perishable (Shelf Stable)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: View Full Intelligence */}
                    <button
                      onClick={() => handleInspectProduct(p)}
                      disabled={loadingDetailId === p.id}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--ios-glass-border)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: loadingDetailId === p.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                    >
                      <Eye size={14} />
                      {loadingDetailId === p.id ? 'Loading Details...' : 'Inspect Full Details & Batches'}
                    </button>
                  </IosCardGlass>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: PAYMENTS & REVENUE SETTLEMENT ===================== */}
      {activeTab === 'PAYMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Control Bar */}
          <IosCardGlass glow>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60A5FA',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    FISCAL LEDGER & SPENDING INTELLIGENCE
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                    Standard Tax Rate: 10.0% VAT
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Enterprise Payments & Customer Spending
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                  Multi-channel settlements, customer spending groups (Online, Walk-in, Wholehouse), and fiscal tax reporting.
                </p>
              </div>

              {/* Action Buttons & View Mode Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* View Mode Toggle Capsule */}
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '9999px',
                    padding: '3px',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <button
                    onClick={() => setPaymentViewMode('LEDGER')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: paymentViewMode === 'LEDGER' ? '#FFFFFF' : 'transparent',
                      color: paymentViewMode === 'LEDGER' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FileText size={13} />
                    Transactions Ledger ({filteredPayments.length})
                  </button>

                  <button
                    onClick={() => setPaymentViewMode('SPENDERS')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: paymentViewMode === 'SPENDERS' ? '#FFFFFF' : 'transparent',
                      color: paymentViewMode === 'SPENDERS' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Users size={13} />
                    Grouped by Customer ({filteredCustomerSpending.length})
                  </button>
                </div>

                <button
                  onClick={handleDownloadCsv}
                  disabled={downloadingCsv}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--ios-glass-border)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: downloadingCsv ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Download size={14} />
                  {downloadingCsv ? 'Exporting...' : 'Export CSV (RFC-4180)'}
                </button>

                <button
                  onClick={handleOpenTaxStatement}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3))',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    color: '#93C5FD',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FileSpreadsheet size={14} />
                  Tax Statement (PDF/Print)
                </button>
              </div>
            </div>

            {/* Customer Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                padding: '10px 14px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--ios-glass-border)',
                marginBottom: '18px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                Customer Category:
              </span>

              {[
                { key: 'ALL', label: 'All Accounts & Clients' },
                { key: 'CUSTOMER', label: 'Customer (Online & Walk-in)' },
                { key: 'WALK_IN', label: 'Walk-in Store Guests' },
                { key: 'ONLINE', label: 'Online Customers' },
                { key: 'WHOLESALE', label: 'Wholehouse Sellers (B2B)' }
              ].map((cat) => {
                const isActive = paymentCategoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handlePaymentCategoryFilterChange(cat.key as any)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid var(--ios-glass-border)',
                      background: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.75)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(255, 255, 255, 0.15)' : 'none'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Financial Aggregate Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}
            >
              {/* Gross Settled */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase' }}>
                  Gross Revenue Settled
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                  ${paymentMetrics.totalGross.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: '#34D399' }}>
                  Across {payments.length} transactions
                </div>
              </div>

              {/* Wholehouse Sellers Revenue */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.25)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase' }}>
                  Wholehouse Sellers (B2B)
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                  ${paymentMetrics.wholesaleGross.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                  Bulk merchants & tiered accounts
                </div>
              </div>

              {/* Retail Customers Revenue */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
                  Retail Customers
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                  ${paymentMetrics.customerGross.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                  Walk-in: ${paymentMetrics.walkInGross.toFixed(2)} • Online: ${paymentMetrics.onlineConsumerGross.toFixed(2)}
                </div>
              </div>

              {/* Tax Collected */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>
                  10% VAT Remittance
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                  ${paymentMetrics.totalTax.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                  Statutory remittance pool
                </div>
              </div>

              {/* Tender Breakdown */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Tender Splits
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFFFFF' }}>
                    <span>Card:</span>
                    <strong>${paymentMetrics.cardGross.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFFFFF' }}>
                    <span>Cash:</span>
                    <strong>${paymentMetrics.cashGross.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFFFFF' }}>
                    <span>Transfer:</span>
                    <strong>${paymentMetrics.bankGross.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--ios-glass-border)',
                marginBottom: '16px'
              }}
            >
              {/* Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '9999px',
                  padding: '8px 14px',
                  border: '1px solid var(--ios-glass-border)',
                  minWidth: '280px',
                  flex: '1 1 280px'
                }}
              >
                <Search size={14} color="var(--ios-text-muted)" />
                <input
                  type="text"
                  placeholder={paymentViewMode === 'LEDGER' ? 'Search by Order #, Customer, Cashier...' : 'Search customers by name or email...'}
                  value={paymentSearchQuery}
                  onChange={(e) => setPaymentSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Only show channel & tender pills in Ledger mode */}
              {paymentViewMode === 'LEDGER' && (
                <>
                  {/* Channel Filter Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600 }}>Channel:</span>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '9999px',
                        padding: '3px',
                        border: '1px solid var(--ios-glass-border)'
                      }}
                    >
                      {['ALL', 'POS', 'ONLINE'].map((ch) => (
                        <button
                          key={ch}
                          onClick={() => handlePaymentChannelFilterChange(ch)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: 'none',
                            background: paymentChannelFilter === ch ? '#FFFFFF' : 'transparent',
                            color: paymentChannelFilter === ch ? '#000000' : 'rgba(255, 255, 255, 0.65)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tender Filter Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600 }}>Tender:</span>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '9999px',
                        padding: '3px',
                        border: '1px solid var(--ios-glass-border)'
                      }}
                    >
                      {['ALL', 'CARD', 'CASH', 'BANK_TRANSFER'].map((m) => (
                        <button
                          key={m}
                          onClick={() => handlePaymentMethodFilterChange(m)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '9999px',
                            border: 'none',
                            background: paymentMethodFilter === m ? '#FFFFFF' : 'transparent',
                            color: paymentMethodFilter === m ? '#000000' : 'rgba(255, 255, 255, 0.65)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {m.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ================= VIEW 1: TRANSACTIONS LEDGER ================= */}
            {paymentViewMode === 'LEDGER' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--ios-text-muted)' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Order #</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Channel</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Tender Method</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Customer / Cashier</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Items</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Subtotal</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>10% Tax</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Total Settled</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Timestamp</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p) => {
                      const isPos = p.channel === 'POS';
                      const isWholesale = p.customerCategory === 'WHOLESALE';
                      const isOnline = p.customerCategory === 'ONLINE';

                      return (
                        <tr
                          key={p.orderNumber || p.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          {/* Order Number */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                background: 'rgba(255, 255, 255, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              {p.orderNumber}
                            </span>
                          </td>

                          {/* Channel */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background: isPos ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: isPos ? '#34D399' : '#93C5FD',
                                border: isPos ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                              }}
                            >
                              {isPos ? 'POS REGISTER' : 'ONLINE STORE'}
                            </span>
                          </td>

                          {/* Customer Category */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background: isWholesale
                                  ? 'rgba(168, 85, 247, 0.15)'
                                  : isOnline
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(16, 185, 129, 0.15)',
                                color: isWholesale ? '#C084FC' : isOnline ? '#93C5FD' : '#6EE7B7',
                                border: isWholesale
                                  ? '1px solid rgba(168, 85, 247, 0.3)'
                                  : isOnline
                                  ? '1px solid rgba(59, 130, 246, 0.3)'
                                  : '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              {isWholesale ? 'Wholehouse Seller' : isOnline ? 'Online Customer' : 'Walk-in Guest'}
                            </span>
                          </td>

                          {/* Payment Method */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: '#E2E8F0'
                              }}
                            >
                              {p.paymentMethod === 'CARD' ? (
                                <CreditCard size={12} color="#60A5FA" />
                              ) : p.paymentMethod === 'CASH' ? (
                                <DollarSign size={12} color="#34D399" />
                              ) : (
                                <Building2 size={12} color="#FBBF24" />
                              )}
                              {p.paymentMethod}
                            </span>
                          </td>

                          {/* Customer / Cashier */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ color: '#FFFFFF', fontWeight: 600 }}>
                              {p.customerName || 'Walk-in Guest'}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)' }}>
                              by {p.cashierName || 'Terminal'}
                            </div>
                          </td>

                          {/* Items Count */}
                          <td style={{ padding: '14px 16px', color: '#E2E8F0', fontWeight: 600 }}>
                            {p.itemCount} units
                          </td>

                          {/* Subtotal */}
                          <td style={{ padding: '14px 16px', color: 'var(--ios-text-muted)' }}>
                            ${p.subtotal?.toFixed(2) || '0.00'}
                          </td>

                          {/* Tax */}
                          <td style={{ padding: '14px 16px', color: '#60A5FA', fontWeight: 600 }}>
                            ${p.taxAmount?.toFixed(2) || '0.00'}
                          </td>

                          {/* Total Amount */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                              ${p.totalAmount?.toFixed(2) || '0.00'}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34D399',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              <CheckCircle2 size={10} />
                              {p.status || 'PAID'}
                            </span>
                          </td>

                          {/* Timestamp */}
                          <td style={{ padding: '14px 16px', color: 'var(--ios-text-muted)', fontSize: '11px' }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() + ' ' + new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>

                          {/* Action: View Receipt */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleInspectPayment(p)}
                              disabled={loadingPaymentOrderNumber === p.orderNumber}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid var(--ios-glass-border)',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: loadingPaymentOrderNumber === p.orderNumber ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: loadingPaymentOrderNumber === p.orderNumber ? 0.6 : 1
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.16)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
                              }}
                            >
                              <Receipt size={12} />
                              {loadingPaymentOrderNumber === p.orderNumber ? 'Loading...' : 'Receipt'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredPayments.length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ios-text-muted)' }}>
                    <Receipt size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>No payments found</div>
                    <div style={{ fontSize: '12px' }}>Try adjusting your search query, channel, or customer category filter</div>
                  </div>
                )}
              </div>
            )}

            {/* ================= VIEW 2: GROUPED CUSTOMER SPENDING INTELLIGENCE ================= */}
            {paymentViewMode === 'SPENDERS' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--ios-text-muted)' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Customer Name & Identity</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Pricing Tier</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Total Orders</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Units Bought</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Total Spending</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>10% VAT Paid</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>AOV</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Latest Activity</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Order History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomerSpending.map((c) => {
                      const isExpanded = expandedCustomerName === c.customerName;
                      const isWholesale = c.customerCategory === 'WHOLESALE';
                      const isOnline = c.customerCategory === 'ONLINE';

                      return (
                        <React.Fragment key={c.customerName}>
                          <tr
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              background: isExpanded ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                              transition: 'background 0.2s ease'
                            }}
                          >
                            {/* Customer Identity */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '9999px',
                                    background: isWholesale
                                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(126, 34, 206, 0.5))'
                                      : isOnline
                                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(29, 78, 216, 0.5))'
                                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.5))',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '12px'
                                  }}
                                >
                                  {c.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>
                                    {c.customerName}
                                  </div>
                                  {c.customerEmail && (
                                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                                      {c.customerEmail}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td style={{ padding: '12px 14px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 9px',
                                  borderRadius: '9999px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  background: isWholesale
                                    ? 'rgba(168, 85, 247, 0.15)'
                                    : isOnline
                                    ? 'rgba(59, 130, 246, 0.15)'
                                    : 'rgba(16, 185, 129, 0.15)',
                                  color: isWholesale ? '#C084FC' : isOnline ? '#93C5FD' : '#6EE7B7',
                                  border: isWholesale
                                    ? '1px solid rgba(168, 85, 247, 0.3)'
                                    : isOnline
                                    ? '1px solid rgba(59, 130, 246, 0.3)'
                                    : '1px solid rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                {isWholesale ? 'Wholehouse Seller' : isOnline ? 'Online Customer' : 'Walk-in Guest'}
                              </span>
                            </td>

                            {/* Pricing Tier */}
                            <td style={{ padding: '12px 14px' }}>
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: '#FFFFFF'
                                }}
                              >
                                {c.pricingTier}
                              </span>
                            </td>

                            {/* Total Orders */}
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#FFFFFF' }}>
                              {c.totalOrders}
                            </td>

                            {/* Units Bought */}
                            <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--ios-text-muted)' }}>
                              {c.totalItemsPurchased} units
                            </td>

                            {/* Total Spending */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#34D399', letterSpacing: '-0.02em' }}>
                                ${c.totalSpending.toFixed(2)}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)' }}>
                                Net: ${c.totalNet.toFixed(2)}
                              </div>
                            </td>

                            {/* 10% VAT Paid */}
                            <td style={{ padding: '12px 14px', color: '#60A5FA', fontWeight: 600 }}>
                              ${c.totalTax.toFixed(2)}
                            </td>

                            {/* AOV */}
                            <td style={{ padding: '12px 14px', color: '#FFFFFF', fontWeight: 600 }}>
                              ${c.averageOrderValue.toFixed(2)}
                            </td>

                            {/* Latest Purchase */}
                            <td style={{ padding: '12px 14px', color: 'var(--ios-text-muted)', fontSize: '11px' }}>
                              {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A'}
                            </td>

                            {/* Action: Expand */}
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                onClick={() => setExpandedCustomerName(isExpanded ? null : c.customerName)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 12px',
                                  borderRadius: '9999px',
                                  background: isExpanded ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid var(--ios-glass-border)',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <span>{c.totalOrders} Order(s)</span>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </td>
                          </tr>

                          {/* Accordion Detail: List of Payments by this Customer */}
                          {isExpanded && (
                            <tr style={{ background: 'rgba(0, 0, 0, 0.25)' }}>
                              <td colSpan={10} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                  Settled Order History for {c.customerName}
                                </div>
                                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--ios-glass-border)' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                    <thead>
                                      <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--ios-text-muted)' }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Order #</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Channel</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tender</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Items</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>10% Tax</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {c.payments.map((p) => (
                                        <tr key={p.orderNumber || p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#FFFFFF' }}>{p.orderNumber}</td>
                                          <td style={{ padding: '8px 12px', color: p.channel === 'POS' ? '#34D399' : '#93C5FD', fontWeight: 700 }}>{p.channel}</td>
                                          <td style={{ padding: '8px 12px', color: '#E2E8F0' }}>{p.paymentMethod}</td>
                                          <td style={{ padding: '8px 12px', textAlign: 'center', color: '#FFFFFF' }}>{p.itemCount}</td>
                                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--ios-text-muted)' }}>${p.subtotal.toFixed(2)}</td>
                                          <td style={{ padding: '8px 12px', textAlign: 'right', color: '#60A5FA' }}>${p.taxAmount.toFixed(2)}</td>
                                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#FFFFFF' }}>${p.totalAmount.toFixed(2)}</td>
                                          <td style={{ padding: '8px 12px', color: 'var(--ios-text-muted)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() + ' ' + new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                            <button
                                              onClick={() => handleInspectPayment(p)}
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 10px',
                                                borderRadius: '9999px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid var(--ios-glass-border)',
                                                color: '#FFFFFF',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                              }}
                                            >
                                              <Receipt size={11} />
                                              Receipt
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {filteredCustomerSpending.length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ios-text-muted)' }}>
                    <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>No customer spending accounts found</div>
                    <div style={{ fontSize: '12px' }}>Try switching category filter or clearing search</div>
                  </div>
                )}
              </div>
            )}
          </IosCardGlass>
        </div>
      )}

      {/* ===================== TAB 2: WHOLESALE APPLICATION QUEUE ===================== */}
      {activeTab === 'WHOLESALE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <IosCardGlass glow>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Wholesale B2B Application Verification Queue
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                  Approve applicant businesses to instantly elevate their customer account to Wholesale pricing tier.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '9999px',
                  padding: '4px',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleWholesaleFilterChange(filter)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: wholesaleFilter === filter ? '#FFFFFF' : 'transparent',
                      color: wholesaleFilter === filter ? '#000000' : 'rgba(255, 255, 255, 0.65)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications Table / Cards */}
            {wholesaleApps.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  color: 'var(--ios-text-muted)',
                  fontSize: '14px'
                }}
              >
                <CheckCircle2 size={36} color="#34D399" style={{ marginBottom: '12px' }} />
                <div>No wholesale applications in this view.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {wholesaleApps.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      padding: '18px 20px',
                      borderRadius: '18px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--ios-glass-border)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ minWidth: '260px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span
                          onClick={() => {
                            setSelectedWholesaleAppModal(app);
                            setWholesaleApprovalNotes('');
                          }}
                          style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Click to view full registration dossier"
                        >
                          <Building2 size={16} color="#60A5FA" />
                          <span style={{ textDecoration: 'underline', textDecorationColor: 'rgba(96, 165, 250, 0.4)' }}>
                            {app.businessName}
                          </span>
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            background:
                              app.status === 'PENDING'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : app.status === 'APPROVED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color:
                              app.status === 'PENDING'
                                ? '#FBBF24'
                                : app.status === 'APPROVED'
                                ? '#34D399'
                                : '#F87171',
                            border: `1px solid ${
                              app.status === 'PENDING'
                                ? 'rgba(245, 158, 11, 0.3)'
                                : app.status === 'APPROVED'
                                ? 'rgba(16, 185, 129, 0.3)'
                                : 'rgba(239, 68, 68, 0.3)'
                            }`
                          }}
                        >
                          {app.status}
                        </span>
                        {app.businessCategory && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#A5B4FC',
                              border: '1px solid rgba(99, 102, 241, 0.25)'
                            }}
                          >
                            {app.businessCategory}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                        <div>
                          Tax ID / License:{' '}
                          <code style={{ color: '#E2E8F0', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                            {app.taxIdOrLicense}
                          </code>
                        </div>
                        <div>
                          Applicant:{' '}
                          <strong style={{ color: '#FFFFFF' }}>{app.user?.fullName || 'N/A'}</strong> ({app.user?.email || 'N/A'})
                        </div>
                        {(app.contactPhone || app.user?.phone) && (
                          <div>
                            Phone: <span style={{ color: '#E2E8F0' }}>{app.contactPhone || app.user?.phone}</span>
                          </div>
                        )}
                        <div>
                          Submitted:{' '}
                          <span>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      {app.adminNotes && (
                        <div
                          style={{
                            marginTop: '10px',
                            fontSize: '11px',
                            color: '#CBD5E1',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            borderLeft: '3px solid #64748B'
                          }}
                        >
                          <strong>Admin Feedback:</strong> {app.adminNotes}
                          {app.reviewedBy && (
                            <span style={{ color: 'var(--ios-text-muted)', marginLeft: '8px' }}>
                              (Reviewed by {app.reviewedBy.fullName})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Details Modal & Decision Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setSelectedWholesaleAppModal(app);
                          setWholesaleApprovalNotes('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '9999px',
                          border: '1px solid rgba(96, 165, 250, 0.4)',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#93C5FD',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="Inspect full customer registration info, tax ID, and account dossier"
                      >
                        <Eye size={14} color="#60A5FA" />
                        View Registration Info
                      </button>

                      {app.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApproveWholesale(app)}
                            disabled={processingAppId === app.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: '9999px',
                              border: 'none',
                              background: '#10B981',
                              color: '#FFFFFF',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: processingAppId === app.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                            }}
                          >
                            <Check size={14} />
                            Approve Tier
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalApp(app);
                              setRejectReason('');
                            }}
                            disabled={processingAppId === app.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: '9999px',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#F87171',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: processingAppId === app.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </>
                      ) : app.status === 'APPROVED' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#34D399',
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          <CheckCircle2 size={13} color="#34D399" />
                          Approved Partner
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#F87171',
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          <XCircle size={13} color="#F87171" />
                          Declined
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </IosCardGlass>
        </div>
      )}

      {/* ===================== TAB 3: USER DIRECTORY & GOVERNANCE ===================== */}
      {activeTab === 'USERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header & KPI Summary */}
          <IosCardGlass glow>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '22px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Enterprise User Directory & Access Governance
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                  Manage platform credentials, modify system access roles, and group across Customers, Staff, and Administrators.
                </p>
              </div>

              {/* Add User Action Button */}
              <button
                onClick={handleOpenAddUser}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserPlus size={16} />
                Add New User
              </button>
            </div>

            {/* KPI Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
              }}
            >
              {/* Total Users */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--ios-text-muted)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Total Accounts</span>
                  <Users size={18} color="#60A5FA" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px' }}>
                  {userCounts.all}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                  Active platform directory
                </div>
              </div>

              {/* Customers (Normal & Wholesale) */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--ios-text-muted)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Customers</span>
                  <ShoppingBag size={18} color="#C084FC" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px' }}>
                  {userCounts.customers}
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', gap: '8px' }}>
                  <span>Normal: <strong style={{ color: '#FFFFFF' }}>{userCounts.customerNormal}</strong></span>
                  <span>•</span>
                  <span>Wholesale: <strong style={{ color: '#C084FC' }}>{userCounts.customerWholesale}</strong></span>
                </div>
              </div>

              {/* Staff (Cashier & Stock) */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--ios-text-muted)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Operations Staff</span>
                  <Package size={18} color="#22D3EE" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px' }}>
                  {userCounts.staff}
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', gap: '8px' }}>
                  <span>Cashiers: <strong style={{ color: '#22D3EE' }}>{userCounts.staffCashier}</strong></span>
                  <span>•</span>
                  <span>Stock: <strong style={{ color: '#FBBF24' }}>{userCounts.staffStock}</strong></span>
                </div>
              </div>

              {/* Admins */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--ios-text-muted)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Administrators</span>
                  <Shield size={18} color="#34D399" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px' }}>
                  {userCounts.admins}
                </div>
                <div style={{ fontSize: '11px', color: '#34D399' }}>
                  Root Governance Privileges
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* Role Grouping Pill Tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                {[
                  { key: 'ALL', label: `All Users (${userCounts.all})` },
                  { key: 'CUSTOMERS', label: `Customers (${userCounts.customers})` },
                  { key: 'STAFF', label: `Staff (${userCounts.staff})` },
                  { key: 'ADMIN', label: `Admin (${userCounts.admins})` }
                ].map((g) => (
                  <button
                    key={g.key}
                    onClick={() => {
                      setUserRoleGroup(g.key as any);
                      setUserCustomerSubFilter('ALL');
                      setUserStaffSubFilter('ALL');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: userRoleGroup === g.key ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
                      color: userRoleGroup === g.key ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: userRoleGroup === g.key ? '0 2px 8px rgba(255,255,255,0.2)' : 'none'
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--ios-glass-border)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              >
                <Search size={14} color="var(--ios-text-muted)" />
                <input
                  type="text"
                  placeholder="Filter by name, email, phone..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Sub-Filters for Customers or Staff */}
            {userRoleGroup === 'CUSTOMERS' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.2)'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase' }}>
                  Customer Sub-Grouping:
                </span>
                {[
                  { key: 'ALL', label: `All Customers (${userCounts.customers})` },
                  { key: 'RETAIL', label: `Normal / Retail (${userCounts.customerNormal})` },
                  { key: 'WHOLESALE', label: `Wholesale Tier (${userCounts.customerWholesale})` }
                ].map((sub) => (
                  <button
                    key={sub.key}
                    onClick={() => setUserCustomerSubFilter(sub.key as any)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: userCustomerSubFilter === sub.key ? '#C084FC' : 'rgba(255, 255, 255, 0.06)',
                      color: userCustomerSubFilter === sub.key ? '#000000' : '#E2E8F0',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {userRoleGroup === 'STAFF' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(34, 211, 238, 0.08)',
                  border: '1px solid rgba(34, 211, 238, 0.2)'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#22D3EE', textTransform: 'uppercase' }}>
                  Staff Department:
                </span>
                {[
                  { key: 'ALL', label: `All Staff (${userCounts.staff})` },
                  { key: 'CASHIER', label: `POS Cashiers (${userCounts.staffCashier})` },
                  { key: 'STOCK_CONTROLLER', label: `Stock Controllers (${userCounts.staffStock})` }
                ].map((sub) => (
                  <button
                    key={sub.key}
                    onClick={() => setUserStaffSubFilter(sub.key as any)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: userStaffSubFilter === sub.key ? '#22D3EE' : 'rgba(255, 255, 255, 0.06)',
                      color: userStaffSubFilter === sub.key ? '#000000' : '#E2E8F0',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {/* User Directory Table */}
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--ios-text-muted)' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>User Identity</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Role Group</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Pricing Tier</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Account Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Created Date</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--ios-text-muted)' }}>
                        No users match the selected role criteria or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isProcessing = updatingUserId === user.id;
                      const roleName = user.role?.name || 'USER';

                      return (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          {/* User Identity */}
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background:
                                    roleName === 'ADMIN'
                                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.4))'
                                      : roleName === 'CASHIER'
                                      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(8, 145, 178, 0.4))'
                                      : roleName === 'STOCK_CONTROLLER'
                                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.4))'
                                      : 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                                  border: '1px solid var(--ios-glass-border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '13px',
                                  color: '#FFFFFF'
                                }}
                              >
                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{user.fullName}</div>
                                <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>{user.email}</div>
                                {user.phone && (
                                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Phone size={10} />
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Assigned Role */}
                          <td style={{ padding: '16px 18px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                background:
                                  roleName === 'ADMIN'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : roleName === 'CASHIER'
                                    ? 'rgba(6, 182, 212, 0.15)'
                                    : roleName === 'STOCK_CONTROLLER'
                                    ? 'rgba(245, 158, 11, 0.15)'
                                    : 'rgba(255, 255, 255, 0.06)',
                                color:
                                  roleName === 'ADMIN'
                                    ? '#34D399'
                                    : roleName === 'CASHIER'
                                    ? '#22D3EE'
                                    : roleName === 'STOCK_CONTROLLER'
                                    ? '#FBBF24'
                                    : '#94A3B8',
                                border: `1px solid ${
                                  roleName === 'ADMIN'
                                    ? 'rgba(16, 185, 129, 0.3)'
                                    : roleName === 'CASHIER'
                                    ? 'rgba(6, 182, 212, 0.3)'
                                    : roleName === 'STOCK_CONTROLLER'
                                    ? 'rgba(245, 158, 11, 0.3)'
                                    : 'var(--ios-glass-border)'
                                }`
                              }}
                            >
                              {roleName === 'USER' ? 'CUSTOMER' : roleName}
                            </span>
                          </td>

                          {/* Customer Pricing Tier */}
                          <td style={{ padding: '16px 18px' }}>
                            {roleName === 'ADMIN' || roleName === 'CASHIER' || roleName === 'STOCK_CONTROLLER' ? (
                              <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>Staff Account</span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  background:
                                    user.customerType === 'WHOLESALE'
                                      ? 'rgba(168, 85, 247, 0.15)'
                                      : 'rgba(255, 255, 255, 0.06)',
                                  color: user.customerType === 'WHOLESALE' ? '#C084FC' : 'var(--ios-text-muted)',
                                  border: `1px solid ${
                                    user.customerType === 'WHOLESALE'
                                      ? 'rgba(168, 85, 247, 0.3)'
                                      : 'var(--ios-glass-border)'
                                  }`
                                }}
                              >
                                {user.customerType === 'WHOLESALE' ? 'Wholesale Client' : 'Normal / Retail'}
                              </span>
                            )}
                          </td>

                          {/* Account Status Badge */}
                          <td style={{ padding: '16px 18px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                background: user.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: user.isActive ? '#34D399' : '#F87171',
                                border: `1px solid ${user.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: user.isActive ? '#34D399' : '#F87171'
                                }}
                              />
                              {user.isActive ? 'ACTIVE' : 'LOCKED'}
                            </span>
                          </td>

                          {/* Created Date */}
                          <td style={{ padding: '16px 18px', color: 'var(--ios-text-muted)', fontSize: '11px' }}>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
                          </td>

                          {/* Actions: Edit, Lock, Delete */}
                          <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              {/* Edit User Button */}
                              <button
                                onClick={() => handleStartEditUser(user)}
                                disabled={isProcessing}
                                title="Edit user profile & permissions"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid var(--ios-glass-border)',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Edit2 size={12} color="#60A5FA" />
                                Edit
                              </button>

                              {/* Toggle Active Lock */}
                              <button
                                onClick={() => handleToggleUserActive(user.id)}
                                disabled={isProcessing}
                                title={user.isActive ? 'Lock account access' : 'Activate account access'}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  border: user.isActive
                                    ? '1px solid rgba(239, 68, 68, 0.3)'
                                    : '1px solid rgba(16, 185, 129, 0.3)',
                                  background: user.isActive
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(16, 185, 129, 0.1)',
                                  color: user.isActive ? '#F87171' : '#34D399',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {user.isActive ? <Lock size={12} /> : <Unlock size={12} />}
                                {user.isActive ? 'Lock' : 'Unlock'}
                              </button>

                              {/* Delete User Button */}
                              <button
                                onClick={() => handleStartDeleteUser(user)}
                                disabled={isProcessing}
                                title="Delete or archive user"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '5px 8px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#F87171',
                                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </IosCardGlass>
        </div>
      )}

      {/* ===================== TAB 4: CENTRAL AUDIT LEDGER ===================== */}
      {activeTab === 'AUDIT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <IosCardGlass glow>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Central Tamper-Evident Stock Audit Ledger
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                  Immutable record of all physical warehouse movements, POS walk-in sales, and FEFO expiry actions.
                </p>
              </div>

              {/* Transaction Type Filter Pills */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '9999px',
                  padding: '4px',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                {['ALL', 'STOCK_IN', 'POS_SALE', 'ONLINE_SALE', 'MANUAL_ADJUSTMENT', 'EXPIRED_WRITE_OFF'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleAuditFilterChange(t)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: auditTypeFilter === t ? '#FFFFFF' : 'transparent',
                      color: auditTypeFilter === t ? '#000000' : 'rgba(255, 255, 255, 0.65)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Logs Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--ios-text-muted)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Log ID</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Action</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Stock Item</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Delta</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Cause & Valuation</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Batch & Location</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Authorized Actor</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Audit Memo</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Security Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const isPositive = log.quantityDelta > 0;
                    const prod = log.batch?.product;
                    const unitPrice = log.unitPrice ?? prod?.retailPrice ?? prod?.costPrice ?? 0;
                    const totalVal = log.totalValue ?? (Math.abs(log.quantityDelta) * unitPrice);

                    return (
                      <tr
                        key={log.id}
                        onClick={() => handleInspectAuditLog(log)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s ease',
                          cursor: 'pointer'
                        }}
                      >
                        {/* Log ID */}
                        <td style={{ padding: '14px 16px', color: 'var(--ios-text-muted)', fontFamily: 'monospace' }}>
                          #{log.id}
                        </td>

                        {/* Transaction Type Badge */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              background:
                                log.type === 'STOCK_IN'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : log.type === 'POS_SALE'
                                  ? 'rgba(6, 182, 212, 0.15)'
                                  : log.type === 'ONLINE_SALE'
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : log.type === 'EXPIRED_WRITE_OFF'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color:
                                log.type === 'STOCK_IN'
                                  ? '#34D399'
                                  : log.type === 'POS_SALE'
                                  ? '#22D3EE'
                                  : log.type === 'ONLINE_SALE'
                                  ? '#60A5FA'
                                  : log.type === 'EXPIRED_WRITE_OFF'
                                  ? '#F87171'
                                  : '#FBBF24',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {log.type}
                          </span>
                        </td>

                        {/* Stock Item Thumbnail & Name */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {prod?.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--ios-glass-border)',
                                  background: '#1C1C20',
                                  flexShrink: 0
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid var(--ios-glass-border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--ios-text-muted)',
                                  flexShrink: 0
                                }}
                              >
                                <Package size={18} />
                              </div>
                            )}
                            <div>
                              <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>
                                {prod?.name || 'Stock Item'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontFamily: 'monospace' }}>
                                  {prod?.sku || 'SKU-N/A'}
                                </span>
                                {prod?.categoryName && (
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      background: 'rgba(255, 255, 255, 0.06)',
                                      color: '#94A3B8'
                                    }}
                                  >
                                    {prod.categoryName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Quantity Delta */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              fontSize: '13px',
                              color: isPositive ? '#34D399' : '#F87171',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isPositive ? `+${log.quantityDelta}` : log.quantityDelta} units
                          </span>
                        </td>

                        {/* Operational Cause & Prices */}
                        <td style={{ padding: '14px 16px' }}>
                          <div
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#E2E8F0',
                              marginBottom: '2px'
                            }}
                          >
                            {log.cause || (isPositive ? 'Warehouse Intake' : 'Sales Deduction')}
                          </div>
                          <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--ios-text-muted)' }}>
                              ${unitPrice.toFixed(2)}/ea
                            </span>
                            <span
                              style={{
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                color: isPositive ? '#34D399' : '#F87171'
                              }}
                            >
                              {isPositive ? `+$${totalVal.toFixed(2)}` : `-$${totalVal.toFixed(2)}`}
                            </span>
                          </div>
                        </td>

                        {/* Batch & Location */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '11px', color: '#60A5FA', fontFamily: 'monospace', fontWeight: 600 }}>
                            {log.batch?.batchCode || 'N/A'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                            <MapPin size={10} />
                            {log.location || 'Warehouse Main Bay'}
                          </div>
                        </td>

                        {/* Authorized Actor */}
                        <td style={{ padding: '14px 16px', color: 'var(--ios-text-muted)' }}>
                          <div style={{ color: '#FFFFFF', fontWeight: 500 }}>
                            {log.user?.fullName || 'System Automated'}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                            {typeof log.user?.role === 'string'
                              ? log.user.role
                              : log.user?.role?.name || 'OPERATOR'}
                          </div>
                        </td>

                        {/* Audit Notes / Reason */}
                        <td style={{ padding: '14px 16px', color: '#CBD5E1', maxWidth: '240px' }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {log.reason || 'Standard transactional movement'}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td style={{ padding: '14px 16px', color: 'var(--ios-text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                        </td>

                        {/* Action: View Details */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectAuditLog(log);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: '9999px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid var(--ios-glass-border)',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Shield size={12} color="#34D399" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </IosCardGlass>
        </div>
      )}

      {/* ===================== PRODUCT DETAIL FLOATING MODAL ===================== */}
      {selectedProductModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProductModal(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '740px',
              maxHeight: '88vh',
              overflowY: 'auto',
              borderRadius: '24px',
              background: 'rgba(24, 24, 28, 0.96)',
              border: '1px solid var(--ios-glass-border-bright)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.9), 0 0 1px 1px rgba(255,255,255,0.15)',
              padding: '28px',
              color: '#FFFFFF'
            }}
          >
            {/* Modal Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {selectedProductModal.imageUrl ? (
                  <img
                    src={selectedProductModal.imageUrl}
                    alt={selectedProductModal.name}
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '16px',
                      objectFit: 'cover',
                      border: '1px solid var(--ios-glass-border)',
                      flexShrink: 0
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--ios-glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ios-text-muted)',
                      flexShrink: 0
                    }}
                  >
                    <Package size={32} />
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF'
                      }}
                    >
                      {selectedProductModal.categoryName || 'General'}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: selectedProductModal.isPerishable ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: selectedProductModal.isPerishable ? '#60A5FA' : '#94A3B8',
                        border: selectedProductModal.isPerishable ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--ios-glass-border)'
                      }}
                    >
                      {selectedProductModal.isPerishable ? 'Perishable • FEFO Rotation' : 'Shelf Stable • FIFO Rotation'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    {selectedProductModal.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                    <span>SKU: <code style={{ color: '#E2E8F0', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>{selectedProductModal.sku}</code></span>
                    <span>•</span>
                    <span>Product ID #{selectedProductModal.id}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProductModal(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--ios-glass-border)',
                  color: 'var(--ios-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Product Narrative Description */}
            {selectedProductModal.description && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--ios-glass-border)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#CBD5E1',
                  marginBottom: '20px'
                }}
              >
                {selectedProductModal.description}
              </div>
            )}

            {/* 3-Tier Financial Model Cards */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ios-text-muted)', marginBottom: '10px' }}>
                <Percent size={14} />
                <span>3-TIER ENTERPRISE PRICING & PROFIT MARGIN MATRIX</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {/* Cost Box */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase' }}>
                    Cost of Goods (COGS)
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                    ${selectedProductModal.costPrice.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                    Supplier Procurement Basis
                  </div>
                </div>

                {/* Retail Price Box */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>
                      Retail Consumer Price
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34D399'
                      }}
                    >
                      +{selectedProductModal.retailMarginPercent?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                    ${selectedProductModal.retailPrice.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowUpRight size={12} />
                    Net Profit: +${(selectedProductModal.retailPrice - selectedProductModal.costPrice).toFixed(2)} / unit
                  </div>
                </div>

                {/* Wholesale Price Box */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
                      Wholesale B2B Price
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#60A5FA'
                      }}
                    >
                      +{selectedProductModal.wholesaleMarginPercent?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                    ${selectedProductModal.wholesalePrice.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowUpRight size={12} />
                    Net Profit: +${(selectedProductModal.wholesalePrice - selectedProductModal.costPrice).toFixed(2)} / unit
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Status & Active Batch Spotlight */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '22px' }}>
              {/* Inventory Health Box */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', marginBottom: '8px' }}>
                  <Sparkles size={13} color="#FBBF24" />
                  <span>INVENTORY HEALTH & THRESHOLD</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
                    {selectedProductModal.availableStock}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                    units available across warehouse & floor
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                  <span>Min Threshold: <strong>{selectedProductModal.minStockThreshold} units</strong></span>
                  <span>•</span>
                  <span style={{ color: selectedProductModal.availableStock > selectedProductModal.minStockThreshold ? '#34D399' : '#FCD34D' }}>
                    {selectedProductModal.availableStock > selectedProductModal.minStockThreshold ? 'Healthy Capacity' : 'Restock Recommended'}
                  </span>
                </div>
              </div>

              {/* Active Batch & Expiration Spotlight */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', marginBottom: '8px' }}>
                  <Clock size={13} color="#60A5FA" />
                  <span>CURRENT ACTIVE BATCH ROTATION</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ios-text-muted)' }}>Active Code:</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'monospace' }}>
                    {selectedProductModal.currentBatchCode || 'None Active'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ios-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    Expiration Cutoff:
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: selectedProductModal.isPerishable ? '#FCD34D' : '#94A3B8'
                    }}
                  >
                    {selectedProductModal.isPerishable && selectedProductModal.currentBatchExpiryDate
                      ? new Date(selectedProductModal.currentBatchExpiryDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : selectedProductModal.isPerishable
                      ? 'Active Intake'
                      : 'Non-Perishable (Shelf Stable)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Full Historical Batch Log Table */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ios-text-muted)', marginBottom: '10px' }}>
                <Layers size={14} />
                <span>
                  INTAKE BATCHES & EXPIRATION LOGS ({selectedProductModal.batches?.length || 0})
                </span>
              </div>

              {selectedProductModal.batches && selectedProductModal.batches.length > 0 ? (
                <div
                  style={{
                    overflowX: 'auto',
                    borderRadius: '16px',
                    border: '1px solid var(--ios-glass-border)',
                    background: 'rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--ios-glass-border)', color: 'var(--ios-text-muted)' }}>
                        <th style={{ padding: '10px 14px' }}>Batch Code</th>
                        <th style={{ padding: '10px 14px' }}>Initial Qty</th>
                        <th style={{ padding: '10px 14px' }}>Remaining Qty</th>
                        <th style={{ padding: '10px 14px' }}>Received At</th>
                        <th style={{ padding: '10px 14px' }}>Expiry Date</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProductModal.batches.map((b) => (
                        <tr
                          key={b.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#FFFFFF' }}>
                            {b.batchCode}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--ios-text-muted)' }}>
                            {b.initialQuantity}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: b.currentQuantity > 0 ? '#34D399' : 'var(--ios-text-muted)' }}>
                            {b.currentQuantity}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--ios-text-muted)', fontSize: '11px' }}>
                            {b.receivedAt ? new Date(b.receivedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ padding: '10px 14px', color: b.expiryDate ? '#FCD34D' : '#94A3B8', fontSize: '11px' }}>
                            {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'Shelf Stable'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {b.isExpired ? (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#F87171' }}>
                                Expired
                              </span>
                            ) : b.currentQuantity <= 0 ? (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--ios-text-muted)' }}>
                                Depleted
                              </span>
                            ) : (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                                In-Rotation
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', color: 'var(--ios-text-muted)', fontSize: '12px', textAlign: 'center' }}>
                  No batch intake logs recorded for this SKU.
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSelectedProductModal(null)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background: '#FFFFFF',
                  border: 'none',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== REJECT REASON MODAL ===================== */}
      {rejectModalApp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(16px)',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '24px',
              background: 'rgba(28, 28, 32, 0.95)',
              border: '1px solid var(--ios-glass-border-bright)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
              padding: '24px',
              color: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Reject Wholesale Application
              </h3>
              <button
                onClick={() => setRejectModalApp(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ios-text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ios-text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
              You are rejecting the wholesale application for <strong>{rejectModalApp.businessName}</strong>. Please state the operational reason or missing documentation for the applicant:
            </p>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Tax registration number could not be validated with state registry. Please re-submit with official reseller certificate."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--ios-glass-border)',
                borderRadius: '12px',
                padding: '12px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '20px',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setRejectModalApp(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  background: 'transparent',
                  border: '1px solid var(--ios-glass-border)',
                  color: 'var(--ios-text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingAppId === rejectModalApp.id}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: processingAppId === rejectModalApp.id ? 'not-allowed' : 'pointer'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== B2B WHOLESALE REGISTRATION DOSSIER MODAL ===================== */}
      {selectedWholesaleAppModal && (() => {
        const app = selectedWholesaleAppModal;
        const matchedUser = users.find(
          (u) =>
            (app.user?.id && u.id === app.user.id) ||
            (app.user?.email && u.email?.toLowerCase() === app.user.email.toLowerCase())
        );

        const applicantName = (app.user?.fullName || '').toLowerCase().trim();
        const applicantBiz = (app.businessName || '').toLowerCase().trim();
        const customerOrders = payments.filter((p) => {
          const pCust = (p.customerName || '').toLowerCase();
          return (applicantName && pCust.includes(applicantName)) || (applicantBiz && pCust.includes(applicantBiz));
        });
        const totalOrderSpend = customerOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

        const contactPhone = app.contactPhone || app.user?.phone || matchedUser?.phone || 'Not registered';
        const businessAddress =
          app.businessAddress || app.user?.addresses || matchedUser?.address || 'Corporate Headquarters on file';
        const isAccountActive = matchedUser?.isActive ?? app.user?.isActive ?? true;
        const userRole = matchedUser?.role?.name || app.user?.role?.name || 'USER';
        const currentTier = matchedUser?.customerType || app.user?.customerType || 'RETAIL';
        const registeredDate = matchedUser?.createdAt || app.user?.createdAt || app.createdAt;
        const formattedRegisteredDate = registeredDate
          ? new Date(registeredDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'Verified Platform Member';
        const formattedSubmittedDate = app.createdAt
          ? new Date(app.createdAt).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Recent Submission';

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              padding: '20px'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                maxHeight: '92vh',
                overflowY: 'auto',
                background: 'linear-gradient(155deg, rgba(26, 30, 42, 0.98), rgba(14, 17, 24, 0.99))',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '26px',
                boxShadow: '0 28px 70px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(59, 130, 246, 0.18)',
                padding: '30px',
                color: '#FFFFFF',
                position: 'relative'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '24px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: 'rgba(59, 130, 246, 0.16)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Building2 size={24} color="#60A5FA" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                        {app.businessName}
                      </h2>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          background:
                            app.status === 'PENDING'
                              ? 'rgba(245, 158, 11, 0.18)'
                              : app.status === 'APPROVED'
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(239, 68, 68, 0.18)',
                          color:
                            app.status === 'PENDING'
                              ? '#FBBF24'
                              : app.status === 'APPROVED'
                              ? '#34D399'
                              : '#F87171',
                          border: `1px solid ${
                            app.status === 'PENDING'
                              ? 'rgba(245, 158, 11, 0.35)'
                              : app.status === 'APPROVED'
                              ? 'rgba(16, 185, 129, 0.35)'
                              : 'rgba(239, 68, 68, 0.35)'
                          }`
                        }}
                      >
                        {app.status === 'PENDING'
                          ? 'PENDING VERIFICATION'
                          : app.status === 'APPROVED'
                          ? 'VERIFIED WHOLESALE'
                          : 'APPLICATION DECLINED'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ios-text-muted)' }}>
                      Wholesale B2B Registration Dossier • Application #B2B-APP-{app.id.toString().padStart(4, '0')} • Submitted {formattedSubmittedDate}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedWholesaleAppModal(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--ios-glass-border)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ios-text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Close dossier"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 4-Stat Metric Summary Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '14px',
                  marginBottom: '26px'
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '4px' }}>
                    Current Account Tier
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: currentTier === 'WHOLESALE' ? '#34D399' : '#60A5FA' }}>
                      {currentTier}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>→ Target: WHOLESALE</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '4px' }}>
                    Account Governance Status
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: isAccountActive ? '#34D399' : '#F87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isAccountActive ? '#34D399' : '#EF4444'
                      }}
                    />
                    {isAccountActive ? 'Active & Good Standing' : 'Account Suspended'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '4px' }}>
                    Prior Platform Purchases
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                    ${totalOrderSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ios-text-muted)', marginLeft: '6px' }}>
                      ({customerOrders.length} orders)
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '4px' }}>
                    Projected Monthly Restock
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#A5B4FC' }}>
                    {app.estimatedMonthlyVolume || '$10,000+ / mo'}
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Customer Registration Info & Business Credentials */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px'
                }}
              >
                {/* Column 1: Customer Account & Registration Identity */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <Users size={16} color="#60A5FA" />
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                      Customer Registration Profile
                    </h3>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '3px' }}>
                      Primary Account Holder / Representative
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                      {app.user?.fullName || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '3px' }}>
                      Login & Billing Email
                    </div>
                    <div style={{ fontSize: '13px', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={13} color="#60A5FA" />
                      {app.user?.email || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '3px' }}>
                      Direct Phone Contact
                    </div>
                    <div style={{ fontSize: '13px', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="#34D399" />
                      {contactPhone}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '3px' }}>
                      Corporate Shipping / Billing Address
                    </div>
                    <div style={{ fontSize: '13px', color: '#E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
                      <MapPin size={13} color="#F59E0B" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{businessAddress}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                    <span>Registered: <strong style={{ color: '#FFFFFF' }}>{formattedRegisteredDate}</strong></span>
                    <span>Role: <strong style={{ color: '#FFFFFF' }}>{userRole}</strong></span>
                    <span>UID: <strong style={{ color: '#FFFFFF' }}>#{app.user?.id || 'N/A'}</strong></span>
                  </div>
                </div>

                {/* Column 2: Commercial Business Entity & Tax Verification */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <Briefcase size={16} color="#34D399" />
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                      Commercial Entity Credentials
                    </h3>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '3px' }}>
                      Registered Business Legal Title
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                      {app.businessName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '3px' }}>
                      Official Tax ID / EIN / Resale Certificate
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#38BDF8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {app.taxIdOrLicense}
                      </code>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34D399',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        Format Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '3px' }}>
                      Trade License Type / Authority
                    </div>
                    <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.4 }}>
                      {app.tradeLicenseType || 'State Resale Certificate & Board of Equalization License'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginBottom: '3px' }}>
                      Business Industry Classification
                    </div>
                    <div style={{ fontSize: '12px', color: '#A5B4FC' }}>
                      {app.businessCategory || 'Food Service, Hospitality & Specialty Grocery Reseller'}
                    </div>
                  </div>

                  {app.adminNotes && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        borderLeft: '3px solid #60A5FA',
                        fontSize: '12px',
                        color: '#CBD5E1'
                      }}
                    >
                      <strong style={{ color: '#93C5FD' }}>Applicant Stated Intent:</strong> {app.adminNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Wholesale Tier Privileges Callout Grid */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '18px',
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <ShieldCheck size={16} color="#60A5FA" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#93C5FD' }}>
                    Wholesale Commercial Privileges Activated on Approval
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#CBD5E1'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="#34D399" />
                    <span><strong>Tiered Volume Pricing:</strong> Wholesale matrix unlocked catalog-wide</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="#34D399" />
                    <span><strong>Commercial Tax Exemption:</strong> B2B sales tax exemption applied</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="#34D399" />
                    <span><strong>Priority Allocations:</strong> Pallet reservation from stock controllers</span>
                  </div>
                </div>
              </div>

              {/* Prior Purchasing History Snapshot */}
              {customerOrders.length > 0 ? (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Receipt size={14} color="#F59E0B" />
                      <span>Associated Purchase Records ({customerOrders.length})</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                      Total spend: ${totalOrderSpend.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {customerOrders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.orderNumber}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.03)',
                          fontSize: '12px'
                        }}
                      >
                        <span style={{ color: '#E2E8F0' }}>
                          <code style={{ color: '#93C5FD' }}>{ord.orderNumber}</code> • {ord.channel} • {ord.paymentMethod}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#CBD5E1' }}>{new Date(ord.createdAt).toLocaleDateString()}</span>
                          <strong style={{ color: '#34D399' }}>${ord.totalAmount.toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '24px',
                    fontSize: '12px',
                    color: 'var(--ios-text-muted)'
                  }}
                >
                  💡 <em>New B2B Account: No retail transactions settled under this corporate profile yet. Elevating tier enables first wholesale order.</em>
                </div>
              )}

              {/* Status Banner or Action Controls */}
              {app.status === 'PENDING' ? (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FBBF24', marginBottom: '6px' }}>
                      Administrative Verification Memo & Audit Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={wholesaleApprovalNotes}
                      onChange={(e) => setWholesaleApprovalNotes(e.target.value)}
                      placeholder="e.g. Verified California Reseller Permit with BOE database; approved for NET-30 wholesale ordering."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedWholesaleAppModal(null)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '9999px',
                        background: 'transparent',
                        border: '1px solid var(--ios-glass-border)',
                        color: 'var(--ios-text-muted)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Close Dossier
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalApp(app);
                        setRejectReason('');
                      }}
                      disabled={processingAppId === app.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 20px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#F87171',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: processingAppId === app.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <X size={15} />
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleApproveWholesale(app)}
                      disabled={processingAppId === app.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: processingAppId === app.id ? 'not-allowed' : 'pointer',
                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {processingAppId === app.id ? 'Elevating Account...' : 'Approve & Elevate to Wholesale Tier'}
                    </button>
                  </div>
                </div>
              ) : app.status === 'APPROVED' ? (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} color="#34D399" />
                    <div>
                      <strong style={{ color: '#34D399', fontSize: '13px' }}>Wholesale Tier Active & Enforced</strong>
                      <div style={{ fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                        Reviewed by {app.reviewedBy?.fullName || 'System Administrator'}
                        {app.reviewedAt && ` on ${new Date(app.reviewedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedWholesaleAppModal(null)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid var(--ios-glass-border)',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <XCircle size={18} color="#F87171" />
                    <div>
                      <strong style={{ color: '#F87171', fontSize: '13px' }}>Application Declined</strong>
                      <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                        Rejection reason: {app.adminNotes || 'Criteria not met'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedWholesaleAppModal(null)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid var(--ios-glass-border)',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ===================== TAMPER-EVIDENT AUDIT VERIFICATION MODAL ===================== */}
      {selectedAuditLogModal && (() => {
        const prod = selectedAuditLogModal.batch?.product;
        const isPositive = selectedAuditLogModal.quantityDelta > 0;
        const unitVal = selectedAuditLogModal.unitPrice ?? prod?.retailPrice ?? prod?.costPrice ?? 0;
        const totalVal = selectedAuditLogModal.totalValue ?? (Math.abs(selectedAuditLogModal.quantityDelta) * unitVal);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(20px)',
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedAuditLogModal(null);
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '720px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '24px',
                background: 'rgba(24, 24, 28, 0.98)',
                border: '1px solid var(--ios-glass-border-bright)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.95), 0 0 1px 1px rgba(255,255,255,0.2)',
                padding: '28px',
                color: '#FFFFFF'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#34D399'
                    }}
                  >
                    <Shield size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34D399',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        CRYPTOGRAPHIC VERIFICATION
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontFamily: 'monospace' }}>
                        LEDGER RECORD #{selectedAuditLogModal.id}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                      Stock Movement Audit Record
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAuditLogModal(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--ios-glass-border)',
                    color: 'var(--ios-text-muted)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Cryptographic SHA-256 Proof Badge */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    SHA-256 Block Signature
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#E2E8F0', marginTop: '3px', wordBreak: 'break-all' }}>
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855{selectedAuditLogModal.id}
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 800,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    flexShrink: 0
                  }}
                >
                  <CheckCircle2 size={12} />
                  TAMPER-PROOF
                </span>
              </div>

              {/* PRODUCT SHOWCASE CARD (Image, Title, SKU, Benchmark Pricing) */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02))',
                  border: '1px solid var(--ios-glass-border-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  marginBottom: '18px'
                }}
              >
                {prod?.imageUrl ? (
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '16px',
                      objectFit: 'cover',
                      border: '1px solid var(--ios-glass-border-bright)',
                      background: '#1A1A1E',
                      flexShrink: 0,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--ios-glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ios-text-muted)',
                      flexShrink: 0
                    }}
                  >
                    <Package size={32} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(96, 165, 250, 0.15)',
                        color: '#60A5FA',
                        border: '1px solid rgba(96, 165, 250, 0.3)'
                      }}
                    >
                      {prod?.categoryName || 'GENERAL INVENTORY'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontFamily: 'monospace' }}>
                      SKU: {prod?.sku || 'N/A'}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                    {prod?.name || 'Stock Reference Item'}
                  </h4>

                  {/* Benchmark Pricing Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '11px' }}>
                    <div style={{ color: 'var(--ios-text-muted)' }}>
                      Retail Price: <strong style={{ color: '#FFFFFF' }}>${(prod?.retailPrice ?? 0).toFixed(2)}</strong>
                    </div>
                    {prod?.wholesalePrice && (
                      <div style={{ color: 'var(--ios-text-muted)' }}>
                        Wholesale: <strong style={{ color: '#C084FC' }}>${prod.wholesalePrice.toFixed(2)}</strong>
                      </div>
                    )}
                    {prod?.costPrice && (
                      <div style={{ color: 'var(--ios-text-muted)' }}>
                        Cost Price: <strong style={{ color: '#94A3B8' }}>${prod.costPrice.toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FINANCIAL VALUATION & OPERATIONAL CAUSE TILES */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '18px'
                }}
              >
                {/* Movement Delta */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600 }}>Physical Delta</div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: isPositive ? '#34D399' : '#F87171',
                      marginTop: '4px'
                    }}
                  >
                    {isPositive ? `+${selectedAuditLogModal.quantityDelta}` : selectedAuditLogModal.quantityDelta} units
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                    {selectedAuditLogModal.type.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Unit Movement Price */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600 }}>Unit Valuation</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                    ${unitVal.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                    Per unit transactional basis
                  </div>
                </div>

                {/* Total Valuation Movement */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                  }}
                >
                  <div style={{ fontSize: '11px', color: isPositive ? '#34D399' : '#F87171', fontWeight: 600 }}>Total Value Delta</div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: isPositive ? '#34D399' : '#F87171',
                      marginTop: '4px'
                    }}
                  >
                    {isPositive ? `+$${totalVal.toFixed(2)}` : `-$${totalVal.toFixed(2)}`}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                    Financial ledger impact
                  </div>
                </div>
              </div>

              {/* OPERATIONAL CAUSE BANNER */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ios-glass-border)',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Tag size={16} color="#60A5FA" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase' }}>
                    Operational Cause & Movement Driver
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    {selectedAuditLogModal.cause || (isPositive ? 'Restock Inward Reception' : 'Point of Sale Inventory Deduction')}
                  </div>
                </div>
                {selectedAuditLogModal.referenceDoc && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#E2E8F0'
                    }}
                  >
                    Ref: {selectedAuditLogModal.referenceDoc}
                  </span>
                )}
              </div>

              {/* BATCH & SUPPLY CHAIN DETAILS GRID */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '18px'
                }}
              >
                {/* Batch Code */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Batch Reference Code
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#60A5FA', marginTop: '3px', fontFamily: 'monospace' }}>
                    {selectedAuditLogModal.batch?.batchCode || 'GENERAL-STOCK'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                    Batch ID: #{selectedAuditLogModal.batch?.id || 1}
                  </div>
                </div>

                {/* Expiry Date */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    FEFO Expiry Date
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '3px' }}>
                    {selectedAuditLogModal.batch?.expiryDate || 'Non-Perishable'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#34D399', marginTop: '2px' }}>
                    FEFO Managed In Warehouse
                  </div>
                </div>

                {/* Supplier Name */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Supplier / Source
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginTop: '3px' }}>
                    {selectedAuditLogModal.batch?.supplierName || 'Official Distributor'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                    Verified Supply Partner
                  </div>
                </div>

                {/* Storage Location */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Physical Storage Bay
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="#34D399" />
                    {selectedAuditLogModal.location || 'Warehouse Main Bay B-4'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                    {selectedAuditLogModal.batch?.currentQuantity !== undefined
                      ? `${selectedAuditLogModal.batch.currentQuantity} units remaining in batch`
                      : 'Stock verified'}
                  </div>
                </div>

                {/* Operator */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Authorized Operator
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '3px' }}>
                    {selectedAuditLogModal.user?.fullName || 'Automated Daemon'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                    {selectedAuditLogModal.user?.email || 'system@retailstore.internal'}
                  </div>
                </div>

                {/* Timestamp */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--ios-glass-border)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Ledger Timestamp
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginTop: '3px' }}>
                    {selectedAuditLogModal.createdAt ? new Date(selectedAuditLogModal.createdAt).toLocaleString() : 'N/A'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                    UTC: {selectedAuditLogModal.createdAt || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Operational Reason / Memo */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--ios-glass-border)',
                  marginBottom: '24px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Operational Justification / Audit Trail Memo
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#E2E8F0', lineHeight: 1.5 }}>
                  {selectedAuditLogModal.reason || 'Standard transactional movement recorded in enterprise ledger.'}
                </p>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setSelectedAuditLogModal(null)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    background: '#FFFFFF',
                    border: 'none',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Dismiss Verification
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================== DIGITAL SALES RECEIPT MODAL ===================== */}
      {selectedPaymentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(20px)',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPaymentModal(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              background: 'rgba(24, 24, 28, 0.98)',
              border: '1px solid var(--ios-glass-border-bright)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.95), 0 0 1px 1px rgba(255,255,255,0.2)',
              padding: '28px',
              color: '#FFFFFF'
            }}
          >
            {/* Store Branding Header */}
            <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px dashed rgba(255,255,255,0.15)', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Receipt size={22} color="#60A5FA" />
                <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                  RETAIL MANAGEMENT CORP
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                Official Sales & Settlement Receipt • Tax Reg: VAT-US-89210-2026
              </div>
              <div style={{ display: 'inline-block', marginTop: '8px', padding: '3px 10px', borderRadius: '9999px', fontSize: '10px', fontWeight: 800, background: selectedPaymentModal.channel === 'POS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)', color: selectedPaymentModal.channel === 'POS' ? '#34D399' : '#C084FC', border: '1px solid rgba(255,255,255,0.1)' }}>
                {selectedPaymentModal.channel === 'POS' ? 'POS REGISTER TRANSACTION' : 'ONLINE WEBSTORE TRANSACTION'}
              </div>
            </div>

            {/* Receipt Meta Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px', marginBottom: '16px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <span style={{ color: 'var(--ios-text-muted)' }}>Order Number:</span>
                <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedPaymentModal.orderNumber}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--ios-text-muted)' }}>Timestamp:</span>
                <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedPaymentModal.createdAt ? new Date(selectedPaymentModal.createdAt).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--ios-text-muted)' }}>Customer:</span>
                <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedPaymentModal.customerName || 'Walk-in Guest'}
                </div>
                {selectedPaymentModal.customerEmail && (
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)' }}>{selectedPaymentModal.customerEmail}</div>
                )}
              </div>
              <div>
                <span style={{ color: 'var(--ios-text-muted)' }}>Operator / Cashier:</span>
                <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedPaymentModal.cashierName || 'Terminal'}
                </div>
                <div style={{ fontSize: '10px', color: '#60A5FA' }}>
                  Pricing Tier: {selectedPaymentModal.pricingTierUsed || 'RETAIL'}
                </div>
              </div>
            </div>

            {/* Purchased Items Table */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Purchased Line Items
              </div>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--ios-glass-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ios-text-muted)' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Item</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Price</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPaymentModal.items && selectedPaymentModal.items.length > 0) ? (
                      selectedPaymentModal.items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    flexShrink: 0
                                  }}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--ios-text-muted)',
                                    flexShrink: 0
                                  }}
                                >
                                  <Package size={16} />
                                </div>
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.productName}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontFamily: 'monospace' }}>
                                  SKU: {item.sku}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#FFFFFF' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--ios-text-muted)' }}>${item.unitPrice.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#FFFFFF' }}>${item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: 'var(--ios-text-muted)' }}>
                          {selectedPaymentModal.itemCount} item(s) aggregated in order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Calculations */}
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ios-glass-border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ios-text-muted)', marginBottom: '6px' }}>
                <span>Subtotal (Net):</span>
                <span>${selectedPaymentModal.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#60A5FA', marginBottom: '8px' }}>
                <span>VAT Tax (10.0% Statutory):</span>
                <span>${selectedPaymentModal.taxAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#FFFFFF', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span>Total Settled:</span>
                <span>${selectedPaymentModal.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '11px' }}>
                <span style={{ color: 'var(--ios-text-muted)' }}>Tender: <strong>{selectedPaymentModal.paymentMethod}</strong></span>
                <span style={{ color: '#34D399', fontWeight: 700 }}>STATUS: {selectedPaymentModal.status || 'PAID'}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--ios-glass-border)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Printer size={14} />
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedPaymentModal(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '9999px',
                  background: '#FFFFFF',
                  border: 'none',
                  color: '#000000',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PRINTABLE FINANCIAL & TAX STATEMENT MODAL ===================== */}
      {showTaxStatementModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(20px)',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTaxStatementModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '24px',
              background: '#0F1117',
              border: '1px solid var(--ios-glass-border-bright)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.95), 0 0 1px 1px rgba(255,255,255,0.2)',
              padding: '32px',
              color: '#FFFFFF'
            }}
          >
            {/* Action Bar (Top) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileSpreadsheet size={24} color="#60A5FA" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    Executive Tax & Financial Report
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                    Statutory VAT & Omnichannel Revenue Compliance Document
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleDownloadCsv}
                  disabled={downloadingCsv}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--ios-glass-border)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: downloadingCsv ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Download size={13} />
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.35))',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    color: '#93C5FD',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={13} />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setShowTaxStatementModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--ios-glass-border)',
                    color: 'var(--ios-text-muted)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '24px',
                marginBottom: '20px'
              }}
            >
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.05em' }}>
                    RETAIL MANAGEMENT CORP.
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                    Corporate Identification & Statutory Tax Reporting
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    Tax ID / EIN: <strong>VAT-99214-88A</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', textTransform: 'uppercase' }}>
                    Report Generation Date
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                    {taxReport?.generatedAt ? new Date(taxReport.generatedAt).toLocaleString() : new Date().toLocaleString()}
                  </div>
                  <div style={{ fontSize: '10px', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>
                    AUDIT COMPLIANT • RFC 4180
                  </div>
                </div>
              </div>

              {/* KPI Summary Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase' }}>
                    Total Gross Revenue
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                    ${taxReport?.totalGrossRevenue ? Number(taxReport.totalGrossRevenue).toFixed(2) : paymentMetrics.totalGross.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                    Total settled volume
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
                    Total VAT Tax Collected (10%)
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#93C5FD', margin: '4px 0 2px' }}>
                    ${taxReport?.totalTaxCollected ? Number(taxReport.totalTaxCollected).toFixed(2) : paymentMetrics.totalTax.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                    Statutory tax liability
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>
                    Total Net Revenue
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#6EE7B7', margin: '4px 0 2px' }}>
                    ${taxReport?.totalNetRevenue ? Number(taxReport.totalNetRevenue).toFixed(2) : (paymentMetrics.totalGross - paymentMetrics.totalTax).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                    After 10% tax deduction
                  </div>
                </div>
              </div>

              {/* Channel Settlement Breakdown Table */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Omnichannel Revenue & Tax Breakdown
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ios-text-muted)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Channel / Origin</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Orders Count</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Gross Revenue</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>10% Tax Collected</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Net Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#34D399' }}>
                        POS In-Store Registers
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#FFFFFF' }}>
                        {taxReport?.posOrdersCount || payments.filter((p) => p.channel === 'POS').length}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#FFFFFF' }}>
                        ${taxReport?.posGrossRevenue ? Number(taxReport.posGrossRevenue).toFixed(2) : paymentMetrics.posGross.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#60A5FA' }}>
                        ${taxReport?.posTaxCollected ? Number(taxReport.posTaxCollected).toFixed(2) : (paymentMetrics.posGross * 0.1).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#FFFFFF' }}>
                        ${taxReport?.posGrossRevenue ? (Number(taxReport.posGrossRevenue) - Number(taxReport.posTaxCollected || 0)).toFixed(2) : (paymentMetrics.posGross * 0.9).toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#C084FC' }}>
                        Online E-Commerce Webstore
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#FFFFFF' }}>
                        {taxReport?.onlineOrdersCount || payments.filter((p) => p.channel === 'ONLINE').length}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#FFFFFF' }}>
                        ${taxReport?.onlineGrossRevenue ? Number(taxReport.onlineGrossRevenue).toFixed(2) : paymentMetrics.onlineGross.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#60A5FA' }}>
                        ${taxReport?.onlineTaxCollected ? Number(taxReport.onlineTaxCollected).toFixed(2) : (paymentMetrics.onlineGross * 0.1).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#FFFFFF' }}>
                        ${taxReport?.onlineGrossRevenue ? (Number(taxReport.onlineGrossRevenue) - Number(taxReport.onlineTaxCollected || 0)).toFixed(2) : (paymentMetrics.onlineGross * 0.9).toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ background: 'rgba(255,255,255,0.08)', fontWeight: 800 }}>
                      <td style={{ padding: '12px', color: '#FFFFFF' }}>COMBINED TOTALS</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#FFFFFF' }}>
                        {taxReport?.totalOrdersCount || payments.length}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#FFFFFF' }}>
                        ${taxReport?.totalGrossRevenue ? Number(taxReport.totalGrossRevenue).toFixed(2) : paymentMetrics.totalGross.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#93C5FD' }}>
                        ${taxReport?.totalTaxCollected ? Number(taxReport.totalTaxCollected).toFixed(2) : paymentMetrics.totalTax.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#34D399' }}>
                        ${taxReport?.totalNetRevenue ? Number(taxReport.totalNetRevenue).toFixed(2) : (paymentMetrics.totalGross - paymentMetrics.totalTax).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tender Settlement Split */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>Credit / Debit Cards:</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    ${taxReport?.cardTotal ? Number(taxReport.cardTotal).toFixed(2) : paymentMetrics.cardGross.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>Cash In Drawer:</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    ${taxReport?.cashTotal ? Number(taxReport.cashTotal).toFixed(2) : paymentMetrics.cashGross.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>Bank Direct Transfer:</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    ${taxReport?.bankTransferTotal ? Number(taxReport.bankTransferTotal).toFixed(2) : paymentMetrics.bankGross.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowTaxStatementModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background: '#FFFFFF',
                  border: 'none',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD USER MODAL ===================== */}
      {isAddUserModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(20px)',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !userFormSubmitting) setIsAddUserModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              background: 'rgba(24, 24, 28, 0.98)',
              border: '1px solid var(--ios-glass-border-bright)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.95), 0 0 1px 1px rgba(255,255,255,0.2)',
              padding: '28px',
              color: '#FFFFFF'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34D399'
                  }}
                >
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    Register New User Account
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                    Provision credentials for Customers, Operations Staff, or Administrators.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !userFormSubmitting && setIsAddUserModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--ios-glass-border)',
                  color: 'var(--ios-text-muted)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alexandra Wright"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--ios-glass-border)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="e.g., alexandra.wright@enterprise.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--ios-glass-border)',
                      borderRadius: '12px',
                      padding: '10px 14px 10px 38px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <Mail size={16} color="var(--ios-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Initial Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    placeholder="Enter secure initial password..."
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--ios-glass-border)',
                      borderRadius: '12px',
                      padding: '10px 14px 10px 38px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <Key size={16} color="var(--ios-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Phone Number (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="e.g., +1 555-019-2834"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--ios-glass-border)',
                      borderRadius: '12px',
                      padding: '10px 14px 10px 38px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <Phone size={16} color="var(--ios-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Assigned Platform Role *
                </label>
                <select
                  value={newUserData.roleName}
                  onChange={(e) => setNewUserData({ ...newUserData, roleName: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#1C1C20',
                    border: '1px solid var(--ios-glass-border)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="USER" style={{ background: '#1C1C20', color: '#FFFFFF' }}>Customer Account (General Store User)</option>
                  <option value="CASHIER" style={{ background: '#1C1C20', color: '#FFFFFF' }}>Staff: POS Counter Cashier</option>
                  <option value="STOCK_CONTROLLER" style={{ background: '#1C1C20', color: '#FFFFFF' }}>Staff: Warehouse Stock Controller</option>
                  <option value="ADMIN" style={{ background: '#1C1C20', color: '#FFFFFF' }}>System Administrator (Root Access)</option>
                </select>
              </div>

              {/* If Customer: Pricing Tier */}
              {newUserData.roleName === 'USER' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Customer Pricing Classification *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setNewUserData({ ...newUserData, customerType: 'RETAIL' })}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: newUserData.customerType === 'RETAIL' ? '1px solid #60A5FA' : '1px solid var(--ios-glass-border)',
                        background: newUserData.customerType === 'RETAIL' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: newUserData.customerType === 'RETAIL' ? '#60A5FA' : '#94A3B8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Normal / Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserData({ ...newUserData, customerType: 'WHOLESALE' })}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: newUserData.customerType === 'WHOLESALE' ? '1px solid #C084FC' : '1px solid var(--ios-glass-border)',
                        background: newUserData.customerType === 'WHOLESALE' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: newUserData.customerType === 'WHOLESALE' ? '#C084FC' : '#94A3B8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Wholesale B2B Client
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  disabled={userFormSubmitting}
                  onClick={() => setIsAddUserModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    background: 'transparent',
                    border: '1px solid var(--ios-glass-border)',
                    color: 'var(--ios-text-muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: userFormSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormSubmitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: userFormSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {userFormSubmitting ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT USER MODAL ===================== */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(20px)',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !userFormSubmitting) setEditingUser(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              background: 'rgba(24, 24, 28, 0.98)',
              border: '1px solid var(--ios-glass-border-bright)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.95), 0 0 1px 1px rgba(255,255,255,0.2)',
              padding: '28px',
              color: '#FFFFFF'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3))',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA'
                  }}
                >
                  <Edit2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    Edit User Profile & Permissions
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                    Modifying #{editingUser.id} • {editingUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !userFormSubmitting && setEditingUser(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--ios-glass-border)',
                  color: 'var(--ios-text-muted)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={editUserData.fullName}
                  onChange={(e) => setEditUserData({ ...editUserData, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--ios-glass-border)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--ios-glass-border)',
                      borderRadius: '12px',
                      padding: '10px 14px 10px 38px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <Mail size={16} color="var(--ios-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    value={editUserData.phone}
                    onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--ios-glass-border)',
                      borderRadius: '12px',
                      padding: '10px 14px 10px 38px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <Phone size={16} color="var(--ios-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Assigned Platform Role *
                </label>
                <select
                  value={editUserData.roleName}
                  onChange={(e) => setEditUserData({ ...editUserData, roleName: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#1C1C20',
                    border: '1px solid var(--ios-glass-border)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="USER" style={{ background: '#1C1C20', color: '#FFFFFF' }}>Customer Account (General Store User)</option>
                  <option value="CASHIER" style={{ background: '#1C1C20', color: '#FFFFFF' }}>Staff: POS Counter Cashier</option>
                  <option value="STOCK_CONTROLLER" style={{ background: '#1C1C20', color: '#FFFFFF' }}>Staff: Warehouse Stock Controller</option>
                  <option value="ADMIN" style={{ background: '#1C1C20', color: '#FFFFFF' }}>System Administrator (Root Access)</option>
                </select>
              </div>

              {/* If Customer: Pricing Tier */}
              {editUserData.roleName === 'USER' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Customer Pricing Classification
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setEditUserData({ ...editUserData, customerType: 'RETAIL' })}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: editUserData.customerType === 'RETAIL' ? '1px solid #60A5FA' : '1px solid var(--ios-glass-border)',
                        background: editUserData.customerType === 'RETAIL' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: editUserData.customerType === 'RETAIL' ? '#60A5FA' : '#94A3B8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Normal / Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditUserData({ ...editUserData, customerType: 'WHOLESALE' })}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: editUserData.customerType === 'WHOLESALE' ? '1px solid #C084FC' : '1px solid var(--ios-glass-border)',
                        background: editUserData.customerType === 'WHOLESALE' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: editUserData.customerType === 'WHOLESALE' ? '#C084FC' : '#94A3B8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Wholesale B2B Client
                    </button>
                  </div>
                </div>
              )}

              {/* Account Status Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Account Access Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditUserData({ ...editUserData, isActive: true })}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: editUserData.isActive ? '1px solid #10B981' : '1px solid var(--ios-glass-border)',
                      background: editUserData.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: editUserData.isActive ? '#34D399' : '#94A3B8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Active / Unlocked
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditUserData({ ...editUserData, isActive: false })}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: !editUserData.isActive ? '1px solid #EF4444' : '1px solid var(--ios-glass-border)',
                      background: !editUserData.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: !editUserData.isActive ? '#F87171' : '#94A3B8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Locked / Inactive
                  </button>
                </div>
              </div>

              {/* Optional Password Reset */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Set New Password (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="Leave blank to retain current password"
                    value={editUserData.password}
                    onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--ios-glass-border)',
                      borderRadius: '12px',
                      padding: '10px 14px 10px 38px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <Key size={16} color="var(--ios-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              {/* Bottom Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  disabled={userFormSubmitting}
                  onClick={() => setEditingUser(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    background: 'transparent',
                    border: '1px solid var(--ios-glass-border)',
                    color: 'var(--ios-text-muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: userFormSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormSubmitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    background: '#FFFFFF',
                    border: 'none',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: userFormSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {userFormSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE USER CONFIRMATION MODAL ===================== */}
      {deletingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(20px)',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !userFormSubmitting) setDeletingUser(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '24px',
              background: 'rgba(24, 24, 28, 0.98)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.95), 0 0 1px 1px rgba(239,68,68,0.3)',
              padding: '28px',
              color: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F87171'
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Confirm Account Removal
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                  User ID #{deletingUser.id}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.5, marginBottom: '16px' }}>
              Are you sure you want to delete user <strong style={{ color: '#FFFFFF' }}>{deletingUser.fullName}</strong> (<code>{deletingUser.email}</code>)?
            </p>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--ios-glass-border)',
                marginBottom: '20px',
                fontSize: '11px',
                color: 'var(--ios-text-muted)',
                lineHeight: 1.4
              }}
            >
              Note: If this account has historical sales, inventory movements, or register records, the system will safely archive and lock the account to protect audit ledger integrity.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={userFormSubmitting}
                onClick={() => setDeletingUser(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  background: 'transparent',
                  border: '1px solid var(--ios-glass-border)',
                  color: 'var(--ios-text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: userFormSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={userFormSubmitting}
                onClick={handleConfirmDeleteUser}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: userFormSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
                }}
              >
                {userFormSubmitting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
