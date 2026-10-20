import { useCallback, useEffect, useRef, useState } from "react";

// Each project keeps its own editor settings in this browser, under a key carrying
// the project's name, so two tabs on two projects never share one set.
const KEY = (projectName) => `x1.editor.settings.v1:${projectName || "untitled"}`;

export const DEFAULT_SETTINGS = { device: "desktop", autoVerify: false };

export default function useProjectSettings(projectName) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY(projectName));
      setSettings(raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS);
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
    setLoaded(true);
  }, [projectName]);

  const save = useCallback(
    (patch) => {
      setSettings((held) => {
        const next = { ...held, ...patch };
        try {
          window.localStorage.setItem(KEY(projectName), JSON.stringify(next));
        } catch {
          // nothing stored: the choice still holds for this session
        }
        return next;
      });
    },
    [projectName]
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY(projectName));
    } catch {
      // nothing was stored
    }
    setSettings(DEFAULT_SETTINGS);
  }, [projectName]);

  return { settings, loaded, save, reset };
}

/**
 * The device the canvas opens in, from the project's own settings. It applies once per
 * mount, and only when the tab has no device of its own to restore — otherwise a tab
 * saved on the phone preview would be pulled back to the project's default when its
 * settings load.
 */
export function useDeviceSetting(settings, setDevice, apply = true) {
  const done = useRef(false);
  useEffect(() => {
    if (!apply || done.current || !settings.loaded) return;
    done.current = true;
    setDevice(settings.settings.device || "desktop");
  }, [apply, settings.loaded, settings.settings.device, setDevice]);
}

/**
 * Runs the check after every new artifact reaches the canvas, when the project asks
 * for it. It fires on the artifact changing, never on a re-render, so one build is one
 * check.
 */
export function useAutoVerify(html, enabled, run) {
  const seen = useRef(html);
  useEffect(() => {
    if (html === seen.current) return;
    seen.current = html;
    if (enabled && html) run();
  }, [html, enabled, run]);
}