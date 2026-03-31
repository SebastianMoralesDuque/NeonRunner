import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { useGameStore } from '../store/gameStore';
import { setSFXMasterVolume } from '../audio/sfx';

let howlInstance: Howl | null = null;
let startedFlag = false;

export const useAudio = () => {
  const status = useGameStore((s) => s.status);
  const volume = useGameStore((s) => s.volume);

  const stopMusic = useCallback(() => {
    if (howlInstance) {
      howlInstance.stop();
      howlInstance.unload();
      howlInstance = null;
    }
    startedFlag = false;
  }, []);

  const startMusic = useCallback(() => {
    if (howlInstance) {
      if (!howlInstance.playing()) howlInstance.play();
      return;
    }

    startedFlag = true;
    const howl = new Howl({
      src: ['/music/game-music.ogg'],
      loop: true,
      volume: volume * 0.5,
      html5: true,
      onloaderror: (id, error) => {
        console.error("Audio Load Error:", id, error);
        startedFlag = false;
      },
      onplayerror: (id, error) => {
        console.error("Audio Play Error:", id, error);
        howl.once('unlock', () => howl.play());
      },
    });

    howl.play();
    howlInstance = howl;
  }, [volume]);

  useEffect(() => {
    const shouldPlay = status === 'PLAYING' || status === 'START';
    if (shouldPlay) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [status, startMusic, stopMusic]);

  useEffect(() => {
    if (howlInstance) {
      howlInstance.volume(volume * 0.5);
    }
  }, [volume]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && howlInstance) {
        howlInstance.pause();
      } else if (!document.hidden && howlInstance && (status === 'PLAYING' || status === 'START')) {
        howlInstance.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [status]);

  return {
    setVolume: (vol: number) => {
      if (howlInstance) {
        howlInstance.volume(vol * 0.5);
      }
      setSFXMasterVolume(vol);
    },
    play: startMusic,
    stop: stopMusic,
  };
};
