import { useAppStore, type ModuleId } from '@/stores/app-store';
import { useEffect, useRef } from 'react';


/**
 * useUrlSync Hook
 *
 * 双向同步应用状态（CurrentModule, ActiveVault）与浏览器 URL 查询参数
 * URL 格式示例: /?notes&vault=my-vault
 */
export function useUrlSync(
    activeVault: string | null,
    setActiveVault: (vault: string | null) => void
) {
    const { currentModule, setModule, trashType } = useAppStore();

    // 用于防止 URL 更新触发的状态更新再次触发 URL 更新（无限循环）
    const isUpdatingFromUrl = useRef(false);

    // 1. 监听 URL 变化并更新状态 (PopState & Initial Load)
    useEffect(() => {
        const handleUrlChange = () => {
            isUpdatingFromUrl.current = true;

            const params = new URLSearchParams(window.location.search);
            const vault = params.get('vault');
            const type = params.get('type') as 'notes' | 'files' | null;

            // 如果有 vault 参数，设置 activeVault
            if (vault && vault !== activeVault) {
                setActiveVault(vault);
            }

            // 映射 query key 到 module
            let module: ModuleId = 'vaults';

            if (params.has('settings')) module = 'settings';
            else if (params.has('notes')) module = 'notes';
            else if (params.has('files')) module = 'files';
            else if (params.has('trash')) module = 'trash';
            else if (params.has('sync')) module = 'sync';
            else if (params.has('git')) module = 'git';

            // 更新 module
            if (module === 'trash' && type) {
                setModule(module, type);
            } else {
                setModule(module);
            }

            // Reset ref after state updates
            setTimeout(() => {
                isUpdatingFromUrl.current = false;
            }, 0);
        };

        // 初始化时执行一次
        handleUrlChange();

        window.addEventListener('popstate', handleUrlChange);
        return () => {
            window.removeEventListener('popstate', handleUrlChange);
        };
    }, [setModule, setActiveVault, activeVault]);

    // 2. 监听状态变化并更新 URL
    useEffect(() => {
        // 如果是来自 URL 的更新，不反向推送到 URL
        if (isUpdatingFromUrl.current) return;

        const params = new URLSearchParams();

        // 根据当前模块添加对应的 key (无值)
        if (currentModule !== 'vaults') {
            params.set(currentModule, '');
        }

        // 添加参数
        if (activeVault) params.set('vault', activeVault);
        if (currentModule === 'trash' && trashType) params.set('type', trashType);

        // 构造查询字符串，移除无值参数的等号 (例如 ?notes=&vault=... -> ?notes&vault=...)
        const search = params.toString().replace(/=(?=&|$)/g, '');
        const newUrl = window.location.pathname + (search ? `?${search}` : '');

        // 只有当 URL 真正变化时才 pushState
        if (window.location.search !== (search ? `?${search}` : '')) {
            window.history.pushState(null, '', newUrl);
        }

    }, [currentModule, activeVault, trashType]);

}
