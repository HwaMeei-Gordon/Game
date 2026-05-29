// ── 畫面：手繪向量圖示 ───────────────────────────────────────
// 每個圖示用「漸層填色 + 高光 + 深色描邊」做出立體質感（非單色線條）。
// 顏色由 color 衍生（亮面/暗面/描邊），與各處主題色一致。
import React, { useId } from "react";

function parseHex(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}
function mix(hex, target, amt) {
  const a = parseHex(hex), b = parseHex(target);
  if (!a || !b) return hex;
  const f = (i) => Math.round(a[i] + (b[i] - a[i]) * amt);
  return `rgb(${f(0)},${f(1)},${f(2)})`;
}

export default function Icon({ type, size = 18, color = "#e2e8f0" }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = "ig" + raw;
  const light = mix(color, "#ffffff", 0.6);
  const dark = mix(color, "#000000", 0.4);
  const deep = mix(color, "#000000", 0.55);

  const F = { fill: `url(#${gid})` };
  const S = { fill: "none", stroke: deep, strokeWidth: 1.3, strokeLinejoin: "round", strokeLinecap: "round" };
  const FS = { fill: `url(#${gid})`, stroke: deep, strokeWidth: 1.1, strokeLinejoin: "round", strokeLinecap: "round" };
  const HL = { fill: "#ffffff", opacity: 0.4 };
  const acc = { fill: dark };

  const paths = {
    // 攻擊力：寶劍
    dmg: <g>
      <path d="M12 2 L14.4 6.5 L13.4 14 H10.6 L9.6 6.5 Z" {...FS} />
      <rect x="7.4" y="13.6" width="9.2" height="2.6" rx="1.3" {...FS} />
      <rect x="10.7" y="16" width="2.6" height="5.6" rx="1.2" {...FS} />
      <path d="M12 3 L13 6.5 L12.4 13 H12 Z" {...HL} />
    </g>,
    // 攻速：閃電
    rate: <g>
      <path d="M13.5 2 L5 13 H10 L8.8 22 L19 9.5 H13 Z" {...FS} />
      <path d="M13.5 2 L11.5 9.5 H14" {...HL} />
    </g>,
    // 範圍：雷達靶心
    range: <g>
      <circle cx="12" cy="12" r="9" {...S} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.4" {...S} opacity="0.7" />
      <circle cx="12" cy="12" r="2.6" {...FS} />
      <path d="M12 1.5 V4 M12 20 V22.5 M1.5 12 H4 M20 12 H22.5" {...S} strokeWidth="1.6" />
    </g>,
    // 多重：三發箭
    multi: <g {...FS}>
      <path d="M12 2.5 L15 7.5 H9 Z" /><rect x="11" y="7.3" width="2" height="13.4" rx="1" />
      <path d="M5.5 6 L7.8 10 H3.2 Z" /><rect x="4.5" y="9.8" width="2" height="9.6" rx="1" />
      <path d="M18.5 6 L20.8 10 H16.2 Z" /><rect x="17.5" y="9.8" width="2" height="9.6" rx="1" />
    </g>,
    // 穿甲：穿透箭
    pierce: <g>
      <rect x="2.5" y="10.8" width="13" height="2.4" rx="1.2" {...FS} />
      <path d="M13 7 L21 12 L13 17 Z" {...FS} />
      <path d="M3 9.5 L6 12 L3 14.5" {...S} strokeWidth="1.6" />
      <path d="M14 8.5 L19.5 12" {...HL} stroke="#fff" strokeWidth="1" opacity="0.45" fill="none" />
    </g>,
    // 生命：心
    hp: <g>
      <path d="M12 20.6 C3.5 14, 4.2 6, 9.2 6 C11 6, 12 7.6, 12 7.6 C12 7.6, 13 6, 14.8 6 C19.8 6, 20.5 14, 12 20.6 Z" {...FS} />
      <path d="M9 7.2 C7.3 7.4, 6.6 9.4, 7.2 11" {...HL} stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.5" strokeLinecap="round" />
    </g>,
    // 恢復：十字
    regen: <g {...FS}>
      <path d="M9.6 4 H14.4 V9.6 H20 V14.4 H14.4 V20 H9.6 V14.4 H4 V9.6 H9.6 Z" />
      <rect x="10" y="4.4" width="1.5" height="15" {...HL} rx="0.7" />
    </g>,
    // 護甲：盾
    armor: <g>
      <path d="M12 2.4 L20 5.2 V11 C20 16, 16.4 19.6, 12 21.6 C7.6 19.6, 4 16, 4 11 V5.2 Z" {...FS} />
      <path d="M12 2.4 L12 21.6" {...S} opacity="0.5" />
      <path d="M12 3.4 L18.8 5.8 V11 C18.8 13, 18 14.8, 17 16" {...HL} stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.4" />
    </g>,
    // 暴擊：四角閃星
    crit: <g>
      <path d="M12 1.5 C13 8.5, 15.5 11, 22.5 12 C15.5 13, 13 15.5, 12 22.5 C11 15.5, 8.5 13, 1.5 12 C8.5 11, 11 8.5, 12 1.5 Z" {...FS} />
      <path d="M12 5 C12.6 9.4, 14.6 11.4, 19 12" {...HL} stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.5" />
    </g>,
    // 濺射：爆裂星芒
    splash: <g>
      <path d="M12 2 L14 8 L20 5.5 L16.5 11 L22 13 L15.5 13.5 L18 20 L12 16 L6 20 L8.5 13.5 L2 13 L7.5 11 L4 5.5 L10 8 Z" {...FS} />
      <circle cx="12" cy="12" r="2.4" {...acc} />
    </g>,
    // 荊棘：尖刺星
    thorns: <g>
      <path d="M12 1.5 L14 9 L21.5 8 L15.5 12.5 L19.5 19.5 L12 15.5 L4.5 19.5 L8.5 12.5 L2.5 8 L10 9 Z" {...FS} />
      <path d="M12 3 L13.2 9 L12 12 Z" {...HL} />
    </g>,
    // 金幣：錢幣
    gold: <g>
      <circle cx="12" cy="12" r="9" {...FS} />
      <circle cx="12" cy="12" r="6.4" {...S} opacity="0.55" />
      <path d="M14 9.2 C13 8.2, 9.5 8.2, 9.5 10.5 C9.5 13, 14.5 11.5, 14.5 14 C14.5 16, 11 16.2, 10 15 M12 7 V17" {...S} strokeWidth="1.5" />
      <ellipse cx="9.5" cy="9" rx="2.4" ry="1.4" {...HL} transform="rotate(-35 9.5 9)" />
    </g>,
    // 鑽石：寶石
    gem: <g>
      <path d="M12 21.5 L2.5 9 L6.5 3.5 H17.5 L21.5 9 Z" {...FS} />
      <path d="M2.5 9 H21.5 M6.5 3.5 L9.5 9 L12 21.5 M17.5 3.5 L14.5 9 L12 21.5" {...S} opacity="0.6" />
      <path d="M6.5 3.7 L9.4 8.8 L7 8.8 Z" {...HL} />
    </g>,
    // 無人機：環繞球
    orb: <g>
      <ellipse cx="12" cy="12" rx="10" ry="3.6" {...S} strokeWidth="1.4" transform="rotate(-22 12 12)" />
      <circle cx="12" cy="12" r="4.6" {...FS} />
      <circle cx="10.3" cy="10.3" r="1.5" {...HL} />
    </g>,
    // 核心：反應爐
    core: <g>
      <circle cx="12" cy="12" r="9" {...S} strokeWidth="1.5" opacity="0.8" />
      <circle cx="12" cy="12" r="4.4" {...FS} />
      <circle cx="12" cy="3" r="1.5" {...acc} /><circle cx="12" cy="21" r="1.5" {...acc} />
      <circle cx="3" cy="12" r="1.5" {...acc} /><circle cx="21" cy="12" r="1.5" {...acc} />
      <circle cx="10.4" cy="10.4" r="1.3" {...HL} />
    </g>,
    // 詛咒：骷髏
    curse: <g>
      <path d="M12 2.5 C6.8 2.5, 4 6, 4 10.5 C4 13.2, 5.6 14.6, 6 16.4 V18.5 H8.4 V16.6 H10 V18.5 H14 V16.6 H15.6 V18.5 H18 V16.4 C18.4 14.6, 20 13.2, 20 10.5 C20 6, 17.2 2.5, 12 2.5 Z" {...FS} />
      <circle cx="9" cy="10.6" r="2.1" {...acc} /><circle cx="15" cy="10.6" r="2.1" {...acc} />
      <path d="M12 12.5 L10.7 15 H13.3 Z" {...acc} />
    </g>,
    // 標準彈：砲塔
    cannon: <g>
      <ellipse cx="12" cy="15.5" rx="6" ry="4.6" {...FS} />
      <rect x="10.6" y="3" width="2.8" height="10" rx="1.3" {...FS} />
      <circle cx="12" cy="15.5" r="2" {...acc} />
      <ellipse cx="10" cy="13.6" rx="2" ry="1.2" {...HL} transform="rotate(-30 10 13.6)" />
    </g>,
    // 追蹤彈：火箭
    homing: <g>
      <path d="M12 1.8 C14.4 5, 15.4 9, 15.4 13 L8.6 13 C8.6 9, 9.6 5, 12 1.8 Z" {...FS} />
      <path d="M8.6 12 L5 16 L8.8 15.5 Z M15.4 12 L19 16 L15.2 15.5 Z" {...FS} />
      <circle cx="12" cy="8" r="1.7" {...acc} />
      <path d="M10.2 13 L11 18 H13 L13.8 13 Z" fill={dark} opacity="0.85" />
      <path d="M11 4 C10.2 6, 9.8 9, 9.8 12" {...HL} stroke="#fff" strokeWidth="1.1" fill="none" opacity="0.5" />
    </g>,
    // 雷射：發射器+光束
    laser: <g>
      <rect x="6" y="10.4" width="15" height="3.2" rx="1.6" {...FS} />
      <rect x="7.5" y="11.4" width="13" height="1.1" rx="0.5" {...HL} />
      <circle cx="5.5" cy="12" r="3.4" {...FS} />
      <circle cx="4.6" cy="11" r="1.2" {...HL} />
    </g>,
    // 折射激光：彈射閃電
    chain: <g>
      <path d="M5 4 L10 10 L6.5 12 L13 16 L10.5 13 L19 19" {...S} stroke={`url(#${gid})`} strokeWidth="2.6" />
      <circle cx="5" cy="4" r="2" {...FS} /><circle cx="19" cy="19" r="2" {...FS} />
      <circle cx="11.5" cy="13" r="1.6" {...FS} />
    </g>,
    // 火焰
    flame: <g>
      <path d="M12 2 C15.5 6, 17.5 8.5, 17.5 13 A5.5 5.5 0 0 1 6.5 13 C6.5 10, 8.5 8.8, 9.2 6.5 C9.8 9, 11 9.4, 11.6 8 C11 5, 11 3.6, 12 2 Z" {...FS} />
      <path d="M12 9 C13.6 11, 14 12.4, 14 14 A2.4 2.4 0 0 1 9.6 15 C9.6 12.6, 11 11.5, 12 9 Z" {...HL} fill={light} opacity="0.85" />
    </g>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      {paths[type] || paths.dmg}
    </svg>
  );
}
