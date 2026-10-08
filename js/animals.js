// animals.js — the toy animals (and the rabbit). Used in activity pictures and as each child's dancing mascot.
//
// Each one is drawn four times larger than its sprite box and scaled down, so the numbers stay whole.
// The moving parts are wrapped in groups (an-head, an-tail, an-l1, an-l2, an-earL, an-earR, an-eyes,
// an-wing, an-trunk) with the point they turn about. In an activity picture they do nothing.
// css/app.css moves them when the animal is dancing (look for "dancing parts").
// Our own drawings of generic toys: do not copy a product's artwork.

const K = 0.25;
const EYE = '#2A2530';

const st = (fill, line, w = 4.5) => `fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const ln = (line, w = 4.5) => `fill="none" stroke="${line}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const part = (cls, ox, oy, s) => `<g class="an-${cls}" style="transform-origin:${ox}px ${oy}px">${s}</g>`;
const make = (w, h, kind, s) => ({ w, h, svg: `<g class="an an-${kind}" transform="scale(${K})">${s}</g>` });

// A leg that turns about its top. `foot` is the hoof or paw colour.
function leg(cls, x, y, w, h, fill, line, foot, fh = 12, extra = '') {
  const r = Math.min(7, w / 2.6);
  const shape = `M${x} ${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}Z`;
  const hoof = `M${x} ${y + h - fh}H${x + w}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}Z`;
  return part(cls, x + w / 2, y + 6, `<path d="${shape}" fill="${fill}"/>` + (foot ? `<path d="${hoof}" fill="${foot}"/>` : '') + `<path d="${shape}" ${ln(line)}/>` + extra);
}
// Four legs: the far pair is darker and sits a little to the right. Diagonal pairs step together.
// `toes(x)` draws nails or toes on the two near legs.
const legs = (x1, x2, off, y, w, h, fill, far, line, foot, fh, toes = () => '') =>
  leg('l2', x1 + off, y, w, h, far, line, foot, fh) + leg('l1', x2 + off, y, w, h, far, line, foot, fh) + leg('l1', x1, y, w, h, fill, line, foot, fh, toes(x1)) + leg('l2', x2, y, w, h, fill, line, foot, fh, toes(x2));

