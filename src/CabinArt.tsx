type SceneArtProps = { miniature?: boolean };

const stones = [
  [912, 20, 120, 54], [1040, 14, 150, 60], [1198, 22, 112, 50], [920, 84, 90, 58], [1018, 82, 136, 62], [1162, 80, 148, 56],
  [908, 150, 140, 60], [1056, 148, 104, 64], [1168, 144, 140, 62], [918, 218, 108, 58], [1034, 220, 150, 56], [1192, 214, 118, 64],
  [910, 286, 150, 62], [1068, 284, 116, 58], [1192, 288, 120, 60], [906, 420, 86, 70], [1236, 420, 84, 70], [906, 498, 84, 64], [1238, 498, 82, 64],
  [906, 570, 86, 60], [1238, 570, 82, 60],
];
const pines = [[440, 390, 60], [520, 400, 44], [610, 384, 70], [680, 402, 40]];

export function CabinArt({ miniature = false }: SceneArtProps) {
  const prefix = miniature ? 'mini-cabin' : 'cabin';
  return <svg viewBox="0 0 1600 850" preserveAspectRatio="xMidYMid slice" className="scene-svg cabin-art" aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-sky`} x2="0" y2="1"><stop stopColor="#0e1828"/><stop offset="1" stopColor="#26344a"/></linearGradient>
      <linearGradient id={`${prefix}-floor`} x2="0" y2="1"><stop stopColor="#2a1a10"/><stop offset="1" stopColor="#140c08"/></linearGradient>
      <radialGradient id={`${prefix}-fire`}><stop stopColor="#ff9a48" stopOpacity=".34"/><stop offset=".5" stopColor="#e8783a" stopOpacity=".12"/><stop offset="1" stopColor="#e8783a" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${prefix}-embers`}><stop stopColor="#ffb25a" stopOpacity=".8"/><stop offset="1" stopColor="#ff7a2a" stopOpacity="0"/></radialGradient>
      <pattern id={`${prefix}-snow`} width="120" height="120" patternUnits="userSpaceOnUse"><g fill="#e8eef6"><circle cx="14" cy="18" r="2.2" opacity=".7"/><circle cx="62" cy="44" r="1.6" opacity=".55"/><circle cx="98" cy="12" r="1.3" opacity=".5"/><circle cx="36" cy="82" r="2" opacity=".65"/><circle cx="84" cy="96" r="1.5" opacity=".5"/><circle cx="110" cy="66" r="2.4" opacity=".7"/></g></pattern>
      <clipPath id={`${prefix}-window`}><path d="M392 162h296v256H392z"/></clipPath>
    </defs>
    <path fill="#27180f" d="M0 0h1600v850H0z"/>
    <g>{Array.from({ length: 14 }, (_, index) => <g key={index}><path fill={index % 2 ? '#2e1d12' : '#33210f'} d={`M0 ${index * 46}h1600v44H0z`}/><path d={`M0 ${index * 46 + 44}h1600`} stroke="#170d08" strokeWidth="4"/><path d={`M0 ${index * 46 + 8}h1600`} stroke="#4a3120" strokeWidth="1.5" opacity=".35"/></g>)}</g>
    <path fill={`url(#${prefix}-floor)`} d="M0 640h1600v210H0z"/>
    <g stroke="#120a06" strokeWidth="2" opacity=".6"><path d="M0 680h1600M0 730h1600M0 790h1600M300 640v40M820 680v50M1380 640v40M540 730v60M1160 730v60"/></g>
    <rect x="376" y="146" width="328" height="288" fill="#1a100a" stroke="#4a3322" strokeWidth="6"/>
    <g clipPath={`url(#${prefix}-window)`}>
      <path fill={`url(#${prefix}-sky)`} d="M392 162h296v256H392z"/>
      <path fill="#9fb0c4" opacity=".35" d="M392 360q80-40 150-14t146-22v94H392z"/>
      {pines.map(([x, y, height]) => <g key={x}><path fill="#0d1622" d={`M${x} ${y - height}l${height * .32} ${height}h-${height * .64}z`}/><path fill="#d9e2ec" opacity=".75" d={`M${x} ${y - height}l${height * .12} ${height * .36}h-${height * .24}z`}/></g>)}
      <path fill="#c9d4e0" opacity=".55" d="M392 400q150-22 296 0v18H392z"/>
      <g className="cabin-snow"><path fill={`url(#${prefix}-snow)`} d="M392 42h296v376H392z"/></g>
    </g>
    <g fill="#1a100a"><path d="M536 162h8v256h-8zM392 286h296v8H392z"/></g>
    <path fill="#e6ecf2" opacity=".85" d="M396 418q20-12 60-10t80 4 80-6 70 12z"/>
    <path fill="#3a2516" d="M362 432h356v18H362z"/>
    <g fill="#6a2d22"><path d="M350 136h60q-16 150 6 300h-60q-18-150-6-300z"/><path d="M670 136h60q10 150-6 300h-60q20-150 6-300z"/></g>
    <path fill="#3a3028" d="M892 0h436v640H892z"/>
    <g fill="#4a3e34" stroke="#2a221c" strokeWidth="2">{stones.map(([x, y, width, height]) => <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} rx="14"/>)}</g>
    <path fill="#4a2f1d" d="M864 370h492v28H864z"/><path fill="#2e1d12" d="M872 398h476v10H872z"/>
    <g><path fill="#8a6a44" d="M934 330h22v40h-22z"/><path fill="#f3d9a0" d="M942 318q4-10 8 0-4 8-8 0z" className="cabin-candle"/><path fill="#5a3b26" d="M1230 322h44v48h-44z"/><circle cx="1252" cy="344" r="14" fill="#e8d8b8"/><path d="M1252 344v-8M1252 344l6 4" stroke="#3a2516" strokeWidth="2"/><path fill="#7a3a2a" d="M1020 340h14v30h-14zM1036 336h12v34h-12zM1050 344h16v26h-16z"/></g>
    <ellipse cx="1110" cy="560" rx="430" ry="330" fill={`url(#${prefix}-fire)`}/>
    <path fill="#120a06" d="M994 634V504q116-96 232 0v130z"/>
    <ellipse cx="1110" cy="612" rx="110" ry="34" fill={`url(#${prefix}-embers)`}/>
    <g className="cabin-flame">
      <path fill="#e0702e" d="M1044 618q-10-60 30-96 0 40 22 50 4-60 40-96 10 70 34 100 14-30 6-60 40 50 20 102z"/>
      <path fill="#f39a3e" d="M1066 618q-4-44 24-66 2 28 18 34 6-40 30-60 6 50 22 70 8-18 4-36 26 34 10 58z"/>
      <path fill="#ffd27a" d="M1090 618q0-26 18-40 2 16 12 18 4-20 16-30 4 30 10 52z"/>
    </g>
    <g fill="#4a2a18" stroke="#2a170c" strokeWidth="2"><path d="M1030 606l150 16-4 14-150-16z"/><path d="M1190 604l-150 18 4 14 150-18z"/></g>
    <path fill="#4a3e34" d="M960 632h300v28H960z"/><path fill="#5a4c40" d="M960 632h300v5H960z"/>
    <g fill="#8a5a36" stroke="#4a2a18" strokeWidth="2">{[[830, 616], [866, 616], [848, 586], [884, 588], [866, 558]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="17"/>)}</g>
    <g fill="none" stroke="#5a3a22" strokeWidth="1.5">{[[830, 616], [866, 616], [848, 586], [884, 588], [866, 558]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="8"/>)}</g>
    <ellipse cx="1060" cy="760" rx="400" ry="62" fill="#5a2a1e"/><ellipse cx="1060" cy="760" rx="350" ry="48" fill="none" stroke="#7a3e2a" strokeWidth="4"/>
    <g><path fill="#6a3a26" d="M1420 480q60-12 110 10l40 320h-190l-20-150q-40 0-50-40l20-30q40-10 60 20z"/><path fill="#8a4a30" d="M1360 600q70-20 130 0l10 80q-80 18-150 0z"/><path fill="#9a5a38" d="M1380 560q-40 0-40 30l10 30q30-26 64-22z"/><path fill="#2a170c" d="M1370 810h16v30h-16zM1540 810h16v30h-16z"/><path fill="#b0703e" opacity=".5" d="M1420 486q60-10 104 8l6 40q-50-18-104-10z"/></g>
    <g><ellipse cx="1300" cy="700" rx="30" ry="6" fill="#2a170c"/><path fill="#c9b08a" d="M1284 668h32l-3 32h-26z"/><path d="M1316 674q14 2 8 16h-10" fill="none" stroke="#c9b08a" strokeWidth="4"/><path className="tea-steam" d="M1294 660q-7-9 0-18t0-16M1306 658q7-9 0-18" fill="none" stroke="#e8dcc8" strokeWidth="2" opacity=".3"/></g>
  </svg>;
}
