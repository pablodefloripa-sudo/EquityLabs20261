import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingConfigError = new Error(
  "Missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to .env.local.",
);

const createAwaitableBuilder = <T,>(result: { data: T; error: Error }) => {
  let builder: any;
  const promise = Promise.resolve(result);

  builder = new Proxy(function noop() {}, {
    get(_target, prop) {
      if (prop === "then") return promise.then.bind(promise);
      if (prop === "catch") return promise.catch.bind(promise);
      if (prop === "finally") return promise.finally.bind(promise);
      if (prop === Symbol.toStringTag) return "Promise";
      return builder;
    },
    apply() {
      return builder;
    },
  });

  return builder as PromiseLike<{ data: T; error: Error }> & Record<string, unknown>;
};

const createMissingQueryBuilder = () =>
  createAwaitableBuilder({
    data: [] as unknown[],
    error: missingConfigError,
  });

const createMissingStorageBuilder = () => ({
  list: () => createAwaitableBuilder({ data: [] as unknown[], error: missingConfigError }),
  remove: () => createAwaitableBuilder({ data: [] as unknown[], error: missingConfigError }),
  upload: () => createAwaitableBuilder({ data: null, error: missingConfigError }),
  download: () => createAwaitableBuilder({ data: null, error: missingConfigError }),
  move: () => createAwaitableBuilder({ data: null, error: missingConfigError }),
  copy: () => createAwaitableBuilder({ data: null, error: missingConfigError }),
  createSignedUrl: () =>
    createAwaitableBuilder({
      data: { signedUrl: "" },
      error: missingConfigError,
    }),
  createSignedUrls: () =>
    createAwaitableBuilder({
      data: { signedUrls: [] as Array<{ signedUrl: string }> },
      error: missingConfigError,
    }),
  getPublicUrl: () =>
    createAwaitableBuilder({
      data: { publicUrl: "" },
      error: missingConfigError,
    }),
});

const createMissingAuth = () => ({
  onAuthStateChange: (callback: (event: string, session: null) => void) => {
    callback("INITIAL_SESSION", null);

    return {
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
      error: missingConfigError,
    };
  },
  getSession: async () => ({
    data: { session: null },
    error: missingConfigError,
  }),
  getUser: async () => ({
    data: { user: null },
    error: missingConfigError,
  }),
  signInWithOAuth: async () => ({
    data: { url: null },
    error: missingConfigError,
  }),
  signInWithPassword: async () => ({
    data: { user: null, session: null },
    error: missingConfigError,
  }),
  signUp: async () => ({
    data: { user: null, session: null },
    error: missingConfigError,
  }),
  signOut: async () => ({
    error: missingConfigError,
  }),
  exchangeCodeForSession: async () => ({
    data: { user: null, session: null },
    error: missingConfigError,
  }),
  resetPasswordForEmail: async () => ({
    data: {},
    error: missingConfigError,
  }),
  updateUser: async () => ({
    data: { user: null },
    error: missingConfigError,
  }),
  setSession: async () => ({
    data: { user: null, session: null },
    error: missingConfigError,
  }),
});

const createMissingFunctions = () => ({
  invoke: () =>
    createAwaitableBuilder({
      data: null,
      error: missingConfigError,
    }),
});

const createMissingClient = () =>
  ({
    auth: createMissingAuth(),
    from: () => createMissingQueryBuilder(),
    rpc: () => createMissingQueryBuilder(),
    storage: {
      from: () => createMissingStorageBuilder(),
    },
    functions: createMissingFunctions(),
  }) as unknown as SupabaseClient<Database>;

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

if (!hasSupabaseConfig) {
  console.warn(
    "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to .env.local to enable backend features.",
  );
}

export const supabase = hasSupabaseConfig
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        flowType: "pkce",
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: { "X-Client-Info": "equitylabs-web" },
      },
    })
  : createMissingClient();

export const getSupabase = () => supabase;
export { hasSupabaseConfig };
export type { Database };
