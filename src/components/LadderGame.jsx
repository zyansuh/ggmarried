import { useEffect, useRef, useState, useCallback } from 'react';
import css from './LadderGame.module.css';

/* ═══════════════════════════════════════════
   상수
═══════════════════════════════════════════ */
const ROW_H   = 56;
const ROWS    = 8;
const PAD_TOP = 64;
const PAD_BOT = 64;

/** 화면 너비에 따라 열 너비·패딩 동적 결정 */
function getColMetrics() {
  const w = window.innerWidth;
  if (w <= 360) return { COL_W: 62, PAD_X: 28 };
  if (w <= 480) return { COL_W: 72, PAD_X: 32 };
  if (w <= 640) return { COL_W: 80, PAD_X: 38 };
  return { COL_W: 90, PAD_X: 50 };
}

const PATH_COLORS = [
  '#F9A8C9',  // 로즈
  '#93C5FD',  // 스카이
  '#C4B5FD',  // 라벤더
  '#6EE7B7',  // 민트
  '#FCD34D',  // 옐로우
  '#FCA5A5',  // 피치
  '#67E8F9',  // 시안
  '#A5B4FC',  // 인디고
  '#86EFAC',  // 그린
  '#FED7AA',  // 피치오렌지
];

/* ═══════════════════════════════════════════
   순수 로직 함수
═══════════════════════════════════════════ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBridges(cols) {
  const bridges = [];
  for (let r = 0; r < ROWS; r++) {
    const used = new Set();
    for (let c = 0; c < cols - 1; c++) {
      if (!used.has(c) && !used.has(c + 1) && Math.random() > 0.42) {
        bridges.push({ r, c });
        used.add(c);
        used.add(c + 1);
      }
    }
  }
  return bridges;
}

/** 하단 슬롯 생성: 여자 수만큼 + 나머지는 "다음 기회에" */
function buildBottomSlots(activeFemales, cols) {
  const femaleSlots = activeFemales.map((f) => ({ type: 'female', person: f, id: f.id }));
  const emptyCount  = Math.max(0, cols - activeFemales.length);
  const emptySlots  = Array.from({ length: emptyCount }, (_, i) => ({
    type: 'empty', person: null, id: `empty_${i}`,
  }));
  return shuffle([...femaleSlots, ...emptySlots]);
}

/** 사다리 한 열 타기 */
function traverse(bridges, startCol) {
  let col = startCol;
  const points = [{ r: -1, col }];
  for (let r = 0; r < ROWS; r++) {
    const goRight = bridges.find((b) => b.r === r && b.c === col);
    const goLeft  = bridges.find((b) => b.r === r && b.c === col - 1);
    if (goRight) {
      points.push({ r, col }); col++;
      points.push({ r, col });
    } else if (goLeft) {
      points.push({ r, col }); col--;
      points.push({ r, col });
    } else {
      points.push({ r, col });
    }
  }
  points.push({ r: ROWS, col });
  return { points, endCol: col };
}

