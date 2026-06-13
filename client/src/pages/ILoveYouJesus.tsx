import { useEffect, useRef } from 'react';

const MOVE = 1000;
const BOOM = 200;
const DELTA = 150;
const CYCLE = 4300;
const STAGE_W = 720;
const STAGE_H = 200;

const easing = 'sin.inOut';
const easingBoom = 'sin.in';
const easingOut = 'sin.out';

const COL_BG = '#FFC568';
const COL_LTTR = '#763C8C';
const COL_LINE = '#FFFFFF';

function svgScene(): string {
  return `<svg style="position:absolute;inset:0;z-index:2;width:${STAGE_W}px;height:${STAGE_H}px;" viewBox="0 0 ${STAGE_W} ${STAGE_H}">
    <line class="line line--left" x1="10" y1="17" x2="10" y2="183" stroke="${COL_LINE}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <line class="line line--rght" x1="710" y1="17" x2="710" y2="183" stroke="${COL_LINE}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <g fill="${COL_LTTR}" transform="translate(116,0)">
      <path class="lttr lttr--I" d="M42.2,73.9h11.4v52.1H42.2V73.9z"/>
      <path class="lttr lttr--L" d="M85.1,73.9h11.4v42.1h22.8v10H85.1V73.9z"/>
      <path class="lttr lttr--O" d="M123.9,100c0-15.2,11.7-26.9,27.2-26.9s27.2,11.7,27.2,26.9s-11.7,26.9-27.2,26.9S123.9,115.2,123.9,100zM166.9,100c0-9.2-6.8-16.5-15.8-16.5c-9,0-15.8,7.3-15.8,16.5s6.8,16.5,15.8,16.5C160.1,116.5,166.9,109.2,166.9,100z"/>
      <path class="lttr lttr--V" d="M180.7,73.9H193l8.4,22.9c1.7,4.7,3.5,9.5,5,14.2h0.1c1.7-4.8,3.4-9.4,5.2-14.3l8.6-22.8h11.7l-19.9,52.1h-11.5L180.7,73.9z"/>
      <path class="lttr lttr--E" d="M239.1,73.9h32.2v10h-20.7v10.2h17.9v9.5h-17.9v12.4H272v10h-33V73.9z"/>
      <path class="lttr lttr--Y" d="M315.8,102.5l-20.1-28.6H309l6.3,9.4c2,3,4.2,6.4,6.3,9.6h0.1c2-3.2,4.1-6.4,6.3-9.6l6.3-9.4h12.9l-19.9,28.5v23.6h-11.4V102.5z"/>
      <path class="lttr lttr--O2" d="M348.8,100c0-15.2,11.7-26.9,27.2-26.9c15.5,0,27.2,11.7,27.2,26.9s-11.7,26.9-27.2,26.9C360.5,126.9,348.8,115.2,348.8,100z M391.8,100c0-9.2-6.8-16.5-15.8-16.5c-9,0-15.8,7.3-15.8,16.5s6.8,16.5,15.8,16.5C385,116.5,391.8,109.2,391.8,100z"/>
      <path class="lttr lttr--U" d="M412.4,101.1V73.9h11.4v26.7c0,10.9,2.4,15.9,11.5,15.9c8.4,0,11.4-4.6,11.4-15.8V73.9h11v26.9c0,7.8-1.1,13.5-4,17.7c-3.7,5.3-10.4,8.4-18.7,8.4c-8.4,0-15.1-3.1-18.8-8.5C413.4,114.2,412.4,108.5,412.4,101.1z"/>
    </g>
    <g class="jesus-group" fill="${COL_LTTR}" font-family="'Helvetica Neue',Helvetica,Arial,sans-serif" font-weight="900" font-size="68">
      <text x="240" y="122">J</text>
      <text x="290" y="122">E</text>
      <text x="340" y="122">S</text>
      <text x="390" y="122">U</text>
      <text x="440" y="122">S</text>
    </g>
  </svg>`;
}

