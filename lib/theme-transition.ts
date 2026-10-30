"use client";

/**
 * Executes a smooth, synchronized circular reveal transition radiating outward
 * from the clicked toggle button position.
 * Disables individual CSS transitions during the transition so the header,
 * navbar, and page body reveal in complete harmony without lag or disjointed phases.
 */
export function toggleThemeWithRipple(
  event: any,
  toggleFn: () => void
) {
  // If browser doesn't support View Transitions or if reduced motion is requested
  if (
    typeof document === "undefined" ||
    typeof (document as any).startViewTransition !== "function" ||
    (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  ) {
    toggleFn();
    return;
  }

  // Calculate coordinates synchronously from the event
  let x = typeof window !== "undefined" ? window.innerWidth - 48 : 0;
  let y = 48;

  try {
    const e = event as any;
    if (e?.currentTarget && typeof e.currentTarget.getBoundingClientRect === "function") {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    } else if (typeof e?.clientX === "number" && typeof e?.clientY === "number") {
      x = e.clientX;
      y = e.clientY;
    } else if (e?.touches?.[0]) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }
  } catch (_) {}

  // Distance to the furthest corner of the viewport
  const endRadius = Math.hypot(
    Math.max(x, (typeof window !== "undefined" ? window.innerWidth : 800) - x),
    Math.max(y, (typeof window !== "undefined" ? window.innerHeight : 600) - y)
  );

  const cleanup = () => {
    try {
      document.documentElement.classList.remove("theme-transitioning");
    } catch (_) {}
  };

  try {
    // Disable per-element CSS transitions so the new snapshot is 100% atomic
    document.documentElement.classList.add("theme-transitioning");

    const transition = (document as any).startViewTransition(() => {
      toggleFn();
    });

    if (transition?.ready) {
      transition.ready
        .then(() => {
          try {
            const anim = document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 420,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)",
                fill: "forwards",
              }
            );

            anim.finished
              .then(() => cleanup())
              .catch(() => cleanup());
          } catch (_) {
            cleanup();
          }
        })
        .catch(() => {
          cleanup();
        });
    }

    if (transition?.finished) {
      transition.finished
        .then(() => cleanup())
        .catch(() => cleanup());
    }

    // Safety timeout to ensure theme-transitioning class is always cleaned up
    setTimeout(cleanup, 500);
  } catch (_) {
    cleanup();
    toggleFn();
  }
}
