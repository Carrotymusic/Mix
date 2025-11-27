// A small helper that safely returns an instance of TronWeb.
// - If an injected TronWeb (TronLink) exists, use it.
// - Otherwise, optionally create your own TronWeb instance (you'll need to pass full node/wallet/srvc URLs).
//
// Usage:
//   import { getTronWeb } from './lib/initTronWeb';
//   const tronWeb = await getTronWeb({ createFallback: true, fallbackConfig: { fullHost: 'https://api.trongrid.io' } });
//
// NOTE: This sample uses the global `TronWeb` type. Ensure TronWeb is installed as dependency if you create fallback.

export type FallbackConfig = {
    fullHost: string;
    privateKey?: string; // if you must create a local TronWeb instance with a key (rare)
    solidityNode?: string;
    eventServer?: string;
  };
  
  export async function getTronWeb(options?: {
    createFallback?: boolean;
    fallbackConfig?: FallbackConfig;
    waitForInjectedTimeoutMs?: number;
  }) {
    const { createFallback = false, fallbackConfig, waitForInjectedTimeoutMs = 3000 } = options || {};
  
    // If extension's tronWeb is already available and ready, use it
    // Many extensions set window.tronWeb and a .ready boolean.
    // Accept both window.tronWeb and window.tronLink (some extensions expose both).
    const injected = (window as any).tronWeb ?? (window as any).tronLink ?? null;
    if (injected && injected.ready) {
      return injected;
    }
  
    // When the injected provider may arrive shortly (extension loads slightly later),
    // wait a short time for it — avoid immediately creating and causing "already initiated" logs.
    if (!injected && waitForInjectedTimeoutMs > 0) {
      await new Promise<void>((resolve) => {
        let resolved = false;
        const check = () => {
          const inj = (window as any).tronWeb ?? (window as any).tronLink ?? null;
          if (inj && inj.ready) {
            resolved = true;
            resolve();
          }
        };
        const interval = setInterval(check, 100);
        setTimeout(() => {
          if (!resolved) {
            clearInterval(interval);
            resolve();
          }
        }, waitForInjectedTimeoutMs);
      });
  
      const afterWait = (window as any).tronWeb ?? (window as any).tronLink ?? null;
      if (afterWait && afterWait.ready) return afterWait;
    }
  
    // No injected provider found or ready. Optionally create a fallback TronWeb instance.
    if (createFallback) {
      if (!fallbackConfig || !fallbackConfig.fullHost) {
        throw new Error('fallbackConfig.fullHost is required to create a TronWeb fallback instance');
      }
      // Import/require TronWeb at runtime to avoid bundling conflicts if you always rely on injected provider.
      // npm i tronweb
      const TronWeb = (await import('tronweb')).default ?? (await import('tronweb'));
      const { fullHost, privateKey, solidityNode, eventServer } = fallbackConfig;
      const tronWeb = new TronWeb(
        solidityNode ?? fullHost,
        fullHost,
        eventServer ?? fullHost,
        privateKey ?? ''
      );
      // mark it so you can detect it's your own instance
      (tronWeb as any).__createdBy = 'fallback';
      return tronWeb;
    }
  
    // Return whatever is on window now (even if not marked ready) or null
    return (window as any).tronWeb ?? (window as any).tronLink ?? null;
  }