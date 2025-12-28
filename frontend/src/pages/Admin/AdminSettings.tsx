import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getSystemSettings, updateSystemSettings, type SystemConfig } from '../../api/admin';
import { message } from 'antd';

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SystemConfig | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await getSystemSettings();
            setSettings(data);
        } catch (err: any) {
            console.error('Failed to load settings:', err);
            message.error(err.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        try {
            setSaving(true);
            await updateSystemSettings(settings);
            message.success('Settings saved successfully');
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            message.error(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleQuotaChange = (value: number) => {
        if (settings) {
            setSettings({ ...settings, monthlyFreeQuota: value });
        }
    };

    const handleInputMethodToggle = (method: 'text' | 'audio' | 'image', enabled: boolean) => {
        if (settings) {
            setSettings({
                ...settings,
                inputMethods: {
                    ...settings.inputMethods,
                    [method]: enabled,
                },
            });
        }
    };

    const handleVipPriorityToggle = (enabled: boolean) => {
        if (settings) {
            setSettings({
                ...settings,
                vipConfig: {
                    ...settings.vipConfig,
                    priorityQueue: enabled,
                },
            });
        }
    };

    const handleProcessingMultiplierChange = (value: number) => {
        if (settings) {
            setSettings({
                ...settings,
                vipConfig: {
                    ...settings.vipConfig,
                    processingMultiplier: value,
                },
            });
        }
    };

    const handleMaintenanceToggle = (enabled: boolean) => {
        if (settings) {
            setSettings({
                ...settings,
                maintenanceMode: enabled,
            });
        }
    };

    if (loading || !settings) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-slate-500">Loading settings...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-6 md:p-8 lg:px-12">
                <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-12">
                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                General Settings
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
                                Configure global parameters, quotas, and system modes for the platform.
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[20px]">save</span>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    {/* Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Primary Settings */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {/* Card: Quota Limits */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">speed</span>
                                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">User Limits</h2>
                                </div>
                                <div className="p-6">
                                    <label className="block mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                Monthly Free Quota
                                            </p>
                                            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                Generations / Month
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                            Defines the number of free AI slide generations available to new users on the Free Tier.
                                        </p>
                                        <div className="relative max-w-sm">
                                            <input
                                                type="number"
                                                value={settings.monthlyFreeQuota}
                                                onChange={(e) => handleQuotaChange(parseInt(e.target.value) || 0)}
                                                min="0"
                                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 pr-12 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                                                <span className="material-symbols-outlined text-[20px]">numbers</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Card: Input Types */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">tune</span>
                                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Input Methods</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                        Control which types of source material users can upload to generate slides.
                                    </p>
                                    <div className="space-y-4">
                                        {/* Text Input Toggle */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0f172a]/50">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined">title</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Text Input</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Allow raw text or topic prompts.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.inputMethods.text}
                                                    onChange={(e) => handleInputMethodToggle('text', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                            </label>
                                        </div>

                                        {/* Audio Input Toggle */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0f172a]/50">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                    <span className="material-symbols-outlined">mic</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Audio Input</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Allow voice recordings & MP3s.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.inputMethods.audio}
                                                    onChange={(e) => handleInputMethodToggle('audio', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                            </label>
                                        </div>

                                        {/* Image Input Toggle */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0f172a]/50">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                    <span className="material-symbols-outlined">image</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Image Input</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Allow chart & diagram uploads.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.inputMethods.image}
                                                    onChange={(e) => handleInputMethodToggle('image', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Secondary & Danger Settings */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            {/* Card: VIP Configuration */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-amber-500">diamond</span>
                                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">VIP Configuration</h2>
                                </div>
                                <div className="p-6 flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="pr-4">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Priority Queue</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                When enabled, VIP requests bypass the standard waiting list.
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={settings.vipConfig.priorityQueue}
                                                onChange={(e) => handleVipPriorityToggle(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                    <hr className="border-slate-200 dark:border-slate-700" />
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Processing Multiplier</span>
                                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-primary">
                                                {settings.vipConfig.processingMultiplier.toFixed(1)}x
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="0.5"
                                            value={settings.vipConfig.processingMultiplier}
                                            onChange={(e) => handleProcessingMultiplierChange(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                            <span>1x</span>
                                            <span>5x</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Maintenance Mode (Danger Zone) */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-red-200 dark:border-red-900/50 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">warning</span>
                                    <h2 className="text-base font-bold text-red-700 dark:text-red-400">System Status</h2>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="pr-4">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Maintenance Mode</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Disable the platform for all non-admin users. Use with caution.
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                            <input
                                                type="checkbox"
                                                checked={settings.maintenanceMode}
                                                onChange={(e) => handleMaintenanceToggle(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 dark:peer-focus:ring-red-900 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
                                        </label>
                                    </div>
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-900/30">
                                        <div className="flex gap-2">
                                            <span className="material-symbols-outlined text-red-500 text-[18px]">info</span>
                                            <p className="text-[11px] text-red-700 dark:text-red-300 leading-tight">
                                                Current system load is normal. Maintenance is not recommended at this time.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

