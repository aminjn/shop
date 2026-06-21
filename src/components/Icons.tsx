import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (p: P) => ({
  width: p.size ?? 20,
  height: p.size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const Search = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-3.6-3.6" />
  </svg>
);
export const Sparkle = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
  </svg>
);
export const Compare = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h10M4 12h16M4 18h7" />
  </svg>
);
export const Heart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7-4.6-9.2-9C1.3 8 2.8 4.8 6 4.8c2 0 3.2 1.3 4 2.6.8-1.3 2-2.6 4-2.6 3.2 0 4.7 3.2 3.2 6.2C19 15.4 12 20 12 20z" />
  </svg>
);
export const User = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);
export const Cart = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 4h2l2.2 12.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 8H6" />
    <circle cx="9.5" cy="20" r="1.4" />
    <circle cx="17.5" cy="20" r="1.4" />
  </svg>
);
export const ChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const Check = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);
export const Grid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
export const List = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
export const Chat = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
);
export const Close = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
export const Plus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Minus = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);
export const Trash = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);
export const Sun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
  </svg>
);
export const Moon = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
  </svg>
);
export const Play = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 4l14 8-14 8z" />
  </svg>
);
export const Download = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
  </svg>
);
export const Send = (p: P) => (
  <svg {...base(p)}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

/** Directional arrow that mirrors automatically in RTL via the `.dir-flip` class. */
export const ArrowBack = (p: P) => (
  <svg {...base(p)} className={`dir-flip ${p.className ?? ""}`}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
export const ArrowForward = (p: P) => (
  <svg {...base(p)} className={`dir-flip ${p.className ?? ""}`}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
