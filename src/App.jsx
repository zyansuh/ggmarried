import { useState } from 'react';
import ParticipantSetup from './components/ParticipantSetup';
import LadderGame from './components/LadderGame';
import styles from './App.module.css';
import './index.css';

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [screen, setScreen] = useState('setup');

  const addParticipant = (p) =>
    setParticipants((prev) => [...prev, { ...p, id: Date.now(), excluded: false }]);

  const removeParticipant = (id) =>
    setParticipants((prev) => prev.filter((p) => p.id !== id));

  const toggleExclude = (id) =>
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, excluded: !p.excluded } : p))
    );

  return (
    <div className={styles.app}>
      <div className={`${styles.blob} ${styles.blob1}`} />
      <div className={`${styles.blob} ${styles.blob2}`} />
      <div className={`${styles.blob} ${styles.blob3}`} />

      {screen === 'setup' && (
        <ParticipantSetup
          participants={participants}
          onAdd={addParticipant}
          onRemove={removeParticipant}
          onToggleExclude={toggleExclude}
          onStart={() => setScreen('game')}
        />
      )}

      {screen === 'game' && (
        <LadderGame
          males={participants.filter((p) => p.gender === 'male')}
          females={participants.filter((p) => p.gender === 'female')}
          onBack={() => setScreen('setup')}
        />
      )}
    </div>
  );
}
