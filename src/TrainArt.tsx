type SceneArtProps = { miniature?: boolean };

const trainStars = [[560, 150], [640, 232], [735, 138], [842, 198], [930, 128], [1010, 246], [1236, 132], [1262, 262]];
// Clusters of lit windows in the towns going by, repeated every 1600 units so the scroll loops.
const towns = [[90, 9], [610, 5], [1060, 12], [1420, 4]];
const townLights = towns.flatMap(([x, count]) => Array.from({ length: count }, (_, index) => [x + index * 17 + (index % 3) * 5, 452 + (index * 7) % 16, index % 4 === 0 ? 3 : 2.2]));

export function TrainArt({ miniature = false }: SceneArtProps) {
  const prefix = miniature ? 'mini-train' : 'train';
  return <svg viewBox="0 0 1600 850" preserveAspectRatio="xMidYMid slice" className="scene-svg train-art" aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-wall`}><stop stopColor="#101b16"/><stop offset=".5" stopColor="#1b2b22"/><stop offset="1" stopColor="#101a15"/></linearGradient>
      <linearGradient id={`${prefix}-sky`} x2="0" y2="1"><stop stopColor="#0b181b"/><stop offset=".7" stopColor="#1b3230"/><stop offset="1" stopColor="#2a4137"/></linearGradient>
      <linearGradient id={`${prefix}-seat`} x2="0" y2="1"><stop stopColor="#26402f"/><stop offset="1" stopColor="#14231a"/></linearGradient>
      <linearGradient id={`${prefix}-glass`} x2="1" y2="1"><stop stopColor="#a8c9b8" stopOpacity=".08"/><stop offset=".5" stopColor="#a8c9b8" stopOpacity="0"/><stop offset="1" stopColor="#a8c9b8" stopOpacity=".06"/></linearGradient>
      <radialGradient id={`${prefix}-lamp`}><stop stopColor="#f2b766" stopOpacity=".2"/><stop offset="1" stopColor="#f2b766" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${prefix}-moon`}><stop stopColor="#e6dcc0" stopOpacity=".16"/><stop offset="1" stopColor="#e6dcc0" stopOpacity="0"/></radialGradient>
      <clipPath id={`${prefix}-window`}><rect x="520" y="120" width="760" height="420" rx="46"/></clipPath>
    </defs>
    <path fill={`url(#${prefix}-wall)`} d="M0 0h1600v850H0z"/>
    <path fill="#0c1511" d="M0 0h1600v52H0z"/>
    <g stroke="#b08d4f" fill="none"><path d="M360 72h1080" strokeWidth="4" opacity=".75"/><path d="M360 88h1080" strokeWidth="2" opacity=".4"/><path d="M420 52v36M800 52v36M1180 52v36M1400 52v36" strokeWidth="3" opacity=".6"/></g>
    <path fill="#24190f" d="M0 578h1600v272H0z"/>
    <g stroke="#3b2a1b" strokeWidth="2"><path d="M0 590h1600"/><path d="M200 600v250M520 600v250M860 600v250M1180 600v250M1500 600v250" opacity=".6"/></g>
    <rect x="500" y="100" width="800" height="460" rx="62" fill="#0a1310" stroke="#7a6238" strokeWidth="6"/>
    <g clipPath={`url(#${prefix}-window)`}>
      <path fill={`url(#${prefix}-sky)`} d="M500 100h800v460H500z"/>
      <g fill="#c8d2bf">{trainStars.map(([x, y], index) => <circle key={x} cx={x} cy={y} r={index % 3 ? .8 : 1.2} opacity={index % 3 ? .3 : .5}/>)}</g>
      <circle cx="1150" cy="200" r="120" fill={`url(#${prefix}-moon)`}/>
      <circle cx="1150" cy="200" r="21" fill="#e6dcc0" opacity=".85"/>
      <path fill="#172b2a" d="M500 420q120-60 260-25t260-15 280 20v140H500z"/>
      <g className="train-far">
        {[0, 1600].map(offset => <g key={offset} transform={`translate(${offset} 0)`}>
          <path fill="#0f201e" d="M0 462q140-34 300-12t330-18 360 10 300-6 310 20v120H0z"/>
          <g fill="#e8b86a">{townLights.map(([x, y, size], index) => <rect key={index} x={x} y={y} width={size} height={size} opacity={index % 5 === 0 ? .45 : .8}/>)}</g>
        </g>)}
      </g>
      <path fill="#09130f" d="M500 500h800v60H500z"/>
      <g className="train-near" stroke="#07100d" fill="none">
        {[0, 800, 1600, 2400].map(x => <g key={x}>
          <path d={`M${x + 300} 322v180`} strokeWidth="7"/>
          <path d={`M${x + 282} 338h36`} strokeWidth="4"/>
          <path d={`M${x + 290} 338q400 60 800 0`} strokeWidth="1.5" opacity=".8"/>
        </g>)}
      </g>
      <path fill={`url(#${prefix}-glass)`} d="M500 100h800v460H500z"/>
    </g>
    <path fill="#3a2a1c" d="M478 552h844v24H478z"/><path fill="#5a4430" d="M478 552h844v4H478z"/>
    <g fill="#2a4634"><path d="M430 96h118q-20 120 4 250t-22 238H440q24-120 0-240t-10-248z"/><path d="M1252 96h118q-10 128-10 248t0 240h-90q-46-110-22-238t4-250z"/></g>
    <g stroke="#1b2f23" strokeWidth="3" fill="none" opacity=".8"><path d="M466 110q-10 150 2 300t-8 170M508 110q-14 140 0 280t-12 190M1292 110q14 140 0 280t12 190M1334 110q10 150-2 300t8 170"/></g>
    <g fill="#b08d4f"><rect x="436" y="340" width="100" height="10" rx="5"/><rect x="1264" y="340" width="100" height="10" rx="5"/></g>
    <ellipse cx="1100" cy="520" rx="260" ry="200" fill={`url(#${prefix}-lamp)`}/>
    <g><path fill="#4a3524" d="M740 598h500v16H740z"/><path fill="#2e2016" d="M740 614h500v8H740z"/><path fill="#2a1d13" d="M968 622h32v228h-32z"/><path fill="#3a2a1c" d="M930 620h108l-24 20h-60z"/></g>
    <g><ellipse cx="880" cy="597" rx="34" ry="5" fill="#cfc6b0"/><path d="M860 566h40l-4 30h-32z" fill="#e4dcc6"/><path d="M900 572q16 0 10 16h-12" fill="none" stroke="#e4dcc6" strokeWidth="4"/><path className="tea-steam" d="M872 556q-7-9 0-18t0-16M886 554q7-9 0-18" fill="none" stroke="#d8d6c2" strokeWidth="2" opacity=".3"/></g>
    <g><path d="M946 590h92l6 8h-104z" fill="#6b2f28"/><path d="M950 584h86l4 6h-94z" fill="#e2d8c2"/></g>
    <g className="lamp"><ellipse cx="1110" cy="597" rx="30" ry="5" fill="#8a6a3a"/><path d="M1107 520h6v76h-6z" fill="#b08d4f"/><path d="M1080 478h60l18 44h-96z" fill="#e3a95e"/><path d="M1062 522h96l-4 6h-88z" fill="#f6cf8e"/></g>
    <g><path fill={`url(#${prefix}-seat)`} d="M250 300q60-20 130 0 40 12 40 60v490H230V350q0-38 20-50z"/><path fill="#1b3024" d="M270 330q50-14 110 0v520H270z" opacity=".6"/><g fill="#0f1c15">{[380, 450, 520, 590].map(y => <circle key={y} cx="325" cy={y} r="4"/>)}</g><path d="M246 300q66-24 138 0" fill="none" stroke="#b08d4f" strokeWidth="4" opacity=".7"/></g>
    <g><path fill={`url(#${prefix}-seat)`} d="M1350 300q-60-20-130 0-40 12-40 60v490h190V350q0-38-20-50z" transform="translate(180 0)"/><path d="M1394 300q66-24 138 0" fill="none" stroke="#b08d4f" strokeWidth="4" opacity=".7"/></g>
    <path d="M0 790h1600v60H0z" fill="#1b0f0d"/>
  </svg>;
}
