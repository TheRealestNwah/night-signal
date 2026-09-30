type SceneArtProps = { miniature?: boolean };

const highwayStars = [
  [673, 105], [728, 197], [824, 67], [872, 154], [958, 91], [1034, 179],
  [1097, 114], [1168, 59], [1294, 89], [1386, 198], [1442, 110], [1518, 61],
];

export function HighwayArt({ miniature = false }: SceneArtProps) {
  const prefix = miniature ? 'mini-highway' : 'highway';
  return <svg viewBox="0 0 1600 850" preserveAspectRatio="xMidYMid slice" className="scene-svg highway-art" aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-sky`} x2="0" y2="1"><stop stopColor="#111d2a"/><stop offset=".65" stopColor="#273a47"/><stop offset="1" stopColor="#697379"/></linearGradient>
      <linearGradient id={`${prefix}-road`} x2="0" y2="1"><stop stopColor="#36444a"/><stop offset="1" stopColor="#202e34"/></linearGradient>
      <linearGradient id={`${prefix}-dash`} x2="0" y2="1"><stop stopColor="#283538"/><stop offset="1" stopColor="#0b151d"/></linearGradient>
      <linearGradient id={`${prefix}-windshield`} x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#85a9b9" stopOpacity=".065"/><stop offset=".55" stopColor="#85a9b9" stopOpacity="0"/><stop offset="1" stopColor="#adc2bb" stopOpacity=".06"/></linearGradient>
      <radialGradient id={`${prefix}-moon-glow`}><stop stopColor="#d0d4c2" stopOpacity=".12"/><stop offset="1" stopColor="#d0d4c2" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${prefix}-headlights`} x2="0" y2="1"><stop stopColor="#d6d7b9" stopOpacity="0"/><stop offset=".6" stopColor="#d6d7b9" stopOpacity=".035"/><stop offset="1" stopColor="#d6d7b9" stopOpacity=".1"/></linearGradient>
      <clipPath id={`${prefix}-view`}><path d="M205 92Q858-2 1417 84l183 422v139Q894 576 200 659L64 558z"/></clipPath>
      <clipPath id={`${prefix}-road-clip`}><path d="m962 397-567 323h1205V691L985 397z"/></clipPath>
    </defs>
    <path fill="#101a22" d="M0 0h1600v850H0z"/>
    <g clipPath={`url(#${prefix}-view)`}>
      <path fill={`url(#${prefix}-sky)`} d="M0 0h1600v720H0z"/>
      <g fill="#b0c0c3">
        {highwayStars.map(([x, y], index) => <circle key={x} cx={x} cy={y} r={index % 3 === 0 ? 1.1 : .65} opacity={index % 3 === 0 ? .4 : .24}/>)}
      </g>
      <circle cx="1230" cy="161" r="128" fill={`url(#${prefix}-moon-glow)`}/>
      <circle cx="1230" cy="161" r="21" fill="#c9cdba" opacity=".79"/>
      <path d="M1237 141a21 21 0 0 1-23 36 21 21 0 0 0 23-36" fill="#7f969a" opacity=".45"/>
      <g fill="#768b94" opacity=".08"><path d="M950 254q166-43 434-14-155 16-434 14M451 197q112-19 270-8-167 14-270 8M1258 311q185-32 378-5v20q-170-8-378-15"/></g>
      <path d="m30 402 137-77 91 24 109-60 95 38 69-33 110 42 73-22 98 51 141-18 86 33 116-54 97 30 105-51 61 22 94-49 159 75 164-21v199H0z" fill="#31434e"/>
      <path d="m0 426 161-48 115 32 153-45 119 37 115-23 134 31 170-21 143 23 131-57 106 45 147-17 132 24v176H0z" fill="#21343e"/>
      <path d="m0 476 172-13 167 19 148-20 164 2 170-41 147-26 130 35 127 15 163-7 212 31v229H0z" fill="#1a2b33"/>
      <path d="m962 397-567 323h1205V691L985 397z" fill={`url(#${prefix}-road)`}/>
      <path d="m975 414-407 248 932 9-514-257z" fill={`url(#${prefix}-headlights)`}/>
      <g fill="none" strokeLinecap="round">
        <path d="m962 402-504 290" stroke="#b0b39b" strokeWidth="2" opacity=".54"/>
        <path d="m986 402 582 283" stroke="#a6ad9d" strokeWidth="2" opacity=".5"/>
        <path d="m965 403-486 299" stroke="#bfac79" strokeWidth="1.4" opacity=".37"/>
      </g>
      <g clipPath={`url(#${prefix}-road-clip)`}>
        <g className="highway-road-motion" fill="#c4c2a8" opacity=".54">
          {Array.from({ length: 9 }, (_, index) => {
            const near = 9 * 1.7 ** index;
            const far = near * 1.3;
            return <g key={index}>{[-.56, .59].map(slope => <path key={slope} d={`M${970 + slope * near - near * .011} ${400 + near}L${970 + slope * near + near * .011} ${400 + near}L${970 + slope * far + far * .011} ${400 + far}L${970 + slope * far - far * .011} ${400 + far}Z`}/>)}</g>;
          })}
        </g>
      </g>
      <g fill="none" stroke="#6b7b7d">
        <path d="m949 406-638 200" strokeWidth="3" opacity=".64"/>
        <path d="m947 410-638 204" strokeWidth="2" opacity=".22"/>
        <path d="m1001 408 599 222" strokeWidth="3" opacity=".62"/>
        <path d="m1001 412 599 232" strokeWidth="2" opacity=".2"/>
        {[.08, .15, .26, .43, .68, 1].map(distance => <g key={distance} opacity=".58">
          <path d={`M${949 - 638 * distance} ${406 + 200 * distance}v${7 + 26 * distance}`} strokeWidth={1 + 3 * distance}/>
          <path d={`M${1001 + 599 * distance} ${408 + 222 * distance}v${7 + 30 * distance}`} strokeWidth={1 + 3 * distance}/>
        </g>)}
      </g>
      <g stroke="#162832" fill="none">
        <path d="M1242 325v134M1376 270v234M1577 187v391" strokeWidth="5"/>
        <path d="M1219 337h47M1346 288h60M1535 213h82" strokeWidth="4"/>
        <path d="M1242 331q69 34 134-51 102 22 201-78" opacity=".8"/>
        <path d="M1261 340q60 32 140-46 96 24 216-71" opacity=".55"/>
      </g>
      <g transform="translate(1096 326)">
        <path d="M8 57v61M124 57v104" stroke="#3b5055" strokeWidth="4"/>
        <path d="M0 0h137v64H0z" fill="#294e4e" stroke="#778f88" strokeWidth="1.5"/>
        <path d="M5 5h127v54H5z" fill="none" stroke="#8ba297" strokeWidth=".6" opacity=".56"/>
        <text x="16" y="23" fill="#b8c5b2" fontSize="10" fontFamily="Arial, sans-serif" letterSpacing="2">NORTH / 07</text>
        <text x="16" y="43" fill="#b8c5b2" fontSize="8" fontFamily="Arial, sans-serif" letterSpacing="1.5">KEEP GOING</text>
        <path d="M115 42V22m-6 7 6-7 6 7" fill="none" stroke="#b8c5b2" strokeWidth="1.5"/>
      </g>
      <g transform="translate(882 388)"><path d="M0 0h23v13H0z" fill="#5b614e"/><path d="M11 13v17" stroke="#50605d" strokeWidth="2"/><path d="M4 5h15M4 8h10" stroke="#b5b69c" opacity=".6"/></g>
      <g transform="translate(973 414)"><path d="m-8 0 2-5H4l4 5v5H-8z" fill="#203039"/><path d="M-7 2h3M4 2h3" stroke="#c8886f" strokeWidth="1.5"/><path d="M-7 5h3M4 5h3" stroke="#c8886f" strokeWidth="3" opacity=".09"/></g>
      <path d="M0 0h1600v710H0z" fill={`url(#${prefix}-windshield)`}/>
      <path d="M698 82q377-32 631 24M1102 130l308 235" fill="none" stroke="#b2c6c8" strokeWidth="2" opacity=".045"/>
    </g>
    <path d="M0 0h1600v63Q889-12 224 84L68 562l-68 42z" fill="#0a141d"/>
    <path d="m216 84 29-4L99 575l-32 6z" fill="#243138"/>
    <path d="m1411 66 37 4 152 334v122z" fill="#111f28"/>
    <path d="m1423 80 10 1 167 385v35z" fill="#37434a" opacity=".6"/>
    <g transform="translate(989 81)"><path d="M-3-37h9v52h-9z" fill="#101a22"/><path d="M-89 6q-8 0-8 9v41q0 10 10 10H75q10 0 10-9V16q0-10-10-10z" fill="#15232c" stroke="#38464a" strokeWidth="2"/><path d="M-85 15H72v39H-85z" fill="#35474e"/><path d="m-84 47 48-17 60 7 47-16v33H-84z" fill="#253840"/><path d="M-74 23h51" stroke="#7b9299" opacity=".16"/><circle cx="0" cy="63" r="2" fill="#89a597" opacity=".5"/></g>
    <path d="M0 671Q641 565 1224 614q247 15 376 55v181H0z" fill={`url(#${prefix}-dash)`}/>
    <path d="M0 685q836-134 1600 3" fill="none" stroke="#61706b" strokeWidth="2" opacity=".32"/>
    <path d="M299 642q224-54 481-6l17 26q-238-40-487 9z" fill="#13222a"/>
    <path d="M1110 643q211-5 373 27l-13 18q-202-33-362-26z" fill="#111e27" stroke="#3c4b4e"/>
    <g stroke="#536260" opacity=".31">{Array.from({ length: 15 }, (_, index) => <path key={index} d={`M${1131 + index * 22} ${651 + index * index * .075}l-5 8`}/>)}</g>
    <path d="M1030 703h286l29 147h-323z" fill="#121f27" stroke="#3b4b4e" strokeWidth="1.5"/>
    <path d="M1060 724h229v58h-229z" fill="#243b3d" stroke="#58716c" strokeWidth="1"/>
    <text x="1077" y="746" fill="#a5b7a0" fontSize="10" fontFamily="monospace" letterSpacing="2">NIGHT SIGNAL</text>
    <text x="1077" y="767" fill="#99b29e" fontSize="12" fontFamily="monospace" letterSpacing="2">FM  90.7</text>
    <g fill="#95b6a8" opacity=".5">{[5, 9, 14, 7, 11, 17, 9, 5].map((height, index) => <rect key={index} x={1213 + index * 7} y={767 - height} width="3" height={height}/>)}</g>
    <g fill="#26343a" stroke="#53625d"><circle cx="1082" cy="813" r="16"/><circle cx="1270" cy="813" r="16"/><path d="M1130 803h85v20h-85z" fill="#17272d"/></g>
    <path d="M1082 800v6M1270 800v6" stroke="#c4b18b" strokeWidth="2"/>
    <path d="M1164 809h18l-9 8z" fill="none" stroke="#997365"/>
    <g transform="translate(764 730)">
      <path d="M-178 22q0-109 140-109T102 22" fill="#101f28" stroke="#475651" strokeWidth="2"/>
      <g fill="#111e26" stroke="#455951" strokeWidth="2"><circle cx="-104" cy="-21" r="39"/><circle cx="15" cy="-21" r="39"/></g>
      <g fill="none" stroke="#b3a584" strokeWidth="2" opacity=".7"><path d="M-132-3a31 31 0 1 1 55-5M-14-3a31 31 0 1 1 55-5"/></g>
      <path d="m-104-21 13-20M15-21 21-11" stroke="#c8aa85" strokeWidth="2"/>
      <g stroke="#718978" opacity=".6"><path d="M-105-52v5M-131-36l5 3M-76-36l-4 3M15-52v5M-12-36l5 3M42-36l-5 3"/></g>
      <path d="M-70 11h52v16h-52z" fill="#385044"/><path d="M-62 18h35" stroke="#c0b79a" opacity=".56" strokeWidth="2"/>
    </g>
    <g transform="translate(723 826)">
      <circle r="133" fill="none" stroke="#09141c" strokeWidth="28"/>
      <path d="M-133 0a133 133 0 0 1 266 0" fill="none" stroke="#3a494b" strokeWidth="2"/>
      <path d="m-123-42 77 36 38-4 52 9 79-41-9 31-70 38-11 82h-43L-29 27l-81-38z" fill="#111f27" stroke="#293a40" strokeWidth="2"/>
      <ellipse cy="15" rx="50" ry="36" fill="#1e2d34" stroke="#3b4b4f"/>
      <path d="M-12 13h24" stroke="#78918a" strokeWidth="2" opacity=".5"/>
    </g>
    <path d="M0 787q229-78 426-40l75 103H0z" fill="#0c1820"/>
    <path d="M1369 738q143 15 231 52v60h-195z" fill="#101d25"/>
  </svg>;
}

