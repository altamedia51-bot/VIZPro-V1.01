import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAudioAnalyzerProps {
  audioUrl: string | null;
}

export function useAudioAnalyzer({ audioUrl }: UseAudioAnalyzerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audioRef.current.volume = volume;
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  useEffect(() => {
    if (audioUrl) {
      initAudio();
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    }
    
    return () => {
      // Cleanup happens on unmount or URL change
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl, initAudio]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const getAudioData = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return { dataArray: new Uint8Array(0), bufferLength: 0 };
    }
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    return {
      dataArray: dataArrayRef.current,
      bufferLength: analyserRef.current.frequencyBinCount
    };
  }, []);

  const getWaveformData = useCallback(() => {
    if (!analyserRef.current) {
      return { dataArray: new Uint8Array(0), bufferLength: 0 };
    }
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);
    return { dataArray, bufferLength };
  }, []);

  return {
    isPlaying,
    duration,
    currentTime,
    togglePlay,
    seek,
    getAudioData,
    getWaveformData,
    audioRef: audioRef.current,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    sourceNode: sourceRef.current,
    volume,
    setVolume: (val: number) => {
      setVolumeState(val);
      if (audioRef.current) {
        audioRef.current.volume = val;
      }
    }
  };
}
