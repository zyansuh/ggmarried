import { useState, useRef } from 'react';
import css from './ParticipantSetup.module.css';

/* ─────────────────── 비밀 설정 모달 ─────────────────── */
function SecretModal({ participants, onToggle, onClose }) {
  return (
    <div className={css.modalOverlay} onClick={onClose}>
      <div className={css.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={css.modalHeader}>
          <span className={css.modalTitle}>참가자 설정</span>
          <button className={css.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={css.modalList}>
          {participants.length === 0
            ? <p className={css.modalEmpty}>참가자를 먼저 추가해주세요.</p>
            : participants.map((p) => (
              <label key={p.id} className={css.modalRow}>
                <div className={css.modalName}>
                  <span className={p.gender === 'male' ? css.tagM : css.tagF}>
                    {p.gender === 'male' ? '남' : '여'}
                  </span>
                  <span className={css.modalNameText}>{p.name}</span>
                </div>
                <div className={css.toggleWrap}>
                  <input
                    type="checkbox"
                    className={css.toggleCb}
                    checked={!!p.excluded}
                    onChange={() => onToggle(p.id)}
                  />
                  <span className={`${css.toggleLabel} ${p.excluded ? css.excluded : css.included}`}>
                    {p.excluded ? '제외' : '포함'}
                  </span>
                </div>
              </label>
            ))}
        </div>

        <button className={css.modalConfirm} onClick={onClose}>확인</button>
      </div>
    </div>
  );
}

/* ─────────────────── 참가자 열 ─────────────────── */
function GenderList({ type, items, onRemove }) {
  const isMale = type === 'male';
  return (
    <div className={css.listCol}>
      <div className={`${css.listHeader} ${isMale ? css.listHeaderMale : css.listHeaderFemale}`}>
        <span>{isMale ? '👨' : '👩'}</span>
        <span className={css.listHeaderLabel}>{isMale ? '남자' : '여자'}</span>
        <span className={css.listHeaderCount}>{items.length}명</span>
      </div>
      <div className={css.listBody}>
        {items.length === 0
          ? <p className={css.listEmpty}>아직 없어요</p>
          : items.map((p) => (
            <div key={p.id} className={`${css.personRow} ${p.excluded ? css.excluded : ''}`}>
              <div className={css.personName}>
                <span className={`${css.dot} ${isMale ? css.dotMale : css.dotFemale} ${p.excluded ? css.dotExcluded : ''}`} />
                <span className={`${css.nameText} ${p.excluded ? css.excluded : ''}`}>{p.name}</span>
              </div>
              <button className={css.removeBtn} onClick={() => onRemove(p.id)}>✕</button>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ─────────────────── 메인 컴포넌트 ─────────────────── */
export default function ParticipantSetup({ participants, onAdd, onRemove, onToggleExclude, onStart }) {
  const [name, setName]           = useState('');
  const [gender, setGender]       = useState('male');
  const [showSecret, setShowSecret] = useState(false);
  const inputRef = useRef(null);

  const males         = participants.filter((p) => p.gender === 'male');
  const females       = participants.filter((p) => p.gender === 'female');
  const activeMales   = males.filter((p) => !p.excluded);
  const activeFemales = females.filter((p) => !p.excluded);
  const canStart      = activeMales.length >= 1 && activeFemales.length >= 1;
  const excludedCount = participants.filter((p) => p.excluded).length;

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (participants.some((p) => p.name === trimmed && p.gender === gender)) return;
    onAdd({ name: trimmed, gender });
    setName('');
    inputRef.current?.focus();
  };

  return (
    <div className={css.wrap}>
      {/* 헤더 */}
      <header className={css.header}>
        <div className={css.logoArea}>
          <span className={css.logoEmoji}>💕</span>
          <div>
            <h1 className={css.appTitle}>우결 사다리게임</h1>
            <p className={css.appSub}>참가자를 입력하고 게임을 시작해요!</p>
          </div>
        </div>
        <button
          className={css.settingsBtn}
          onClick={() => setShowSecret(true)}
          title="참가자 설정"
        >
          ⚙️
          {excludedCount > 0 && <span className={css.settingsDot} />}
        </button>
      </header>

      {/* 입력 */}
      <div className={css.inputCard}>
        <div className={css.genderToggle}>
          <button
            className={`${css.gBtn} ${css.gBtnMale} ${gender === 'male' ? css.active : ''}`}
            onClick={() => setGender('male')}
          >
            👨 남자
          </button>
          <button
            className={`${css.gBtn} ${css.gBtnFemale} ${gender === 'female' ? css.active : ''}`}
            onClick={() => setGender('female')}
          >
            👩 여자
          </button>
        </div>
        <div className={css.inputRow}>
          <input
            ref={inputRef}
            className={css.nameInput}
            placeholder="참가자 이름 입력..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            maxLength={10}
            autoFocus
          />
          <button className={css.addBtn} onClick={handleAdd}>추가</button>
        </div>
      </div>

      {/* 참가자 목록 */}
      <div className={css.listsRow}>
        <GenderList type="male"   items={males}   onRemove={onRemove} />
        <GenderList type="female" items={females} onRemove={onRemove} />
      </div>

      {/* 통계 */}
      <div className={css.statsBar}>
        <div className={css.statItem}>
          <span className={css.statNum}>{males.length}</span>
          <span className={css.statLabel}>남자</span>
        </div>
        <span className={css.statDivider}>💞</span>
        <div className={css.statItem}>
          <span className={css.statNum}>{females.length}</span>
          <span className={css.statLabel}>여자</span>
        </div>
      </div>

      {!canStart && participants.length > 0 && (
        <p className={css.hint}>
          남자, 여자 각 1명 이상 있어야 시작할 수 있어요 💝
          <br />
          <small>인원이 달라도 괜찮아요!</small>
        </p>
      )}

      <button className={css.startBtn} onClick={canStart ? onStart : undefined} disabled={!canStart}>
        🎉 사다리 게임 시작!
      </button>

      {showSecret && (
        <SecretModal
          participants={participants}
          onToggle={onToggleExclude}
          onClose={() => setShowSecret(false)}
        />
      )}
    </div>
  );
}