type CabinetProps = { prefix: string; x: number; y: number; scale: number; color: string; label: string; variant: number };

function Cabinet({ prefix, x, y, scale, color, label, variant }: CabinetProps) {
  const screenId = `${prefix}-screen-${variant}`;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><clipPath id={screenId}><path d="M25 41h62v57H25z"/></clipPath></defs>
    <path d="m94 0 27 15 4 94 13 18-5 10-8 96h-20l9-96-12-28V32z" fill="#19252f" stroke="#3d4650" strokeWidth="1"/>
    <path d="M12 0h82l8 32v66l12 25v14l-9 96H6l-8-95 17-27V36z" fill="#1c2733" stroke="#51525d" strokeWidth="1"/>
    <path d="M18 6h71l4 18H14z" fill={color} opacity=".13"/>
    <path d="M17 7h71l3 15H15z" fill="none" stroke={color} opacity=".55"/>
    <text x="54" y="18" textAnchor="middle" fill={color} fontSize="8" fontFamily="Arial, sans-serif" letterSpacing="2">{label}</text>
    <path d="M16 31h78v79H10z" fill="#111c28"/>
    <path d="M22 38h68v63H22z" fill="#10242c" stroke="#435861"/>
    <g clipPath={`url(#${screenId})`}>
      <path d="M25 41h62v57H25z" fill={variant % 2 ? '#1b2839' : '#172d32'}/>
      <g stroke={color} opacity=".13" strokeWidth=".5"><path d="M25 84h62M25 89h62M25 96h62M56 70 30 100M56 70l26 30M56 70v30"/></g>
      {variant % 2 ? <g fill="none" stroke={color} opacity=".58" strokeWidth=".7"><path d="m57 51 18 15-9 19H46l-8-18zM38 67h37M57 51 46 85M57 51l9 34M38 67l28 18M75 66 46 85"/><circle cx="57" cy="68" r="5"/></g> : <g fill="none" stroke={color} opacity=".56" strokeWidth=".7"><ellipse cx="56" cy="68" rx="22" ry="11" transform="rotate(-28 56 68)"/><circle cx="56" cy="68" r="12"/><path d="M51 58q13 2 10 19"/></g>}
      <g className="arcade-screen-drift" fill={color} opacity=".73"><rect x="33" y="52" width="1.5" height="1.5"/><rect x="73" y="79" width="2" height="2"/><rect x="43" y="75" width="1" height="1"/><circle cx="69" cy="56" r="1"/></g>
      <path d="m25 42 62 3v6l-62-4z" fill="#adbec9" opacity=".035"/>
    </g>
    <path d="M14 110h88l12 18H-2z" fill="#34404a" stroke="#505462" strokeWidth=".7"/>
    <path d="M-2 129h116v7H-2z" fill={color} opacity=".35"/>
    <path d="M34 111v8" stroke="#111b24" strokeWidth="3"/><circle cx="34" cy="111" r="4" fill="#71667a"/>
    <ellipse cx="76" cy="120" rx="4" ry="2" fill={color} opacity=".7"/><ellipse cx="89" cy="118" rx="4" ry="2" fill="#a58a7e" opacity=".62"/>
    <path d="M9 142h94l-8 81H16z" fill="#17222c"/>
    <path d="M16 149h79" stroke={color} opacity=".16"/>
    <path d="M49 159h23v34H49z" fill="#101b24" stroke="#48515a" strokeWidth=".7"/>
    <path d="M54 165h12v3H54z" fill="#869087" opacity=".5"/><path d="M55 180h11v7H55z" fill="#2b3942"/>
    <path d="M24 208h61M23 212h61M23 216h60" stroke="#33424a"/>
    <path d="M12 2 5 28l-4 77-12 27 14 103" fill="none" stroke={color} strokeWidth="1.2" opacity=".54"/>
    <path d="m119 24 1 76 12 27-9 96" fill="none" stroke={color} opacity=".15"/>
  </g>;
}

