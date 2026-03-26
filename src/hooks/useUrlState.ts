import { useEffect, useCallback } from 'react';

interface UrlState {
  view?: string;
  countries?: string[];
  year?: string;
  topic?: string;
  mode?: string;
  variable?: string;
}

export function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const result: UrlState = {};
  if (params.get('view')) result.view = params.get('view')!;
  if (params.get('countries')) result.countries = params.get('countries')!.split(',');
  if (params.get('year')) result.year = params.get('year')!;
  if (params.get('topic')) result.topic = params.get('topic')!;
  if (params.get('mode')) result.mode = params.get('mode')!;
  if (params.get('var')) result.variable = params.get('var')!;
  return result;
}

/**
 * Merge state into URL params without clobbering keys managed by other components.
 * Each caller only sets the keys it owns.
 */
export function useUrlState(state: UrlState) {
  const updateUrl = useCallback(() => {
    // Start from current params to preserve keys set by other components
    const params = new URLSearchParams(window.location.search);

    // Helper: set or delete a param
    const sync = (key: string, value: string | undefined, defaultValue?: string) => {
      if (value && value !== defaultValue) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };

    if ('view' in state) sync('view', state.view, 'dashboard');
    if ('countries' in state) sync('countries', state.countries?.join(','));
    if ('year' in state) sync('year', state.year);
    if ('topic' in state) sync('topic', state.topic);
    if ('mode' in state) sync('mode', state.mode, 'pais');
    if ('variable' in state) sync('var', state.variable);

    const search = params.toString();
    const newUrl = search
      ? `${window.location.pathname}?${search}`
      : window.location.pathname;

    if (window.location.href !== new URL(newUrl, window.location.origin).href) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [state.view, state.countries, state.year, state.topic, state.mode, state.variable]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);
}
