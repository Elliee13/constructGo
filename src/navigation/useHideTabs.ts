import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { mainTabBarStyle } from './tabBarStyle';

const hideRequests: Record<string, number> = {};

const findTabParent = (navigation: any, tabId?: string) => {
  const tabById = tabId ? navigation.getParent?.(tabId) : null;
  if (tabById) return tabById;

  const legacyMain = navigation.getParent?.('MainTabs');
  if (legacyMain) return legacyMain;

  const parentChain: any[] = [];
  let currentParent = navigation.getParent?.();
  while (currentParent) {
    parentChain.push(currentParent);
    currentParent = currentParent.getParent?.();
  }

  if (parentChain.length === 0) return null;

  return (
    parentChain.find((parent) => {
      const state = parent.getState?.();
      return state?.type === 'tab';
    }) ?? parentChain[0]
  );
};

const getParentKey = (parent: any) => parent.getState?.()?.key ?? parent.getId?.() ?? 'unknown-tab';

const useHideTabs = (tabId?: string) => {
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      const tabParent = findTabParent(navigation, tabId);
      if (!tabParent) return undefined;

      const key = getParentKey(tabParent);
      hideRequests[key] = (hideRequests[key] ?? 0) + 1;

      tabParent.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        hideRequests[key] = Math.max(0, (hideRequests[key] ?? 1) - 1);
        if (hideRequests[key] === 0) {
          delete hideRequests[key];
          tabParent.setOptions({
            tabBarStyle: mainTabBarStyle,
          });
        }
      };
    }, [navigation, tabId])
  );
};

export default useHideTabs;


