type SceneArtProps = { miniature?: boolean };

const lighthouseStars = [[120, 90], [260, 180], [520, 70], [640, 210], [760, 110], [880, 60], [980, 190], [1320, 80], [1440, 170], [1540, 60], [60, 260], [700, 300]];
const reflection = [[420, 488, 36], [412, 512, 50], [428, 538, 28], [404, 566, 60], [424, 598, 40], [410, 634, 70], [430, 676, 34], [402, 716, 80]];

export function LighthouseArt({ miniature = false }: SceneArtProps) {
  const prefix = miniature ? 'mini-lighthouse' : 'lighthouse';
  return <svg viewBox="0 0 1600 850" preserveAspectRatio="xMidYMid slice" className="scene-svg lighthouse-art" aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-sky`} x2="0" y2="1"><stop stopColor="#081219"/><stop offset=".75" stopColor="#15303e"/><stop offset="1" stopColor="#23465a"/></linearGradient>
      <linearGradient id={`${prefix}-sea`} x2="0" y2="1"><stop stopColor="#123040"/><stop offset="1" stopColor="#06121a"/></linearGradient>
      <linearGradient id={`${prefix}-tower`}><stop stopColor="#d6dddd"/><stop offset=".6" stopColor="#aab6b8"/><stop offset="1" stopColor="#6f7f84"/></linearGradient>
      <linearGradient id={`${prefix}-beam`}><stop stopColor="#ffe2a0" stopOpacity=".42"/><stop offset=".45" stopColor="#ffe2a0" stopOpacity=".12"/><stop offset="1" stopColor="#ffe2a0" stopOpacity="0"/></linearGradient>
      <radialGradient id={`${prefix}-flare`}><stop stopColor="#fff1c8" stopOpacity=".9"/><stop offset=".25" stopColor="#ffd27a" stopOpacity=".35"/><stop offset="1" stopColor="#ffd27a" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${prefix}-moon`}><stop stopColor="#dfe6e0" stopOpacity=".16"/><stop offset="1" stopColor="#dfe6e0" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${prefix}-window`}><stop stopColor="#f0b35a" stopOpacity=".4"/><stop offset="1" stopColor="#f0b35a" stopOpacity="0"/></radialGradient>
    </defs>
    <path fill={`url(#${prefix}-sky)`} d="M0 0h1600v480H0z"/>
    <g fill="#d4dee2">{lighthouseStars.map(([x, y], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r={index % 3 ? .8 : 1.3} opacity={index % 3 ? .35 : .6}/>)}</g>
    <circle cx="420" cy="150" r="140" fill={`url(#${prefix}-moon)`}/>
    <circle cx="420" cy="150" r="24" fill="#dfe6e0" opacity=".9"/><circle cx="430" cy="144" r="21" fill="#10222c" opacity=".55"/>
    <path fill="#0e2230" d="M120 476q60-18 130-6t140-2 120 8v10H120z"/>
    <path fill={`url(#${prefix}-sea)`} d="M0 476h1600v374H0z"/>
    <g stroke="#e6ecd8" strokeLinecap="round">{reflection.map(([x, y, width], index) => <path key={y} d={`M${x - width / 2} ${y}h${width}`} strokeWidth={2 + index * .3} opacity={.35 - index * .03}/>)}</g>
    <g stroke="#2d5264" strokeWidth="1.5" opacity=".45" fill="none"><path d="M40 520q120-6 240 0M560 548q140-8 280 0M180 612q160-10 320 0M620 660q180-10 360 0M60 730q200-12 400 0M540 790q220-12 440 0"/></g>
    <g className="lighthouse-beam"><path fill={`url(#${prefix}-beam)`} d="M1180 184 2500 20v330L1180 196z"/></g>
    <path fill="#0b1a20" d="M880 850q30-120 110-200 40-60 90-120l70-14h450v484z"/>
    <path fill="#12262e" d="M1020 536q60-24 580-8v22q-500-8-560 10z"/>
    <g fill="none" stroke="#1c333b" strokeWidth="3" opacity=".7"><path d="M960 720q40-30 90-34M1040 620q50-24 110-20M1380 640q70-18 150-6"/></g>
    <g className="lighthouse-foam" fill="none" stroke="#cfe0e6" strokeLinecap="round"><path d="M870 842q40-20 90-12M905 780q30-16 70-8" strokeWidth="3"/><path d="M930 812q30-10 60-4M960 750q24-8 50-2" strokeWidth="2"/></g>
    <path fill={`url(#${prefix}-tower)`} d="M1135 522l15-292h60l15 292z"/>
    <g fill="#7a3a34"><path d="M1146 300h68l2 32h-72zM1141 400h78l2 32h-82z"/></g>
    <path fill="#0d1d24" opacity=".35" d="M1190 230h20l15 292h-30z"/>
    <path fill="#e8c27a" d="M1168 470h24v52h-24z"/><path fill="#f6d79a" d="M1172 474h16v44h-16z" opacity=".7"/>
    <path fill="#1a2a30" d="M1134 218h92v12h-92z"/><g stroke="#1a2a30" strokeWidth="2"><path d="M1138 218v-14M1158 218v-14M1180 218v-14M1202 218v-14M1222 218v-14M1136 204h88"/></g>
    <path fill="#fff0c4" d="M1156 160h48v44h-48z"/><g stroke="#3a4a4e" strokeWidth="1.5" fill="none"><path d="M1156 160h48v44h-48zM1172 160v44M1188 160v44"/></g>
    <path fill="#16262c" d="M1150 162l30-34 30 34z"/><path d="M1180 128v-14" stroke="#16262c" strokeWidth="3"/><circle cx="1180" cy="112" r="4" fill="#16262c"/>
    <circle className="lighthouse-flare" cx="1180" cy="186" r="90" fill={`url(#${prefix}-flare)`}/>
    <g><path fill="#26363c" d="M1300 450h160v74h-160z"/><path fill="#142228" d="M1288 454l92-64 92 64z"/><path fill="#142228" d="M1420 400h20v40h-20z"/><ellipse cx="1350" cy="488" rx="80" ry="60" fill={`url(#${prefix}-window)`}/><path fill="#f0b35a" d="M1334 474h32v28h-32z"/><path d="M1350 474v28M1334 488h32" stroke="#6a4a24" strokeWidth="2"/><path fill="#1a2a30" d="M1408 488h22v36h-22z"/></g>
  </svg>;
}