const STAGE_SCALE_KEY = '--stage-scale';

export default function ILoveYouJesus() {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animationRefs = useRef<any[]>([]);
  const loopTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const updateScale = () => {
      const pad = 40;
      const sx = (window.innerWidth - pad) / STAGE_W;
      const sy = (window.innerHeight - pad) / STAGE_H;
      const s = Math.min(1, sx, sy);
      document.documentElement.style.setProperty(STAGE_SCALE_KEY, String(s));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !(window as any).mojs) return;

    const m = (window as any).mojs;
    const easingHeart = m.easing?.path?.('M0,100C2.9,86.7,33.6-7.3,46-7.3s15.2,22.7,26,22.7S89,0,100,0') || 'sin.inOut';

    const stage = document.createElement('div');
    stage.style.cssText = `width:${STAGE_W}px;height:${STAGE_H}px;position:relative;flex-shrink:0;`;
    root.appendChild(stage);

    const sceneEl = document.createElement('div');
    sceneEl.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none;';
    sceneEl.innerHTML = svgScene();
    stage.appendChild(sceneEl);

    const moContainer = document.createElement('div');
    moContainer.style.cssText = 'width:100%;height:100%;position:relative;';
    stage.appendChild(moContainer);

    const heartElem = document.createElement('div');
    heartElem.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    moContainer.appendChild(heartElem);

    const qs = (sel: string) => sceneEl.querySelector(sel) as HTMLElement | null;
    const el = {
      container: moContainer,
      i: qs('.lttr--I'),
      l: qs('.lttr--L'),
      o: qs('.lttr--O'),
      v: qs('.lttr--V'),
      e: qs('.lttr--E'),
      y: qs('.lttr--Y'),
      o2: qs('.lttr--O2'),
      u: qs('.lttr--U'),
      jesusGroup: qs('.jesus-group'),
      lineLeft: qs('.line--left'),
      lineRight: qs('.line--rght'),
    };

    class Heart extends m.CustomShape {
      getShape() {
        return '<path d="M50,88.9C25.5,78.2,0.5,54.4,3.8,31.1S41.3,1.8,50,29.9c8.7-28.2,42.8-22.2,46.2,1.2S74.5,78.2,50,88.9z"/>';
      }
      getLength() { return 200; }
    }
    m.addShape('heart', Heart);

    const heartShape = new m.Shape({
      parent: heartElem,
      shape: 'heart',
      fill: '#fa4843',
      x: 0,
      y: 0,
      scale: 1,
      radius: 40,
      isShowStart: true,
    });
    animationRefs.current.push(heartShape);
    heartElem.style.transform = 'scale(0)';

    const crtBoom = (delay: number, x = 0, rd = 46) => {
      const t = setTimeout(() => {
        const crcl = new m.Shape({
          shape: 'circle',
          fill: 'none',
          stroke: COL_LTTR,
          strokeWidth: { 5: 0 },
          radius: { [rd]: [rd + 20] },
          easing: 'quint.out',
          duration: 500 / 3,
          parent: el.container,
          delay: 0,
          x,
        });
        crcl.play();
        animationRefs.current.push(crcl);

        const brst = new m.Burst({
          radius: { [rd + 15]: 110 },
          angle: 'rand(60, 180)',
          count: 3,
          timeline: { delay: 0 },
          parent: el.container,
          x,
          children: {
            radius: [5, 3, 7],
            fill: COL_LTTR,
            scale: { 1: 0, easing: 'quad.in' },
            pathScale: [0.8, null],
            degreeShift: ['rand(13, 60)', null],
            duration: 1000 / 3,
            easing: 'quint.out',
          },
        });
        brst.play();
        animationRefs.current.push(brst);
      }, delay);
      timeoutsRef.current.push(t);
    };

    interface Seg {
      delay: number;
      duration: number;
      from?: number;
      to?: number;
      fromScale?: number;
      toScale?: number;
      easingSeg?: string;
    }

    function createTweens(elem: HTMLElement | null, segments: Seg[]): any[] {
      if (!elem) return [];
      const current = { x: 0, scale: 1 };

      return segments.map(seg => {
        const fromX = seg.from ?? current.x;
        const fromScale = seg.fromScale ?? current.scale;
        const toX = seg.to ?? current.x;
        const toScale = seg.toScale ?? current.scale;

        return new m.Tween({
          duration: seg.duration,
          delay: seg.delay,
          easing: seg.easingSeg || easing,
          onStart: () => {
            elem.style.transform = `translateX(${fromX}px) scale(${fromScale})`;
          },
          onUpdate: (p: number) => {
            const x = fromX + (toX - fromX) * p;
            const s = fromScale + (toScale - fromScale) * p;
            elem.style.transform = `translateX(${x}px) scale(${s})`;
          },
          onComplete: () => {
            current.x = toX;
            current.scale = toScale;
          },
        });
      });
    }

    const loveLetters = [el.i, el.l, el.o, el.v, el.e, el.y, el.o2, el.u] as (HTMLElement | null)[];
    const jesusGroup = el.jesusGroup;

    const tl = new m.Timeline();
    const allTweens: any[] = [];

    const addTweens = (tweens: any[]) => {
      tweens.forEach(t => { if (t) allTweens.push(t); });
    };

    addTweens(createTweens(el.lineLeft, [
      { delay: 0, duration: MOVE, from: 0, to: 52 },
      { delay: MOVE, duration: BOOM + MOVE, from: 52, to: 106, easingSeg: easing },
      { delay: MOVE * 2 + BOOM, duration: BOOM + MOVE, from: 106, to: 166, easingSeg: easing },
      { delay: MOVE * 3 + BOOM * 2, duration: 150, from: 166, to: 176, easingSeg: easing },
      { delay: MOVE * 3 + BOOM * 2 + 150, duration: 300, from: 176, to: 176 },
      { delay: MOVE * 3 + BOOM * 2 + 450, duration: 350, from: 176, to: 0, easingSeg: easingOut },
    ]));

    addTweens(createTweens(el.lineRight, [
      { delay: 0, duration: MOVE, from: 0, to: -52 },
      { delay: MOVE, duration: BOOM + MOVE, from: -52, to: -106, easingSeg: easing },
      { delay: MOVE * 2 + BOOM, duration: BOOM + MOVE, from: -106, to: -166, easingSeg: easing },
      { delay: MOVE * 3 + BOOM * 2, duration: 150, from: -166, to: -176, easingSeg: easing },
      { delay: MOVE * 3 + BOOM * 2 + 150, duration: 300, from: -176, to: -176 },
      { delay: MOVE * 3 + BOOM * 2 + 450, duration: 350, from: -176, to: 0, easingSeg: easingOut },
    ]));

    addTweens(createTweens(el.i, [
      { delay: 0, duration: MOVE, from: 34, to: 34 },
      { delay: MOVE, duration: BOOM, from: 34, to: 53, easingSeg: easingBoom },
      { delay: MOVE + BOOM, duration: MOVE, from: 53, to: 93, easingSeg: easing },
      { delay: MOVE * 2 + BOOM, duration: BOOM, from: 93, to: 123, easingSeg: easingBoom },
      { delay: MOVE * 2 + BOOM * 2, duration: MOVE, from: 123, to: 153, easingSeg: easing },
    ]));

    addTweens(createTweens(el.l, [{ delay: 0, duration: MOVE, from: 15, to: 15 }]));
    addTweens(createTweens(el.o, [{ delay: 0, duration: MOVE, from: 11, to: 11 }]));
    addTweens(createTweens(el.v, [{ delay: 0, duration: MOVE, from: 3, to: 3 }]));
    addTweens(createTweens(el.e, [{ delay: 0, duration: MOVE, from: -3, to: -3 }]));

    addTweens(createTweens(el.y, [
      { delay: 0, duration: MOVE, from: -20, to: -20 },
      { delay: MOVE, duration: BOOM, from: -20, to: -53, easingSeg: easingBoom },
      { delay: MOVE + BOOM, duration: MOVE, from: -53, to: -77, easingSeg: easing },
    ]));

    addTweens(createTweens(el.o2, [
      { delay: 0, duration: MOVE, from: -27, to: -27 },
      { delay: MOVE, duration: BOOM, from: -27, to: -54, easingSeg: easingBoom },
      { delay: MOVE + BOOM, duration: MOVE, from: -54, to: -84, easingSeg: easing },
    ]));

    addTweens(createTweens(el.u, [
      { delay: 0, duration: MOVE, from: -32, to: -32 },
      { delay: MOVE, duration: BOOM, from: -32, to: -53, easingSeg: easingBoom },
      { delay: MOVE + BOOM, duration: MOVE, from: -53, to: -89, easingSeg: easing },
      { delay: MOVE * 2 + BOOM, duration: BOOM, from: -89, to: -120, easingSeg: easingBoom },
      { delay: MOVE * 2 + BOOM * 2, duration: MOVE, from: -120, to: -147, easingSeg: easing },
    ]));

    // JESUS group — appears after I LOVE YOU fades out
    if (jesusGroup) jesusGroup.style.opacity = '0';
    {
      const tw = new m.Tween({
        duration: 400,
        delay: MOVE * 3 + BOOM * 2,
        easing: easingOut,
        onUpdate: (p: number) => { if (jesusGroup) jesusGroup.style.opacity = String(p); },
        onStart: () => { if (jesusGroup) jesusGroup.style.opacity = '0'; },
        onComplete: () => { if (jesusGroup) jesusGroup.style.opacity = '1'; },
      });
      allTweens.push(tw);
    }

    // Heart segments
    const heartSegs: Seg[] = [
      { delay: MOVE, duration: 500, from: -64, to: -64, fromScale: 0.001, toScale: 0.95, easingSeg: easingHeart },
      { delay: MOVE + 500, duration: BOOM + MOVE - 500, from: -64, to: -62, fromScale: 0.95, toScale: 0.65, easingSeg: easing },
      { delay: MOVE * 2 + BOOM, duration: BOOM - 50, from: -62, to: -14, fromScale: 0.65, toScale: 0.90, easingSeg: easingBoom },
      { delay: MOVE * 2 + BOOM * 2 - 50, duration: 125, from: -14, to: -14, fromScale: 0.90, toScale: 0.80, easingSeg: easingOut },
      { delay: MOVE * 2 + BOOM * 2 + 75, duration: 125, from: -14, to: -14, fromScale: 0.80, toScale: 0.85, easingSeg: easingOut },
      { delay: MOVE * 2 + BOOM * 2 + 200, duration: MOVE - 200, from: -14, to: -14, fromScale: 0.85, toScale: 0.45, easingSeg: easing },
      { delay: MOVE * 3 + BOOM * 2, duration: 150, from: -14, to: 0, fromScale: 0.45, toScale: 0.90, easingSeg: easingBoom },
      { delay: MOVE * 3 + BOOM * 2 + 150, duration: 125, from: 0, to: 0, fromScale: 0.90, toScale: 0.80, easingSeg: easingOut },
      { delay: MOVE * 3 + BOOM * 2 + 275, duration: 125, from: 0, to: 0, fromScale: 0.80, toScale: 0.85, easingSeg: easingOut },
      { delay: MOVE * 3 + BOOM * 2 + 400, duration: 125, from: 0, to: 0, fromScale: 0.85, toScale: 0.85 },
      { delay: MOVE * 3 + BOOM * 2 + 525, duration: 350, from: 0, to: 0, fromScale: 0.85, toScale: 0.001, easingSeg: easingOut },
    ];

    let hX = 0, hScale = 1;
    for (const seg of heartSegs) {
      const fromX = seg.from ?? hX;
      const fromScale = seg.fromScale ?? hScale;
      const toX = seg.to ?? hX;
      const toScale = seg.toScale ?? hScale;

      const ht = new m.Tween({
        duration: seg.duration,
        delay: seg.delay,
        easing: seg.easingSeg || easing,
        onStart: () => {
          heartElem.style.transform = `translateX(${fromX}px) scale(${fromScale})`;
        },
        onUpdate: (p: number) => {
          const x = fromX + (toX - fromX) * p;
          const s = fromScale + (toScale - fromScale) * p;
          heartElem.style.transform = `translateX(${x}px) scale(${s})`;
        },
        onComplete: () => {
          hX = toX;
          hScale = toScale;
        },
      });
      allTweens.push(ht);
    }

    // Reset at end of cycle
    const resetTween = new m.Tween({
      duration: 50,
      delay: MOVE * 3 + BOOM * 2 + DELTA + 600,
      onUpdate: (p: number) => {
        loveLetters.forEach(letter => {
          if (letter) letter.style.opacity = String(1 * p);
        });
      },
      onStart: () => {
        loveLetters.forEach(letter => {
          if (letter) {
            letter.style.transform = 'translateX(0px) scale(1)';
            letter.style.opacity = '0';
          }
        });
        if (jesusGroup) jesusGroup.style.opacity = '0';
      },
      onComplete: () => {
        loveLetters.forEach(letter => {
          if (letter) { letter.style.opacity = '1'; letter.style.transform = 'translateX(0px) scale(1)'; }
        });
        el.container.style.transform = '';
      },
    });
    allTweens.push(resetTween);

    // Letter fade-outs
    const fadeOut = (els: (HTMLElement | null)[], delay: number) => {
      els.forEach(letter => {
        if (!letter) return;
        const tw = new m.Tween({
          duration: 50,
          delay,
          onUpdate: (p: number) => { letter.style.opacity = String(1 - p); },
          onComplete: () => { letter.style.opacity = '0'; },
        });
        allTweens.push(tw);
      });
    };

    fadeOut([el.l, el.o, el.v, el.e], MOVE);
    fadeOut([el.y, el.o2], MOVE * 2 + BOOM);
    fadeOut([el.i], MOVE * 3 + BOOM * 2 - DELTA);
    fadeOut([el.u], MOVE * 3 + BOOM * 2);

    allTweens.forEach(t => tl.add(t));

    crtBoom(MOVE, -64, 46);
    crtBoom(MOVE * 2 + BOOM, 18, 34);
    crtBoom(MOVE * 3 + BOOM * 2 - DELTA, -64, 34);
    crtBoom(MOVE * 3 + BOOM * 2, 45, 34);

    const startLoop = () => {
      tl.play();
      loopTimerRef.current = setInterval(() => {
        clearTimeouts();
        tl.replay();
        crtBoom(MOVE, -64, 46);
        crtBoom(MOVE * 2 + BOOM, 18, 34);
        crtBoom(MOVE * 3 + BOOM * 2 - DELTA, -64, 34);
        crtBoom(MOVE * 3 + BOOM * 2, 45, 34);
      }, CYCLE);
    };

    startLoop();

    return () => {
      clearInterval(loopTimerRef.current);
      clearTimeouts();
      animationRefs.current.forEach(anim => {
        if (anim && typeof anim.destroy === 'function') anim.destroy();
      });
      animationRefs.current = [];
      root.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={outerRef}
      style={{
        width: '100%',
        minHeight: '100dvh',
        background: COL_BG,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: `${STAGE_W}px`,
          height: `${STAGE_H}px`,
          position: 'relative',
          flexShrink: 0,
          transform: `scale(var(${STAGE_SCALE_KEY}))`,
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
}
