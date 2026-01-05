import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdminStore } from '@/store/admin';
import { useDataStore } from '@/store/data';
import type { Item, Category } from '@/types';

export function useSiteFilter(moveState?: { active: boolean;[key: string]: any }) {
    const { t } = useI18n();
    const adminStore = useAdminStore();
    const dataStore = useDataStore();

    const selectedTags = ref<string[]>([]);

    // Get Raw Data from Store
    const rawDataValue = computed<Category[]>(() => dataStore.siteData);

    const filteredData = computed<Category[]>(() => {
        const visitorLevel = adminStore.user?.level || 0;

        // 1. Basic Filtering (Level & Tags)
        const filtered = rawDataValue.value.map(cat => ({
            ...cat,
            content: (cat.content || []).filter(item => {
                // Permission Check
                if (item.level !== undefined && item.level > visitorLevel) return false;

                // Tag Filter
                if (selectedTags.value.length > 0) {
                    if (!item.tags || !Array.isArray(item.tags)) return false;
                    if (!selectedTags.value.some(tag => item.tags!.includes(tag))) return false;
                }
                return true;
            })
        })).filter(cat => {
            // Category Permission Check
            if (moveState && moveState.active && adminStore.isAuthenticated) return true;

            if (cat.level !== undefined && cat.level > visitorLevel) return false;
            return true;
        });

        // 2. Extract Pinned Items (Virtual Category)
        const pinnedItems: Item[] = [];
        rawDataValue.value.forEach(cat => {
            if (cat.level !== undefined && cat.level > visitorLevel) return;

            (cat.content || []).forEach(item => {
                if (item.pinned) {
                    if (item.level !== undefined && item.level > visitorLevel) return;
                    pinnedItems.push({ ...item, level: item.level || 0 });
                    (pinnedItems[pinnedItems.length - 1] as any)._isPinnedReplica = true;
                }
            });
        });

        if (pinnedItems.length > 0) {
            return [
                { id: -1, name: t('site.pinnedCategory'), content: pinnedItems, isVirtual: true } as Category,
                ...filtered
            ];
        }
        return filtered;
    });

    const allTags = computed<string[]>(() => {
        const tags = new Set<string>();
        rawDataValue.value.forEach(cat => {
            (cat.content || []).forEach(item => { item.tags?.forEach(tag => tags.add(tag)); });
        });
        return Array.from(tags).sort();
    });

    const toggleTag = (tag: string) => {
        const idx = selectedTags.value.indexOf(tag);
        if (idx > -1) {
            selectedTags.value.splice(idx, 1);
        } else {
            selectedTags.value.push(tag);
        }
    };

    const clearTags = () => {
        selectedTags.value = [];
    };

    return {
        selectedTags,
        allTags,
        filteredData,
        toggleTag,
        clearTags
    };
}