export function ArcadeArt({ miniature = false }: SceneArtProps) {
  const prefix = miniature ? 'mini-arcade' : 'arcade';
  return <svg viewBox="0 0 1600 850" preserveAspectRatio="xMidYMid slice" className="scene-svg arcade-art" aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-back`} x2="0" y2="1"><stop stopColor="#242536"/><stop offset="1" stopColor="#263641"/></linearGradient>
      <linearGradient id={`${prefix}-side`} x2="1" y2=".4"><stop stopColor="#292c40"/><stop offset="1" stopColor="#121f2b"/></linearGradient>
      <linearGradient id={`${prefix}-floor`} x2=".2" y2="1"><stop stopColor="#293039"/><stop offset="1" stopColor="#0e1e28"/></linearGradient>
      <linearGradient id={`${prefix}-reflection`} x2="0" y2="1"><stop stopColor="#709794" stopOpacity=".15"/><stop offset=".6" stopColor="#709794" stopOpacity=".035"/><stop offset="1" stopColor="#709794" stopOpacity="0"/></linearGradient>
      <linearGradient id={`${prefix}-violet-reflection`} x2="0" y2="1"><stop stopColor="#93809f" stopOpacity=".15"/><stop offset="1" stopColor="#93809f" stopOpacity="0"/></linearGradient>
      <radialGradient id={`${prefix}-ceiling-glow`}><stop stopColor="#918398" stopOpacity=".14"/><stop offset="1" stopColor="#918398" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${prefix}-screen-glow`}><stop stopColor="#729995" stopOpacity=".09"/><stop offset="1" stopColor="#729995" stopOpacity="0"/></radialGradient>
      <clipPath id={`${prefix}-floor-clip`}><path d="M0 623 703 508h582l315 145v197H0z"/></clipPath>
    </defs>
    <path fill="#141d2a" d="M0 0h1600v850H0z"/>
    <path d="M618 156h676v366H618z" fill={`url(#${prefix}-back)`}/>
    <path d="m1294 156 306-97v611l-306-148z" fill={`url(#${prefix}-side)`}/>
    <path d="M0 0h1600v64l-306 98H618L0 298z" fill="#171f2c"/>
    <path d="m0 0 663 157h629L1570 0z" fill="#1e2433"/>
    <path d="m0 625 700-116h587l313 144v197H0z" fill={`url(#${prefix}-floor)`}/>
    <ellipse cx="1130" cy="283" rx="350" ry="222" fill={`url(#${prefix}-ceiling-glow)`}/>
    <path d="M0 300 623 156v367L0 646z" fill="#192532"/>
    <g fill="none" stroke="#43515c" opacity=".26"><path d="M625 242h668M625 334h668M625 426h668M705 161v345M879 161v345M1062 161v345M1238 161v345"/><path d="m1294 251 306-23M1294 347l306 48M1294 443l306 109M1403 122v453M1521 85v547"/></g>
    <path d="M620 161h676l304-98" fill="none" stroke="#9e82ad" strokeWidth="10" opacity=".035"/>
    <path d="M620 161h676l304-98" fill="none" stroke="#9e82ad" strokeWidth="3" opacity=".6"/>
    <path d="M634 174h647l319-93" fill="none" stroke="#62546e" strokeWidth="2" opacity=".4"/>
    <path d="M0 274 622 132h675L1535 0" fill="none" stroke="#0e1724" strokeWidth="22"/>
    <path d="m573 0 293 157M1090 0l80 157" stroke="#0f1927" strokeWidth="17"/>
    <path d="m604 0 270 153M1106 0l76 153" stroke="#394151" strokeWidth="1.5" opacity=".5"/>
    <g transform="translate(982 203)"><path d="M-93-10H90v52H-93z" fill="#1b2634" stroke="#47505b"/><path d="M-86-3H83v38H-86z" fill="none" stroke="#968285" strokeWidth=".6" opacity=".4"/><text x="0" y="22" textAnchor="middle" fill="#b29b95" fontSize="17" fontFamily="Arial, sans-serif" letterSpacing="6" opacity=".86">AFTER HOURS</text><path d="M-77 28h13M65 28h10" stroke="#8b9795" opacity=".46"/></g>
    <g transform="translate(721 296)"><path d="M0 0h105v219H0z" fill="#13232d" stroke="#47545e" strokeWidth="2"/><path d="M10 11h85v186H10z" fill="#1d2e37" stroke="#354a52"/><path d="M16 16h72v78H16z" fill="#283e48"/><path d="m20 90 63-69" stroke="#a4bdc2" strokeWidth="1" opacity=".08"/><path d="M16 104h72v2H16z" fill="#566369"/><path d="M18 207h69" stroke="#52666b" opacity=".5"/><path d="M79 119v17" stroke="#8d9a92" strokeWidth="3"/><path d="M31-24h48v13H31z" fill="#456058"/><path d="M42-19h25M44-15h20" stroke="#b4c2a5" opacity=".55"/></g>
    <g transform="translate(532 330)"><path d="M0 0h82l9 186H-4z" fill="#192933" stroke="#34444e"/><path d="M9 10h63v106H9z" fill="#2b3b45"/><path d="M15 17h52v84H15z" fill="#40524e" opacity=".48"/><path d="M25 30h32M25 44h25M25 58h32M25 72h20" stroke="#929384" strokeWidth="2" opacity=".43"/><path d="M9 131h63v24H9z" fill="#0e1e28"/><path d="M62 120h8" stroke="#98a08c"/><path d="M11 170h58M11 174h58" stroke="#3f5055"/></g>
    <g clipPath={`url(#${prefix}-floor-clip)`}>
      <g stroke="#667080" fill="none" strokeWidth="1" opacity=".16"><path d="M927 487-261 850M969 487 151 850M1011 487 549 850M1053 487l-80 363M1095 487l302 363M1137 487l711 363M1179 487l1058 363"/><path d="M0 547h1600M0 579h1600M0 624h1600M0 687h1600M0 776h1600"/></g>
      <path d="m853 454 91 14-42 263-230-34z" fill={`url(#${prefix}-reflection)`}/>
      <path d="m1003 513 147 1 24 336H860z" fill={`url(#${prefix}-violet-reflection)`}/>
      <path d="m1189 612 189-3 201 241h-419z" fill={`url(#${prefix}-reflection)`}/>
      <path d="m1421 736 179 1v113h-198z" fill={`url(#${prefix}-violet-reflection)`}/>
      <g fill="none" stroke="#8899a2" strokeWidth="2" opacity=".08"><path d="m904 487-12 67m-14 8-15 90m-12 22-11 79M1051 548l-6 39m-1 6-9 100m-1 14-5 67M1304 653l10 57m3 11 15 64M1484 809l10 36"/></g>
      <path d="M548 630 690 601l-19 21-165 39z" fill="#a0a48a" opacity=".025"/>
    </g>
    <path d="M629 508h661l310 146" fill="none" stroke="#566777" strokeWidth="5" opacity=".4"/>
    <ellipse cx="1210" cy="498" rx="350" ry="232" fill={`url(#${prefix}-screen-glow)`}/>
    <Cabinet prefix={prefix} x={856} y={289} scale={.78} color="#749c96" label="ORBIT" variant={0}/>
    <Cabinet prefix={prefix} x={1005} y={296} scale={1.1} color="#a28aa7" label="VECTOR" variant={1}/>
    <Cabinet prefix={prefix} x={1185} y={310} scale={1.55} color="#79a4a3" label="DRIFT" variant={2}/>
    <Cabinet prefix={prefix} x={1414} y={341} scale={2.14} color="#a38b9f" label="ECHO" variant={3}/>
    <g transform="translate(1048 643)"><ellipse cx="0" cy="44" rx="32" ry="8" fill="#0a1722" opacity=".5"/><path d="M-13-9-22 40M13-9l22 49M0-7v52" stroke="#4e5b62" strokeWidth="4"/><path d="M-16 16h39" stroke="#404d57" strokeWidth="3"/><ellipse rx="32" ry="10" cy="-13" fill="#544c58"/><path d="M-32-13v7q30 13 64 0v-7" fill="#302f3c"/><ellipse rx="32" ry="9" cy="-14" fill="#655664" stroke="#8c7588" strokeWidth="1"/></g>
    <g transform="translate(675 524)"><path d="M0 0h38l-3 58H5z" fill="#202f37" stroke="#45575a"/><ellipse cx="19" cy="0" rx="19" ry="5" fill="#435255"/><ellipse cx="19" cy="0" rx="14" ry="3" fill="#13252e"/><path d="M7 14h24M8 27h22M9 40h20" stroke="#405357" opacity=".3"/></g>
    <path d="M0 0h473v850H0z" fill="#101c28" opacity=".71"/>
    <path d="M437 0h57v652l-25 198h-32z" fill="#101b28"/><path d="M490 0h8v636l-25 214h-4l21-223z" fill="#3d4557" opacity=".65"/>
    <path d="m0 755 438-111 35 22L0 802z" fill="#172732"/>
    <path d="m0 761 438-110" stroke="#56616e" opacity=".2"/>
  </svg>;
}
