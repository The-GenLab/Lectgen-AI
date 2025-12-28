import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getAllUsers } from '../../api/admin';
import { getAvatarUrl } from '../../utils/file';
import type { UserWithStats } from '../../api/admin';

const AdminUsers = () => {
    const navigate = useNavigate();
    const [allUsers, setAllUsers] = useState<UserWithStats[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('All Roles');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, roleFilter, allUsers]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Fetch a large number of users (or all if needed)
            const { users: fetchedUsers } = await getAllUsers({ 
                limit: 1000, 
                offset: 0 
            });
            
            setAllUsers(fetchedUsers);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = [...allUsers];
        
        // Filter by role
        if (roleFilter !== 'All Roles') {
            const role = roleFilter === 'VIP Plan' ? 'VIP' : roleFilter === 'Free Plan' ? 'FREE' : roleFilter.toUpperCase();
            filtered = filtered.filter(u => u.role?.toUpperCase() === role);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(u => 
                u.name?.toLowerCase().includes(query) || 
                u.email?.toLowerCase().includes(query)
            );
        }

        setFilteredUsers(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Get users for current page
    const users = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const total = filteredUsers.length;

    const getUserInitials = (user: UserWithStats) => {
        if (user.name) {
            return user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        }
        return user.email?.[0]?.toUpperCase() || 'U';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const getUsagePercentage = (user: UserWithStats) => {
        if (user.role?.toUpperCase() === 'VIP') return 0; // VIP doesn't have limit
        if (user.maxSlidesPerMonth === 0) return 0;
        return Math.min(Math.round((user.slidesGenerated / user.maxSlidesPerMonth) * 100), 100);
    };

    const getUserStatus = (user: UserWithStats): 'active' | 'inactive' | 'banned' => {
        // For now, all users are active. Can be extended later.
        return 'active';
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <AdminLayout>
            <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen">
                <div className="p-4 md:p-8">
                    <div className="mx-auto max-w-7xl w-full flex flex-col gap-6">
                        {/* Page Heading */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                    User Management
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-base">
                                    Manage access, roles and monitor usage credits for all users.
                                </p>
                            </div>
                            <button 
                                className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                                onClick={() => {
                                    // TODO: Implement add new user
                                    alert('Add New User functionality coming soon');
                                }}
                            >
                                <span className="material-symbols-outlined text-[20px] mr-2">add</span>
                                <span>Add New User</span>
                            </button>
                        </div>

                        {/* Filters & Search */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-8 lg:col-span-9 relative">
                                <label className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </label>
                                <input
                                    className="w-full h-11 pl-10 pr-4 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2936] text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm"
                                    placeholder="Search by name or email address..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-4 lg:col-span-3">
                                <div className="relative">
                                    <label className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                    </label>
                                    <select
                                        className="w-full h-11 pl-10 pr-8 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2936] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm appearance-none cursor-pointer"
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                    >
                                        <option>All Roles</option>
                                        <option>VIP Plan</option>
                                        <option>Free Plan</option>
                                    </select>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[20px]">arrow_drop_down</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Table Card */}
                        <div className="bg-white dark:bg-[#151f2b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[300px]">
                                                User Profile
                                            </th>
                                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[120px]">
                                                Role
                                            </th>
                                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[200px]">
                                                Usage
                                            </th>
                                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[120px]">
                                                Status
                                            </th>
                                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[150px]">
                                                Joined Date
                                            </th>
                                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[80px] text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                                                    Loading users...
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((user) => {
                                                const avatarUrl = user.avatarUrl ? getAvatarUrl(user.avatarUrl) : null;
                                                const initials = getUserInitials(user);
                                                const usagePercent = getUsagePercentage(user);
                                                const status = getUserStatus(user);
                                                const isBanned = status === 'banned';

                                                return (
                                                    <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                {avatarUrl ? (
                                                                    <div
                                                                        className={`size-10 rounded-full bg-cover bg-center shrink-0 border border-slate-200 dark:border-slate-700 ${isBanned ? 'grayscale' : ''}`}
                                                                        style={{ backgroundImage: `url(${avatarUrl})` }}
                                                                    />
                                                                ) : (
                                                                    <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                                                                        {initials}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span className={`text-sm font-semibold ${isBanned ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                                        {user.name || user.email}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {user.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {user.role?.toUpperCase() === 'VIP' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary border border-primary/20">
                                                                    <span className="material-symbols-outlined text-[14px]">diamond</span>
                                                                    VIP
                                                                </span>
                                                            ) : user.role?.toUpperCase() === 'ADMIN' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary border border-primary/20">
                                                                    <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                                                                    ADMIN
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                    FREE
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {user.role?.toUpperCase() === 'VIP' ? (
                                                                <div className="flex flex-col gap-1.5 w-full max-w-[160px]">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                            Unlimited
                                                                        </span>
                                                                        <span className="text-slate-500">—</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-1.5 w-full max-w-[160px]">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                            {user.slidesGenerated} Credits
                                                                        </span>
                                                                        <span className="text-slate-500">{usagePercent}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${usagePercent}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {status === 'active' ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
                                                                </div>
                                                            ) : status === 'inactive' ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Inactive</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Banned</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                            {formatDate(user.createdAt)}
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <button 
                                                                className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Showing <span className="font-semibold text-slate-900 dark:text-white">
                                        {users.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                                    </span> to <span className="font-semibold text-slate-900 dark:text-white">
                                        {Math.min(currentPage * pageSize, total)}
                                    </span> of <span className="font-semibold text-slate-900 dark:text-white">
                                        {total}
                                    </span> results
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        className="size-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`size-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                                    pageNum === currentPage
                                                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary'
                                                }`}
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <>
                                            <span className="px-1 text-slate-400">...</span>
                                            <button
                                                className="size-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary text-sm font-medium transition-colors"
                                                onClick={() => setCurrentPage(totalPages)}
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="size-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;

