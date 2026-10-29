import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Evita envíos repetidos:
 *  - bloquea en el mismo instante del primer clic (ref síncrono)
 *  - mantiene el bloqueo mientras dura la petición (pending)
 *  - y un tiempo extra después de terminar (cooldown), aunque haya fallado
 *
 * run(fn) devuelve undefined si la llamada fue ignorada por estar bloqueado.
 */
export default function useSubmitGuard(cooldownMs = 1500) {
  const lockedRef = useRef(false);
  const timerRef = useRef(null);
  const [pending, setPending] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const run = useCallback(
    async (fn) => {
      if (lockedRef.current) return undefined;

      lockedRef.current = true;
      setPending(true);

      try {
        return await fn();
      } finally {
        setPending(false);
        setCoolingDown(true);
        timerRef.current = setTimeout(() => {
          lockedRef.current = false;
          setCoolingDown(false);
        }, cooldownMs);
      }
    },
    [cooldownMs],
  );

  return { run, pending, coolingDown, busy: pending || coolingDown };
}