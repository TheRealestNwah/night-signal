import type { SceneId } from './scenes';
import { ArcadeArt, HighwayArt } from './OtherScenes';
import { CabinArt } from './CabinArt';
import { TrainArt } from './TrainArt';

const buildings = [
  [410, 258, 66, 350], [485, 188, 82, 420], [575, 286, 44, 320], [630, 217, 104, 390],
  [748, 134, 66, 475], [824, 276, 76, 335], [911, 206, 64, 400], [985, 309, 92, 300],
  [1087, 168, 77, 440], [1175, 270, 66, 340], [1253, 211, 112, 400], [1374, 323, 75, 289],
];

export function ApartmentArt({ miniature = false }: { miniature?: boolean }) {
  const prefix = miniature ? 'mini-apt' : 'apt';
  return <svg viewBox="0 0 1600 850" preserveAspectRatio="xMidYMid slice" className="scene-svg apartment-art" aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-sky`} x2="0" y2="1"><stop stopColor="#162d3c"/><stop offset="1" stopColor="#526774"/></linearGradient>
      <linearGradient id={`${prefix}-wall`}><stop stopColor="#131b20"/><stop offset=".55" stopColor="#243033"/><stop offset="1" stopColor="#172328"/></linearGradient>
      <radialGradient id={`${prefix}-light`}><stop stopColor="#e2ab65" stopOpacity=".2"/><stop offset="1" stopColor="#d59a4a" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${prefix}-glass`} x2="1" y2="1"><stop stopColor="#8cafbd" stopOpacity=".13"/><stop offset=".5" stopColor="#a1c0cd" stopOpacity="0"/><stop offset="1" stopColor="#b7dae4" stopOpacity=".1"/></linearGradient>
      <linearGradient id={`${prefix}-floor`} x2=".6" y2="1"><stop stopColor="#252925"/><stop offset="1" stopColor="#0e171c"/></linearGradient>
      <pattern id={`${prefix}-rain`} width="111" height="130" patternUnits="userSpaceOnUse" patternTransform="rotate(13)"><path d="M15 6v18 M48 63v29 M84 20v9 M102 96v20" stroke="#a3c7d2" strokeWidth="1.1" opacity=".27"/></pattern>
      <clipPath id={`${prefix}-window`}><path d="M506 92h863v492H506z"/></clipPath>
    </defs>
    <path fill={`url(#${prefix}-wall)`} d="M0 0h1600v850H0z"/>
    <path fill="#101a20" d="M0 0h1600v50H0z"/>
    <path fill="#1a2427" d="M0 630h1600v30H0z"/>
    <path fill={`url(#${prefix}-floor)`} d="M0 660h1600v190H0z"/>
    <g stroke="#465252" opacity=".13"><path d="M700 660 280 850M900 660l50 190M1100 660l550 190M0 725h1600M0 810h1600"/></g>
    <path fill="#0c161e" stroke="#38484c" strokeWidth="2" d="M487 71h899v540H487z"/>
    <g clipPath={`url(#${prefix}-window)`}>
      <path fill={`url(#${prefix}-sky)`} d="M505 90h865v496H505z"/>
      <ellipse fill="#9aafbc" opacity=".08" cx="915" cy="225" rx="350" ry="71"/>
      <g fill="#263b49"><path d="M400 450V315h55v-32h44v32h80v-56h43v190M788 465V291h57v-44h46v44h45v-31h35v-10h42v208M1060 470V330h23V270h34v32h63v-47h44v33h98v-33h57v49h81v155"/></g>
      {buildings.map(([x,y,w,h], i) => <g key={x}>
        <path fill={i % 3 === 0 ? '#142633' : '#1d303e'} d={`M${x} ${y}h${w}v${h}h-${w}z`}/>
        <path fill="#30434b" d={`M${x + 5} ${y - 6}h${w - 10}v6h-${w - 10}z`}/>
        {Array.from({ length: Math.floor(w / 15) * 13 }, (_, j) => {
          const col = j % Math.floor(w / 15), row = Math.floor(j / Math.floor(w / 15));
          return <rect key={j} x={x + 9 + col * 15} y={y + 16 + row * 25} width={5} height={8} fill={(j * 7 + i * 3) % 9 < 3 ? '#d5b685' : '#688a9b'} opacity={(j + i * 5) % 7 < 3 ? .64 : .07}/>;
        })}
      </g>)}
      <path d="M535 569h880" stroke="#627583" strokeWidth="23"/>
      <path d="M535 574h880" stroke="#182b36" strokeWidth="16"/>
      <g className="passing-car"><path d="M705 572h28" stroke="#edc48c" strokeWidth="2"/><path d="M701 575h17" stroke="#edc48c" opacity=".17" strokeWidth="5"/></g>
      <path fill={`url(#${prefix}-glass)`} d="M505 90h865v496H505z"/>
      <g className="rainfall"><path fill={`url(#${prefix}-rain)`} d="M430-150h1050v1000H430z"/></g>
      <g fill="none" stroke="#b1c8cc" opacity=".16" strokeWidth="1.2"><path d="M592 99v66l-7 21v81M887 93v126l6 23v63M1021 140v148l-8 22v65M1244 94v46l-5 33v153M741 285v35l-9 40v88M1132 416v100l-6 37"/></g>
    </g>
    <g fill="#0b161c" stroke="#334347" strokeWidth="1"><path d="M500 82h13v516h-13zM793 82h16v516h-16zM1080 82h16v516h-16zM1363 82h15v516h-15zM500 356h878v12H500zM500 580h878v16H500z"/></g>
    <path fill="#293536" d="M473 600h928l-20 18H482z"/><path fill="#0e191e" d="M482 618h899v15H482z"/>
    <g fill="#1a282c"><path d="M429 55h54l40 566-36 12-37-37z"/><path d="M456 55h22l15 523-13 12z" fill="#344143" opacity=".45"/><path d="M1391 55h64l-19 559-67 16z"/><path d="M1412 55h18l-28 553-15 9z" fill="#415052" opacity=".3"/></g>
    <ellipse cx="443" cy="460" rx="285" ry="267" fill={`url(#${prefix}-light)`}/>
    <g className="lamp"><path d="M392 365h72l29 61h-131z" fill="#b88e61"/><path d="M371 405h111l11 21H362z" fill="#d5b582"/><ellipse cx="427" cy="426" rx="65" ry="6" fill="#f0cb91"/><path d="M424 432h6v181h-6z" fill="#9e825d"/><ellipse cx="427" cy="615" rx="39" ry="6" fill="#775f43"/></g>
    <g><path fill="#182328" d="M80 606q3-28 30-28h197q28 0 30 28l29 135H60z"/><path fill="#283336" d="M98 602q4-19 24-19h167q21 1 23 20l14 70H89z"/><path fill="#303a38" d="m213 590 68 3 10 59-67 1z"/><path fill="#19262b" d="M53 669q0-15 17-15h24v80H52zM324 654h20q22 0 22 17v65h-42z"/><path fill="#0d171d" d="M75 733h266v12H75zM78 743h12v34H78zM326 743h10v34H326z"/></g>
    <g><path d="M365 623h173l15 10H352z" fill="#5b5042"/><path d="M358 633h187v13H358z" fill="#382f28"/><path d="M368 646h9v105h-9zM526 646h8v105h-8z" fill="#192025"/></g>
    <g transform="translate(1061 514)"><path d="M0 64h180l49 15H-17z" fill="#625749"/><path d="M-17 79h246v10H-17z" fill="#302e28"/><path d="M0 89h8v134H0zM207 89h8v134h-8z" fill="#1b2325"/><path d="M7 15h102v49H7z" fill="#17252d" stroke="#48575a" strokeWidth="3"/><path d="M15 23h86v33H15z" fill="#617476" opacity=".35"/><path d="m6 65-17 6h130l-10-6z" fill="#445154"/><path d="M140 50h23v19q-12 8-23 0z" fill="#aeb2a2"/><path d="M163 53q17-2 10 12h-10" fill="none" stroke="#aeb2a2" strokeWidth="4"/><path className="tea-steam" d="M146 41q-7-8 0-18t0-16M157 39q7-8 0-17" fill="none" stroke="#c6c7b2" strokeWidth="2" opacity=".3"/></g>
    <g transform="translate(1285 597)"><path d="M0 0h100l-16 105H18z" fill="#4f4d3e"/><path d="M7 8h86l-3 12H10z" fill="#72705a"/><g stroke="#547365" fill="#344e42" strokeWidth="2"><path d="M50 0q-9-91 19-130Q90-55 50 0M51-6Q4-97-6-86-26-35 51-6M47-2q25-84 71-83 0 55-71 83M48-8q-49-27-86-11Q-20 9 48-8M52-11q65-26 96 5-65 22-96-5"/></g></g>
    <path d="M1470 0h130v850h-130z" fill="#111c21" opacity=".65"/>
  </svg>;
}

export function Scene({ scene, miniature = false }: { scene: SceneId; miniature?: boolean }) {
  const Art = { apartment: ApartmentArt, highway: HighwayArt, arcade: ArcadeArt, train: TrainArt, cabin: CabinArt }[scene];
  return <Art miniature={miniature}/>;
}
