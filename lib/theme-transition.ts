"use client";

/**
 * Executes a smooth circular reveal transition radiating outward from the clicked
 * toggle position (e.g. top-right on mobile, bottom-left on desktop).
 */
export function toggleThemeWithRipple(
  event: any,
  toggleFn: () => void
) {
  // If browser doesn't support View Transitions, or if user prefers reduced motion
  if (
    typeof document === "undefined" ||
    !("startViewTransition" in document) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    toggleFn();
    return;
  }

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  const e = event as any;
  if (e && e.currentTarget && typeof e.currentTarget.getBoundingClientRect === "function") {
    const rect = e.currentTarget.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  } else if (e && typeof e.clientX === "number" && typeof e.clientY === "number") {
    x = e.clientX;
    y = e.clientY;
  } else if (e && e.touches && e.touches[0]) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  }

  // Calculate distance to the farthest viewport corner
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Disable intermediate CSS color transitions so the DOM snapshot is instant and pristine
  document.documentElement.classList.add("theme-transitioning");

  // @ts-ignore - document.startViewTransition is standard in modern Chromium/Safari
  const transition = document.startViewTransition(() => {
    toggleFn();
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });

  transition.finished.finally(() => {
    document.documentElement.classList.remove("theme-transitioning");
  });
}
