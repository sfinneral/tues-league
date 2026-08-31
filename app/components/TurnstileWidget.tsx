import { useCallback, useEffect, useId, useRef, useState } from "react";
import InlineError from "~/components/InlineError";

interface TurnstileWidgetProps {
  siteKey: string;
}

declare global {
  interface Window {
    turnstile?: {
      reset: (container?: string | HTMLElement) => void;
    };
  }
}

const RENDER_TIMEOUT_MS = 8000;

export default function TurnstileWidget({ siteKey }: TurnstileWidgetProps) {
  const callbackName = `turnstileError${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number>();
  const [blocked, setBlocked] = useState(false);

  const armTimeout = useCallback(() => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      if (!containerRef.current?.firstChild) setBlocked(true);
    }, RENDER_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    (window as unknown as Record<string, () => void>)[callbackName] = () =>
      setBlocked(true);
    armTimeout();

    return () => {
      delete (window as unknown as Record<string, () => void>)[callbackName];
      window.clearTimeout(timeoutRef.current);
    };
  }, [callbackName, armTimeout]);

  const retry = () => {
    setBlocked(false);
    if (window.turnstile && containerRef.current) {
      window.turnstile.reset(containerRef.current);
      armTimeout();
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className="cf-turnstile mt-4"
        data-sitekey={siteKey}
        data-error-callback={callbackName}
      />
      {blocked ? (
        <InlineError>
          The verification widget failed to load. This can be caused by an ad
          blocker/privacy extension, or a temporary issue with the verification
          service.{" "}
          <button type="button" onClick={retry} className="underline">
            Try again
          </button>
        </InlineError>
      ) : null}
      <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        onError={() => setBlocked(true)}
      ></script>
    </>
  );
}
