import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { useGameStore } from '../store/gameStore';
import { setSFXMasterVolume } from '../audio/sfx';

let howlInstance: Howl | null = null;

export const useAudio = () => {
  const status = useGameStore((s) => s.status);
  const volume = useGameStore((s) => s.volume);
  const isPausedRef = useRef(false);

  const destroyMusic = useCallback(() => {
    if (howlInstance) {
      howlInstance.stop();
      howlInstance.unload();
      howlInstance = null;
    }
    isPausedRef.current = false;
  }, []);

  const stopMusic = useCallback(() => {
    if (howlInstance) {
      howlInstance.pause();
      isPausedRef.current = true;
    }
  }, []);

  const resumeMusic = useCallback(() => {
    if (howlInstance && isPausedRef.current) {
      howlInstance.play();
      isPausedRef.current = false;
    }
  }, []);

  const startMusic = useCallback(() => {
    if (howlInstance) {
      if (!howlInstance.playing()) {
        howlInstance.play();
      }
      isPausedRef.current = false;
      return;
    }

    const howl = new Howl({
      src: ['/music/game-music.ogg'],
      loop: true,
      volume: volume * 0.5,
      html5: false,
      onloaderror: (_id, error) => {
        console.error("Audio Load Error:", error);
        howlInstance = null;
      },
      onplayerror: (_id, error) => {
        console.error("Audio Play Error:", error);
        howl.once('unlock', () => howl.play());
      },
      onend: () => {
        isPausedRef.current = false;
      },
    });

    howl.play();
    howlInstance = howl;
    isPausedRef.current = false;
  }, [volume]);

  useEffect(() => {
    const shouldPlay = status === 'PLAYING' || status === 'START';
    if (shouldPlay) {
      startMusic();
    } else {
      destroyMusic();
    }
  }, [status, startMusic, destroyMusic]);

  useEffect(() => {
    if (howlInstance) {
      howlInstance.volume(volume * 0.5);
    }
  }, [volume]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && howlInstance) {
        howlInstance.pause();
        isPausedRef.current = true;
      } else if (!document.hidden && howlInstance && isPausedRef.current) {
        howlInstance.play();
        isPausedRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return {
    setVolume: (vol: number) => {
      if (howlInstance) {
        howlInstance.volume(vol * 0.5);
      }
      setSFXMasterVolume(vol);
    },
    play: startMusic,
    stop: stopMusic,
    resume: resumeMusic,
  };
};