// Two friendly eyes that can blink. `white` adds the white of the eye, for dark faces.
function eyes(x1, x2, y, r = 5.4, white = false) {
  const one = (x) =>
    (white ? `<circle cx="${x}" cy="${y}" r="${r + 2.6}" fill="#fff"/>` : '') +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${EYE}"/><circle cx="${x + r * 0.36}" cy="${y - r * 0.4}" r="${(r * 0.36).toFixed(1)}" fill="#fff"/>`;
  return part('eyes', (x1 + x2) / 2, y, one(x1) + one(x2));
}
const cheeks = (x1, x2, y, c = '#F27E9B') => [x1, x2].map((x) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="${c}" opacity=".5"/>`).join('');
const smile = (x, y, w, line, d = 6) => `<path d="M${x - w} ${y}Q${x} ${y + d} ${x + w} ${y}" ${ln(line, 3.4)}/>`;

export const ANIMAL = {
  cow: () => {
    const F = '#FCFAF4', L = '#4B4350', P = '#3D3742', M = '#F8BCC8', far = '#E3DCCF', horn = '#EBD9AE';
    return make(58, 46, 'cow',
      part('tail', 26, 70, `<path d="M26 70Q6 82 13 122" ${ln(L)}/><path d="M13 116q-10 12-3 26 11-9 9-24z" ${st(P, L, 3.5)}/>`) +
        legs(30, 114, 20, 112, 20, 68, F, far, L, L, 13) +
        `<ellipse cx="94" cy="136" rx="15" ry="10" ${st(M, L)}/>` +
        `<rect x="20" y="50" width="144" height="86" rx="42" fill="${F}"/>` +
        `<path d="M54 53Q40 78 62 87 90 92 97 71 99 58 92 52Z" fill="${P}"/><path d="M112 100Q102 118 120 126 142 128 144 112 142 98 128 96Z" fill="${P}"/>` +
        `<rect x="20" y="50" width="144" height="86" rx="42" ${ln(L)}/>` +
        part('head', 172, 96,
          `<path d="M162 38Q146 32 147 13 160 17 170 31Z" ${st(horn, '#8F7A4C', 3.5)}/><path d="M194 38Q210 32 209 13 196 17 186 31Z" ${st(horn, '#8F7A4C', 3.5)}/>` +
            part('earL', 152, 60, `<path d="M152 54Q130 48 122 64 136 78 154 68Z" ${st(P, L)}/>`) +
            part('earR', 204, 60, `<path d="M204 54Q226 48 232 64 220 78 202 68Z" ${st(F, L)}/><path d="M208 59Q219 56 224 63 216 70 208 66Z" fill="${M}"/>`) +
            `<ellipse cx="178" cy="60" rx="34" ry="32" ${st(F, L)}/>` +
            `<path d="M149 48Q154 31 172 29 180 44 172 58 160 68 148 62 145 55 149 48Z" fill="${P}"/>` +
            `<ellipse cx="178" cy="60" rx="34" ry="32" ${ln(L)}/>` +
            `<path d="M168 30q3-9 10-3 7-6 10 3" ${st(F, L, 3.5)}/>` +
            `<ellipse cx="178" cy="79" rx="26" ry="16" ${st(M, L)}/>` +
            `<ellipse cx="168" cy="76" rx="3" ry="4" fill="#D9899B"/><ellipse cx="188" cy="76" rx="3" ry="4" fill="#D9899B"/>` +
            smile(178, 84, 8, '#B5627A') +
            eyes(164, 192, 52, 5.4, true) +
            `<circle cx="178" cy="103" r="7.5" ${st('#F5BE1B', '#9A6B00', 3.5)}/><path d="M172 104h12" ${ln('#9A6B00', 2.5)}/>`
        )
    );
  },

  pig: () => {
    const F = '#F9BBCC', L = '#B0547A', D = '#F094B0', T = '#C96D8E';
    return make(56, 40, 'pig',
      part('tail', 22, 76, `<path d="M22 76q-13-3-13-13 1-10 11-7 8 6-1 13" ${ln(L, 5)}/>`) +
        legs(32, 114, 20, 104, 20, 52, F, D, L, T, 12) +
        `<ellipse cx="92" cy="80" rx="74" ry="46" ${st(F, L)}/>` +
        `<ellipse cx="80" cy="56" rx="38" ry="10" fill="#fff" opacity=".28"/>` +
        part('head', 160, 108,
          part('earL', 146, 40, `<path d="M134 46Q124 12 150 20 162 30 160 42Z" ${st(D, L)}/>`) +
            part('earR', 188, 40, `<path d="M200 46Q210 12 184 20 172 30 174 42Z" ${st(D, L)}/>`) +
            `<circle cx="167" cy="68" r="40" ${st(F, L)}/>` +
            cheeks(139, 195, 80, '#EE6F93') +
            `<ellipse cx="167" cy="80" rx="20" ry="14.5" ${st(D, L)}/>` +
            `<ellipse cx="160" cy="80" rx="3.2" ry="5" fill="${L}"/><ellipse cx="174" cy="80" rx="3.2" ry="5" fill="${L}"/>` +
            smile(167, 99, 8, L, 5) +
            eyes(149, 185, 59)
        )
    );
  },

  sheep: () => {
    const W = '#FCF9F1', WL = '#B3A893', D = '#4A4553', far = '#37333E';
    const puff = (list) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${st(W, WL)}/>`).join('');
    return make(56, 42, 'sheep',
      legs(40, 120, 18, 104, 16, 60, D, far, '#2B2832', null) +
        part('tail', 30, 80, `<circle cx="20" cy="82" r="12" ${st(W, WL)}/>`) +
        puff([[44, 84, 26], [62, 56, 27], [98, 44, 30], [134, 54, 27], [150, 86, 26], [126, 108, 25], [92, 114, 25], [60, 108, 24]]) +
        `<ellipse cx="98" cy="80" rx="60" ry="38" fill="${W}"/>` +
        `<path d="M70 70q8-8 16 0M104 62q8-8 16 0M84 94q8-8 16 0M52 88q6-6 12 0M118 90q7-7 14 0" ${ln(WL, 3.2)}/>` +
        part('head', 176, 104,
          part('earL', 156, 60, `<ellipse cx="144" cy="64" rx="15" ry="7.5" transform="rotate(18 144 64)" ${st(D, '#2B2832')}/>`) +
            part('earR', 200, 60, `<ellipse cx="212" cy="64" rx="15" ry="7.5" transform="rotate(-18 212 64)" ${st(D, '#2B2832')}/>`) +
            `<ellipse cx="178" cy="70" rx="27" ry="32" ${st(D, '#2B2832')}/>` +
            puff([[162, 44, 12], [178, 37, 14], [194, 44, 12]]) + `<ellipse cx="178" cy="46" rx="16" ry="9" fill="${W}"/>` +
            `<path d="M172 83h12l-6 6z" fill="#F4A3B4"/><path d="M178 89v3M171 94q7 6 14 0" ${ln('#D9D2E0', 3)}/>` +
            eyes(167, 189, 68, 4.4, true)
        )
    );
  },

  horse: () => {
    const F = '#BC7239', L = '#5E3418', D = '#9B5A2B', H = '#4A2A14', M = '#E6B98E', hoof = '#3D2A1E';
    return make(60, 52, 'horse',
      part('tail', 30, 104, `<path d="M32 98Q4 106 8 158 10 186 24 194 20 162 38 122Z" ${st(H, '#2E180A')}/><path d="M18 126q-2 26 2 46" ${ln('#6B4022', 3)}/>`) +
        legs(36, 116, 18, 144, 18, 60, F, D, L, hoof, 13) +
        `<rect x="24" y="92" width="134" height="70" rx="34" ${st(F, L)}/>` +
        part('head', 136, 138,
          `<path d="M148 34Q122 50 114 78 110 92 108 106 122 100 128 88 136 66 152 54Z" ${st(H, '#2E180A')}/>` +
            `<path d="M112 110Q128 68 150 38L192 60Q176 96 158 128 130 140 112 110Z" ${st(F, L)}/>` +
            `<path d="M108 112Q130 96 162 120L156 140 116 138Z" fill="${F}"/>` +
            part('earL', 156, 28, `<path d="M146 34Q140 4 158 10 166 20 164 32Z" ${st(F, L)}/><path d="M152 28q-2-10 4-11 4 5 4 11z" fill="${D}"/>`) +
            part('earR', 186, 26, `<path d="M178 30Q182 0 198 12 198 22 194 32Z" ${st(F, L)}/><path d="M184 27q2-11 8-9 2 5 0 11z" fill="${D}"/>`) +
            `<ellipse cx="172" cy="52" rx="31" ry="28" ${st(F, L)}/>` +
            `<path d="M172 26q5 10 3 22-6 1-8-5-1-10 5-17z" fill="#fff" opacity=".92"/>` +
            `<ellipse cx="200" cy="76" rx="26" ry="20" transform="rotate(-14 200 76)" ${st(M, L)}/>` +
            `<path d="M152 30Q164 10 184 22 182 38 170 31 162 38 152 30Z" ${st(H, '#2E180A', 3.5)}/>` +
            `<ellipse cx="193" cy="72" rx="3.4" ry="5" fill="#9A6238"/><ellipse cx="210" cy="68" rx="3.4" ry="5" fill="#9A6238"/>` +
            `<path d="M192 86q10 6 20-3" ${ln('#8A5630', 3.4)}/>` +
            cheeks(160, 160, 66) +
            eyes(160, 186, 50)
        )
    );
  },

  duck: () => {
    const F = '#FDD441', L = '#A9790A', W = '#F5BF24', B = '#F58A1F', BL = '#A8500A';
    const foot = (cls, x) => part(cls, x, 136, `<path d="M${x} 136v16" ${ln(BL, 8)}/><path d="M${x} 136v16" ${ln(B, 4)}/><path d="M${x - 8} 146h14l12 10h-28q-6-5 2-10z" ${st(B, BL, 3.5)}/>`);
    return make(50, 40, 'duck',
      foot('l1', 82) + foot('l2', 114) +
        `<path d="M16 66Q14 140 92 144 166 146 168 104 166 82 138 86 110 98 78 94 42 90 16 66Z" ${st(F, L)}/>` +
        `<path d="M16 66q2 12 12 18" ${ln(L, 3)}/>` +
        part('wing', 122, 104, `<path d="M124 100Q98 96 60 104 76 134 104 132 128 126 124 100Z" ${st(W, L)}/><path d="M76 112q14 8 30 4M84 122q10 4 20 1" ${ln(L, 3)}/>`) +
        part('head', 142, 94,
          `<path d="M138 20q-6-16 6-15-2 7 3 11 6-12 14-5-8 4-9 12z" ${st(F, L, 3.5)}/>` +
            `<circle cx="144" cy="56" r="38" ${st(F, L)}/>` +
            cheeks(120, 176, 64, '#F58A6A') +
            `<path d="M132 70q0-9 18-9t18 9q0 10-18 10t-18-10z" ${st(B, BL, 4)}/>` +
            `<path d="M138 72q12 5 24 0" ${ln(BL, 2.6)}/>` +
            eyes(131, 165, 50)
        )
    );
  },

  elephant: () => {
    const F = '#AEBBCB', L = '#55617A', D = '#93A1B4', I = '#F4B9C6', N = '#EEF2F6';
    const nails = (x) => `<path d="M${x + 4} 195q4-7 8 0M${x + 13} 195q4-7 8 0" ${ln(N, 3)}/>`;
    return make(62, 50, 'elephant',
      part('tail', 24, 80, `<path d="M24 78Q8 94 14 122" ${ln(L)}/><path d="M14 118l-7 16 14-5z" ${st(L, L, 3)}/>`) +
        legs(34, 116, 24, 124, 30, 72, F, D, L, null, 12, nails) +
        `<rect x="20" y="40" width="154" height="110" rx="54" ${st(F, L)}/>` +
        `<ellipse cx="84" cy="62" rx="44" ry="12" fill="#fff" opacity=".2"/>` +
        part('earR', 208, 70, `<ellipse cx="220" cy="68" rx="18" ry="32" ${st(D, L)}/>`) +
        part('head', 176, 120,
          `<circle cx="186" cy="74" r="42" ${st(F, L)}/>` +
            part('earL', 158, 66, `<path d="M160 44Q118 24 110 70 110 112 150 106 164 92 160 44Z" ${st(D, L)}/><path d="M151 56Q126 46 123 73 124 96 145 94 154 84 151 56Z" fill="${I}"/>`) +
            cheeks(166, 216, 86) +
            part('trunk', 192, 90,
              `<path d="M192 90Q192 142 214 148 238 150 234 122" ${ln(L, 25)}/><path d="M192 90Q192 142 214 148 238 150 234 122" ${ln(F, 16)}/>` +
                `<path d="M185 112h14M187 126h14M194 139l12-6" ${ln(D, 3)}/>`
            ) +
            `<circle cx="192" cy="86" r="10.5" fill="${F}"/>` +
            eyes(172, 210, 68)
        )
    );
  },

  giraffe: () => {
    const F = '#F9CB4E', L = '#9C6A14', S = '#C2812B', D = '#E3B13B', M = '#FCEBC0', hoof = '#7A4E1A';
    const spots = (list) => list.map(([x, y, rx, ry, a = 0]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="${S}"/>`).join('');
    const horn = (x, lean) => `<path d="M${x} 28L${x + lean} 9" ${ln(L, 10)}/><path d="M${x} 28L${x + lean} 9" ${ln(F, 5)}/><circle cx="${x + lean}" cy="8" r="6.5" ${st(S, L, 3.5)}/>`;
    return make(56, 76, 'giraffe',
      part('tail', 30, 180, `<path d="M30 178Q14 194 18 222" ${ln(L)}/><path d="M18 216q-9 12-2 24 10-8 8-22z" ${st(S, L, 3.5)}/>`) +
        legs(40, 100, 16, 220, 15, 80, F, D, L, hoof, 12) +
        `<rect x="26" y="166" width="118" height="72" rx="34" ${st(F, L)}/>` +
        spots([[54, 190, 11, 9, -20], [82, 208, 10, 8, 10], [108, 188, 8, 7], [78, 180, 6, 5], [48, 216, 6, 5], [116, 216, 7, 5, 20]]) +
        part('head', 128, 210,
          `<path d="M140 58Q118 124 100 192" ${ln(S, 12)}/>` +
            `<path d="M102 194Q120 122 140 58L178 66Q164 132 152 214 122 228 102 194Z" ${st(F, L)}/>` +
            `<ellipse cx="126" cy="208" rx="24" ry="17" fill="${F}"/>` +
            spots([[140, 172, 9, 11, 10], [134, 134, 8, 10, 12], [152, 104, 8, 9, 12], [124, 202, 7, 6], [158, 148, 5, 6, 10]]) +
            horn(150, -3) + horn(172, 3) +
            part('earL', 138, 38, `<path d="M140 32Q118 18 110 32 120 48 140 44Z" ${st(F, L)}/><path d="M134 34q-12-5-17 0 7 7 17 5z" fill="${S}"/>`) +
            part('earR', 186, 36, `<path d="M184 30Q206 16 214 30 204 46 184 42Z" ${st(F, L)}/><path d="M190 32q12-5 17 0-7 7-17 5z" fill="${S}"/>`) +
            `<ellipse cx="162" cy="46" rx="30" ry="26" ${st(F, L)}/>` +
            `<ellipse cx="168" cy="62" rx="25" ry="16" ${st(M, L)}/>` +
            `<ellipse cx="160" cy="58" rx="2.8" ry="3.8" fill="${S}"/><ellipse cx="177" cy="58" rx="2.8" ry="3.8" fill="${S}"/>` +
            smile(168, 67, 8, L, 5) +
            eyes(148, 178, 37)
        )
    );
  },

  lion: () => {
    const F = '#F1B64E', L = '#96601A', MN = '#B5682A', ML = '#7E4315', D = '#DBA13B', M = '#FCEBC8';
    const ring = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return `<circle cx="${(178 + Math.cos(a) * 38).toFixed(1)}" cy="${(72 + Math.sin(a) * 38).toFixed(1)}" r="15" ${st(MN, ML)}/>`;
    }).join('');
    const toes = (x) => `<path d="M${x + 7} 166v5M${x + 13} 166v5" ${ln(L, 2.6)}/>`;
    return make(60, 44, 'lion',
      part('tail', 24, 94, `<path d="M26 94Q2 88 8 52" ${ln(L, 10.5)}/><path d="M26 94Q2 88 8 52" ${ln(F, 5.5)}/><path d="M8 58Q-4 44 6 28 20 42 8 58Z" ${st(MN, ML, 3.5)}/>`) +
        legs(32, 112, 20, 112, 20, 60, F, D, L, null, 12, toes) +
        `<rect x="20" y="64" width="134" height="68" rx="32" ${st(F, L)}/>` +
        `<ellipse cx="80" cy="80" rx="38" ry="9" fill="#fff" opacity=".22"/>` +
        part('head', 172, 120,
          ring + `<circle cx="178" cy="72" r="40" fill="${MN}"/>` +
            part('earL', 156, 48, `<circle cx="152" cy="44" r="11" ${st(F, L)}/><circle cx="152" cy="45" r="5" fill="#F4A9A0"/>`) +
            part('earR', 200, 48, `<circle cx="204" cy="44" r="11" ${st(F, L)}/><circle cx="204" cy="45" r="5" fill="#F4A9A0"/>`) +
            `<circle cx="178" cy="74" r="32" ${st(F, L)}/>` +
            cheeks(156, 200, 82, '#F08A6A') +
            `<ellipse cx="178" cy="89" rx="18" ry="12.5" fill="${M}"/>` +
            `<path d="M171 80h14q2 1 0 3l-7 7-7-7q-2-2 0-3z" fill="#6B3A1A"/>` +
            `<path d="M178 90v3M169 94q5 5 9-1 4 6 9 1" ${ln('#6B3A1A', 3)}/>` +
            eyes(164, 192, 68)
        )
    );
  },
};

// A plain toy rabbit (our own drawing), sitting up, for position-word games.
export function bunny() {
  const F = '#DDB98E', L = '#7A5733', I = '#F6BDC6', T = '#F8EAD3';
  return make(34, 52, 'bunny',
    `<circle cx="112" cy="172" r="12" ${st('#FBF6EC', L)}/>` +
      part('earL', 52, 64, `<ellipse cx="48" cy="38" rx="15" ry="36" transform="rotate(-7 48 38)" ${st(F, L)}/><ellipse cx="48" cy="40" rx="6.5" ry="24" transform="rotate(-7 48 40)" fill="${I}"/>`) +
      part('earR', 84, 64, `<ellipse cx="88" cy="38" rx="15" ry="36" transform="rotate(7 88 38)" ${st(F, L)}/><ellipse cx="88" cy="40" rx="6.5" ry="24" transform="rotate(7 88 40)" fill="${I}"/>`) +
      `<ellipse cx="68" cy="152" rx="50" ry="52" ${st(F, L)}/>` +
      `<ellipse cx="68" cy="160" rx="29" ry="34" fill="${T}"/>` +
      part('l1', 34, 196, `<ellipse cx="34" cy="196" rx="24" ry="10.5" ${st(F, L)}/>`) +
      part('l2', 102, 196, `<ellipse cx="102" cy="196" rx="24" ry="10.5" ${st(F, L)}/>`) +
      `<ellipse cx="50" cy="138" rx="10" ry="12" ${st(F, L)}/><ellipse cx="86" cy="138" rx="10" ry="12" ${st(F, L)}/>` +
      part('head', 68, 126,
        `<circle cx="68" cy="94" r="38" ${st(F, L)}/>` +
          cheeks(44, 92, 104) +
          `<ellipse cx="68" cy="106" rx="14" ry="9" fill="${T}"/>` +
          `<path d="M62 99h12l-6 7z" fill="#E77F96"/>` +
          `<path d="M68 106v4M61 112q4 4 7-2 3 6 7 2" ${ln(L, 3)}/>` +
          `<path d="M40 100l-14-3M40 108l-13 3M96 100l14-3M96 108l13 3" ${ln(L, 2.2)}/>` +
          eyes(54, 82, 90)
      )
  );
}
