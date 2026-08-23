'use client';

import { useState, useEffect } from 'react';

/**
 * Persiste la última elección del usuario en localStorage.
 * Útil para recordar la última plataforma/método de pago elegidos.
 *
 * @param key   Clave de localStorage (debe ser única por tipo de campo)
 * @param defaultValue  Valor por defecto si no hay nada guardado
 */
export function useLastChoice(key: string, defaultValue: string): [string, (v: string) => void] {
  const storageKey = `gestor_last_${key}`;

  const [value, setValue] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      return localStorage.getItem(storageKey) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  function set(v: string) {
    setValue(v);
    try {
      localStorage.setItem(storageKey, v);
    } catch {
      // silencioso — localStorage puede estar bloqueado
    }
  }

  return [value, set];
}
