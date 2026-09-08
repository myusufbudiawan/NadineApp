import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// supabase-js expects a storage adapter with this exact shape. It owns
// session persistence and refresh internally once wired as `auth.storage`
// (see lib/supabase/client.ts) — this file only supplies where those bytes
// live. expo-secure-store has no web implementation, so the web build (used
// for local preview/dev) falls back to localStorage; native builds use
// SecureStore rather than the AsyncStorage default so tokens aren't sitting
// in plain storage.
export const secureStoreAdapter =
  Platform.OS === 'web'
    ? {
        getItem: async (key: string) => window.localStorage.getItem(key),
        setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
        removeItem: async (key: string) => window.localStorage.removeItem(key),
      }
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };
