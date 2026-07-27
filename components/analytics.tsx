"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function sessionId() {
  const key = "sid";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function visitorId() {
  const key = "vid";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function viewportBucket() {
  const w = window.innerWidth;
  if (w < 768) return "phone";
  if (w < 1024) return "tablet";
  if (w < 1440) return "laptop";
  return "wide";
}

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const queue = useRef<
    { name: string; path: string; target?: string; meta?: Record<string, unknown> }[]
  >([]);
  const started = useRef(Date.now());

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/student")) {
      return;
    }
    if (navigator.doNotTrack === "1") return;

    started.current = Date.now();
    const payload = () => {
      const body = JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
        visitorId: visitorId(),
        sessionId: sessionId(),
        durationMs: Date.now() - started.current,
        deviceType: /Mobi|Android/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
        viewportBucket: viewportBucket(),
        browser: navigator.userAgent.slice(0, 80),
        events: queue.current.splice(0, queue.current.length),
      });
      navigator.sendBeacon("/api/track", body);
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-track], a[href]");
      if (!el) return;
      const track = el.getAttribute("data-track");
      const href = el.getAttribute("href");
      const outbound =
        href?.startsWith("http") &&
        !href.includes(window.location.host);
      queue.current.push({
        name: outbound ? "outbound" : "click",
        path: pathname,
        target: track ?? href ?? undefined,
      });
    };

    const depths = new Set<number>();
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.round((window.scrollY / max) * 100);
      for (const mark of [25, 50, 75, 100]) {
        if (pct >= mark && !depths.has(mark)) {
          depths.add(mark);
          queue.current.push({
            name: "scroll_depth",
            path: pathname,
            target: String(mark),
          });
        }
      }
    };

    document.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    const onHide = () => payload();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });

    // pageview as empty events batch on leave; also ping lightly
    queue.current.push({ name: "click", path: pathname, target: "pageview" });

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      payload();
    };
  }, [pathname]);

  return null;
}