/* ═══════════════════════════════════════════
   Canvas 렌더러
═══════════════════════════════════════════ */
function renderCanvas(canvas, cols, bridges, drawnPaths, colW, padX) {
  const W = padX * 2 + (cols - 1) * colW;
  const H = PAD_TOP + ROWS * ROW_H + PAD_BOT;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const gx = (c) => padX + c * colW;
  const gy = (r) => {
    if (r < 0)     return PAD_TOP;
    if (r >= ROWS) return PAD_TOP + ROWS * ROW_H;
    return PAD_TOP + r * ROW_H + ROW_H / 2;
  };

  // 세로줄
  for (let c = 0; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo(gx(c), PAD_TOP);
    ctx.lineTo(gx(c), PAD_TOP + ROWS * ROW_H);
    ctx.strokeStyle = '#DDD6FE';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  // 가로 다리
  bridges.forEach(({ r, c }) => {
    const y = PAD_TOP + r * ROW_H + ROW_H / 2;
    ctx.beginPath();
    ctx.moveTo(gx(c), y);
    ctx.lineTo(gx(c + 1), y);
    ctx.strokeStyle = '#C4B5FD';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.stroke();
  });

  // 경로
  drawnPaths.forEach(({ points, color }) => {
    ctx.save();

    // 외곽 글로우
    ctx.strokeStyle = color;
    ctx.lineWidth   = 9;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    points.forEach(({ r, col }, i) => {
      i === 0 ? ctx.moveTo(gx(col), gy(r)) : ctx.lineTo(gx(col), gy(r));
    });
    ctx.stroke();

    // 메인 선
    ctx.globalAlpha = 1;
    ctx.lineWidth   = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    points.forEach(({ r, col }, i) => {
      i === 0 ? ctx.moveTo(gx(col), gy(r)) : ctx.lineTo(gx(col), gy(r));
    });
    ctx.stroke();

    // 끝점 원
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(gx(last.col), gy(last.r), 6, 0, Math.PI * 2);
    ctx.fillStyle  = color;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();
  });
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════ */
export default function LadderGame({ males, females, onBack }) {
  const canvasRef = useRef(null);

  // 제외 여부와 관계없이 전원 사다리 참여
  // 단, 제외된 남자는 결과에서 강제로 "다음 기회에" 처리
  const eligibleFemales = females.filter((f) => !f.excluded);
  const cols = Math.max(males.length, 2);

  const { COL_W, PAD_X } = getColMetrics();

  const initGame = useCallback(() => ({
    bridges:     buildBridges(cols),
    bottomSlots: buildBottomSlots(eligibleFemales, cols),
  }), [cols, eligibleFemales]);

  const [game,       setGame]       = useState(initGame);
  const [allResults, setAllResults] = useState(null);
  const [drawnPaths, setDrawnPaths] = useState([]);
  const [animQueue,  setAnimQueue]  = useState([]);
  const [phase,      setPhase]      = useState('ready');
  const [activeIdx,  setActiveIdx]  = useState(null);

  const { bridges, bottomSlots } = game;

  /* 결과 계산
     - 제외된 남자 → 경로는 그리되 결과는 강제로 empty ("다음 기회에")
  */
  const computeResults = useCallback((br, slots) =>
    males.map((male, i) => {
      const { points, endCol } = traverse(br, i);
      const slot = male.excluded
        ? { type: 'empty', person: null, id: `exc_${male.id}` }
        : slots[endCol];
      return {
        male,
        slot,
        colIdx: i,
        points,
        color: PATH_COLORS[i % PATH_COLORS.length],
      };
    }), [males]);

  /* 캔버스 초기 렌더 */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvas(canvas, cols, bridges, drawnPaths, COL_W, PAD_X);
  }, [bridges, cols, drawnPaths, activeIdx]);

  /* 애니메이션 루프 */
  useEffect(() => {
    if (phase !== 'animating' || animQueue.length === 0) return;

    const resultIdx = animQueue[0];
    const result    = allResults[resultIdx];

    const alreadyDrawn = drawnPaths.some((p) => p.colIdx === resultIdx);
    if (alreadyDrawn) {
      const t = setTimeout(() => setAnimQueue((q) => q.slice(1)), 0);
      return () => clearTimeout(t);
    }

    let step = 1;
    const allPoints = result.points;
    const timer = setInterval(() => {
      const partial = allPoints.slice(0, step + 1);
      const current = [
        ...drawnPaths.filter((p) => p.colIdx !== resultIdx),
        { ...result, points: partial },
      ];
      if (canvasRef.current) renderCanvas(canvasRef.current, cols, bridges, current, COL_W, PAD_X);

      step++;
      if (step >= allPoints.length) {
        clearInterval(timer);
        setDrawnPaths(current);
        setAnimQueue((q) => {
          const next = q.slice(1);
          if (next.length === 0) { setPhase('done'); setActiveIdx(null); }
          else                   { setActiveIdx(allResults[next[0]].colIdx); }
          return next;
        });
      }
    }, 150);

    return () => clearInterval(timer);
  }, [phase, animQueue, allResults, drawnPaths, bridges, cols]);

  /* 전체 타기 */
  const startAll = () => {
    const results = computeResults(bridges, bottomSlots);
    setAllResults(results);
    setDrawnPaths([]);
    setActiveIdx(results[0].colIdx);
    setAnimQueue(results.map((_, i) => i));
    setPhase('animating');
  };

  /* 이름 클릭 */
  const clickName = (colIdx) => {
    if (phase === 'animating') return;
    let results = allResults;
    if (!results) {
      results = computeResults(bridges, bottomSlots);
      setAllResults(results);
    }
    setDrawnPaths((prev) => prev.filter((p) => p.colIdx !== colIdx));
    setActiveIdx(colIdx);
    setAnimQueue([colIdx]);
    setPhase('animating');
  };

  /* 다시 돌리기 */
  const retry = () => {
    setGame(initGame());
    setAllResults(null);
    setDrawnPaths([]);
    setAnimQueue([]);
    setActiveIdx(null);
    setPhase('ready');
  };

  const isAnimating = phase === 'animating';
  const isDone      = phase === 'done';

  const visibleResults = allResults
    ? allResults.filter((r) => drawnPaths.some((p) => p.colIdx === r.colIdx))
    : [];

  // 여자가 남자보다 많을 때: 매칭 안 된 여자 목록
  const matchedFemaleIds = new Set(
    visibleResults
      .filter((r) => r.slot?.type === 'female')
      .map((r) => r.slot.person.id)
  );
  const unmatchedFemales = isDone
    ? eligibleFemales.filter((f) => !matchedFemaleIds.has(f.id))
    : [];

  return (
    <div className={css.wrap}>
      <div className={css.topBar}>
        <button className={css.backBtn} onClick={onBack}>← 참가자 수정</button>
        <h2 className={css.pageTitle}>💕 사다리 게임</h2>
        <div style={{ width: 110 }} />
      </div>

      <div className={css.ladderCard}>
        {/* 남자 이름 (전원 — 제외된 사람도 표시) */}
        <div className={css.nameRow}>
          {males.map((m, i) => {
            const drawn   = drawnPaths.some((p) => p.colIdx === i);
            const animNow = isAnimating && activeIdx === i;
            return (
              <div key={m.id} className={css.nameTag} style={{ width: COL_W }}>
                <button
                  className={[
                    css.nameChip, css.chipMale,
                    animNow ? css.animating : '',
                    drawn && !animNow ? css.dimmed : '',
                  ].join(' ')}
                  onClick={() => clickName(i)}
                  disabled={isAnimating}
                >
                  {m.name}
                </button>
              </div>
            );
          })}
        </div>

        <div className={css.canvasWrap}>
          <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
        </div>

        {/* 하단 슬롯 (여자 실제 인원 + 다음 기회에) — 클릭 비활성 */}
        <div className={css.nameRow}>
          {bottomSlots.map((slot, i) => {
            const drawn    = allResults && drawnPaths.some((p) => p.colIdx === i);
            const animNow  = isAnimating && activeIdx === i;
            const isFemale = slot.type === 'female';
            return (
              <div key={slot.id} className={css.nameTag} style={{ width: COL_W }}>
                <div
                  className={[
                    css.nameChip,
                    css.nameChipStatic,
                    isFemale ? css.chipFemale : css.chipEmpty,
                    animNow ? css.animating : '',
                    drawn && !animNow ? css.dimmed : '',
                  ].join(' ')}
                >
                  {isFemale ? slot.person.name : '💫 언젠가'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {phase === 'ready' && (
        <p className={css.clickHint}>위 이름을 클릭하면 그 사람만 사다리를 탑니다 ✨</p>
      )}

      {phase === 'ready' && (
        <button className={css.startBtn} onClick={startAll}>
          🎲 전체 사다리 타기!
        </button>
      )}

      {isAnimating && (
        <div className={css.loadingBadge}>
          <span className={css.spinner} />
          사다리 타는 중...
        </div>
      )}

      {(visibleResults.length > 0 || isDone) && (
        <ResultPanel
          results={visibleResults}
          unmatchedFemales={unmatchedFemales}
          isDone={isDone}
          onRetry={retry}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   결과 패널
═══════════════════════════════════════════ */
function ResultPanel({ results, unmatchedFemales, isDone, onRetry }) {
  return (
    <div className={css.resultPanel}>
      <div className={css.resultTitleRow}>
        <span className={css.resultHeart}>💑</span>
        <h2 className={css.resultTitle}>
          {isDone ? '매칭 결과!' : '결과 집계 중...'}
        </h2>
        <span className={css.resultHeart}>💑</span>
      </div>

      <div className={css.resultList}>
        {results.map((item, i) => (
          <div
            key={i}
            className={`${css.resultItem} ${item.slot.type === 'empty' ? css.resultItemEmpty : ''}`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className={css.resultMale}>{item.male.name}</div>
            <span className={css.resultArrow}>
              {item.slot.type === 'female' ? '💞' : '😅'}
            </span>
            <div className={item.slot.type === 'female' ? css.resultFemale : css.resultEmpty}>
              {item.slot.type === 'female' ? item.slot.person.name : 'To be continued...'}
            </div>
          </div>
        ))}

        {/* 여자가 더 많을 때: 매칭 안 된 여자 */}
        {isDone && unmatchedFemales.length > 0 && (
          <>
            <div className={css.unmatchedDivider}>
              <span>아직 인연을 기다리는 중 💫</span>
            </div>
            {unmatchedFemales.map((f, i) => (
              <div
                key={f.id}
                className={`${css.resultItem} ${css.resultItemEmpty}`}
                style={{ animationDelay: `${(results.length + i) * 0.06}s` }}
              >
                <div className={css.resultFemale}>{f.name}</div>
                <span className={css.resultArrow}>🌟</span>
                <div className={css.resultEmpty}>To be continued...</div>
              </div>
            ))}
          </>
        )}
      </div>

      {isDone && (
        <button className={css.retryBtn} onClick={onRetry}>🔄 다시 돌리기</button>
      )}
    </div>
  );
}
