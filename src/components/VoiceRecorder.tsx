import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  UploadCloud, 
  Check, 
  Loader2, 
  AlertCircle, 
  FileEdit 
} from 'lucide-react';
import { getOrCreateShareFolder } from '../lib/driveSync';

interface VoiceRecorderProps {
  token: string;
  onUploadSuccess: (fileId: string, fileName: string) => void;
  onCancel?: () => void;
}

export default function VoiceRecorder({ token, onUploadSuccess, onCancel }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string>('');
  
  // References for MediaRecorder and Audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // References for Real-time Web Audio API voice-reactive visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Simulated Waveform heights for styling
  const [waveHeights, setWaveHeights] = useState<number[]>(new Array(18).fill(11));

  // Helper to safely stop Web Audio Analyser
  const closeAudioContext = () => {
    try {
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
        }
        audioContextRef.current = null;
      }
    } catch (_) {}
    analyserRef.current = null;
    dataArrayRef.current = null;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      closeAudioContext();
    };
  }, [audioUrl]);

  // Handle ticking timer and ultra-smooth animated waveform visuals while recording
  useEffect(() => {
    let animInterval: NodeJS.Timeout | null = null;
    let phase = 0;
    
    if (recordingState === 'recording') {
      // 1-second clock
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Update wave heights smoothly at ~16mspf intervals (extreme fluid 60fps visuals / fallback)
      animInterval = setInterval(() => {
        phase += 0.15;
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          // Map real analyser peaks to the 18 wave bars
          const newHeights = Array.from({ length: 18 }, (_, idx) => {
            const dataIdx = Math.floor((idx / 18) * dataArrayRef.current!.length);
            const rawVal = dataArrayRef.current![dataIdx] || 0;
            
            // Map 0-255 frequency amplitude to 8-90% vertical bars
            let heightPercent = (rawVal / 255) * 80 + 8;
            
            // Add slight micro-cosmic ripple to make transitions gorgeous
            const ripple = Math.sin(phase + idx * 0.45) * 5;
            heightPercent = Math.min(95, Math.max(8, heightPercent + ripple));
            
            return Math.floor(heightPercent);
          });
          setWaveHeights(newHeights);
        } else {
          // Elegant animated undulating mock-fallback (looks infinitely smooth!)
          const newHeights = Array.from({ length: 18 }, (_, idx) => {
            const wave1 = Math.sin(phase + idx * 0.4) * 20;
            const wave2 = Math.cos(phase * 0.8 - idx * 0.25) * 10;
            const heightPercent = 35 + wave1 + wave2 + (Math.random() * 6);
            return Math.floor(Math.min(90, Math.max(10, heightPercent)));
          });
          setWaveHeights(newHeights);
        }
      }, 50); // Refresh visualizer at 50ms for maximum frame-rate fluid look!
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Return wave bars to gentle low resting positions
      setWaveHeights([12, 10, 11, 10, 12, 11, 10, 11, 12, 10, 11, 10, 12, 11, 10, 11, 12, 10]);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animInterval) clearInterval(animInterval);
    };
  }, [recordingState]);

  // Format the duration into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remains = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remains.toString().padStart(2, '0')}`;
  };

  // Start voice recording
  const startRecording = async () => {
    setUploadError(null);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Smart mimetype selection for maximal cross-browser safety
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'audio/ogg' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'audio/mp4' };
      }
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (mimeErr) {
        // Fallback to default browser choice
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      // Set up real-time voice amplitude analysis
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          
          analyser.fftSize = 64; 
          analyser.smoothingTimeConstant = 0.45; 
          
          source.connect(analyser);
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;
        }
      } catch (audioErr) {
        console.warn('Real-time audio visualizer failed to initialize:', audioErr);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Populate default editable German file name
        const now = new Date();
        const dateStr = now.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\./g, '-');
        const timeStr = now.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/:/g, '-');
        
        setCustomName(`Sprachaufnahme_${dateStr}_${timeStr}`);
        
        // Stop all tracks to release mic hardware lock
        stream.getTracks().forEach(track => track.stop());
        closeAudioContext();
      };

      setDuration(0);
      setRecordingState('recording');
      recorder.start(250); // Slice data every 250ms
    } catch (err: any) {
      console.error('Microphone access blocked:', err);
      setUploadError(
        'Mikrofon-Zugriff verweigert. Bitte erlaube Mikrofon-Berechtigungen im Browser für diese Domain.'
      );
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
    }
  };

  // Reset recorder to start clean
  const resetRecorder = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setDuration(0);
    setIsPlaying(false);
    setRecordingState('idle');
    setUploadError(null);
    setCustomName('');
    closeAudioContext();
  };

  // Play or Pause the recorded voice review
  const togglePlayReview = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Upload file payload to Google Drive
  const uploadToGoogleDrive = async () => {
    if (!audioBlob || !token) return;
    setIsUploading(true);
    setUploadError(null);
    
    // Choose file extension based on mimeType
    const extension = audioBlob.type.includes('mp4') ? 'mp4' : 
                      audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
                      
    const baseName = customName.trim() || 'Sprachaufnahme';
    // Clean up .extensions user typed mistakenly to prevent double extentions (.webm.webm)
    const cleanedBaseName = baseName.replace(new RegExp(`\\.${extension}$`, 'i'), '');
    const fileName = `${cleanedBaseName}.${extension}`;

    try {
      const folderId = await getOrCreateShareFolder(token);
      const metadata = {
        name: fileName,
        mimeType: audioBlob.type || 'audio/webm',
        parents: [folderId]
      };

      const boundary = '314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const reader = new FileReader();
      const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(audioBlob);
      });

      const metadataPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
      
      const headerBlob = new Blob([
        delimiter,
        metadataPart,
        delimiter,
        `Content-Type: ${audioBlob.type}\r\n\r\n`
      ]);
      const footerBlob = new Blob([closeDelimiter]);

      const bodyBlob = new Blob([headerBlob, fileData, footerBlob]);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: bodyBlob,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload fehlgeschlagen mit Status ${response.status}`);
      }

      const data = await response.json();
      if (data.id) {
        // Report success up
        onUploadSuccess(data.id, fileName);
      } else {
        throw new Error('Keine Google-ID erhalten.');
      }
    } catch (err: any) {
      console.error('[Drive Upload Error]', err);
      setUploadError(err.message || 'Verbindungsfehler beim Speichern in Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full font-sans border border-slate-200/90 bg-white rounded-xl p-4 md:p-6 shadow-3xs hover:border-slate-350 transition-colors duration-300">
      <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
        <span className="text-xs uppercase font-extrabold tracking-wider text-slate-700">
          Sprachrecorder / Diktiergerät
        </span>
      </div>

      <div className="flex flex-col items-center justify-center p-2 text-center">
        
        {/* Recording active details */}
        {recordingState === 'recording' && (
          <div className="flex items-center gap-1 mb-3 bg-red-50 border border-red-100 text-red-650 font-bold px-3 py-1.5 rounded-full text-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600 block shrink-0" />
            <span>Nimmt auf...</span>
          </div>
        )}

        {/* Live Audio or animated Wave visualizer bar container */}
        <div className="h-16 flex items-center justify-center gap-1.5 w-full max-w-xs mb-3">
          {recordingState === 'recording' ? (
            <div className="flex items-end justify-center gap-[3px] h-10 w-full px-2">
              {waveHeights.map((height, i) => (
                <div 
                  key={i} 
                  style={{ height: `${height}%` }}
                  className="w-1.5 rounded-full bg-red-500 transition-all duration-100"
                />
              ))}
            </div>
          ) : recordingState === 'stopped' ? (
            <div className="flex items-center justify-center bg-sky-50 text-sky-600 w-12 h-12 rounded-full border border-sky-150 animate-in zoom-in duration-200">
              <Mic className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-slate-50 text-slate-400 w-12 h-12 rounded-full border border-slate-100">
              <Mic className="w-5.5 h-5.5 stroke-[2]" />
            </div>
          )}
        </div>

        {/* Big formatted clock */}
        <div className="text-3xl font-black text-slate-800 tracking-tight font-mono mb-3 tabular-nums">
          {formatTime(duration)}
        </div>

        {/* Dynamic Custom Name Editor */}
        {recordingState === 'stopped' && (
          <div className="w-full max-w-md mb-5 p-4 bg-slate-50 border border-slate-205/80 rounded-xl text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <FileEdit className="w-3.5 h-3.5 text-[#0288D1]" />
              <span>Name der Sprachdatei bearbeiten</span>
            </label>
            <div className="relative flex items-center border border-slate-250 bg-white focus-within:border-[#0288D1] focus-within:ring-2 focus-within:ring-sky-100 rounded-lg overflow-hidden transition-all shadow-3xs">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Trage einen Namen für diese Datei ein..."
                className="w-full text-xs font-bold text-slate-800 py-2.5 pl-3.5 pr-20 bg-transparent focus:outline-none border-none outline-none leading-none"
              />
              <span className="absolute right-3 bg-slate-100 text-slate-600 border border-slate-200/60 px-2 py-0.5 rounded text-[10px] font-black font-mono select-none">
                .{audioBlob?.type.includes('mp4') ? 'mp4' : audioBlob?.type.includes('ogg') ? 'ogg' : 'webm'}
              </span>
            </div>
          </div>
        )}

        {/* Instruction subtexts */}
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-5">
          {recordingState === 'idle' && 'Bereit für die Aufnahme. Klicke auf den roten Mikrofonbutton.'}
          {recordingState === 'recording' && 'Klicke auf den quadratischen Stoppbutton, um die Sprachmemo zu beenden.'}
          {recordingState === 'stopped' && 'Benenne deine Sprachmemo optional um, höre sie dir an und spreche sie direkt auf dein Google Drive.'}
        </p>

        {/* Dynamic Action Buttons bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 hover:scale-103 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer transition-all duration-200 active:scale-97"
            >
              <Mic className="w-4 h-4 text-white" />
              <span>Aufnahme starten</span>
            </button>
          )}

          {recordingState === 'recording' && (
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-950 hover:scale-103 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer transition-all duration-200 active:scale-97 animate-bounce-subtle"
            >
              <Square className="w-4 h-4 text-white fill-current" />
              <span>Stoppen</span>
            </button>
          )}

          {recordingState === 'stopped' && (
            <>
              {/* Playback review button */}
              <button
                onClick={togglePlayReview}
                className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-xs cursor-pointer transition-all duration-200 ${
                  isPlaying 
                    ? 'bg-sky-50 border-sky-200 text-sky-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-sky-600 fill-current animate-pulse" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-slate-600 fill-current" />
                    <span>Anhören</span>
                  </>
                )}
              </button>

              {/* Record again button */}
              <button
                onClick={resetRecorder}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-all duration-200 disabled:opacity-50"
                title="Gelöscht und von vorne anfangen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Neu aufnehmen</span>
              </button>

              {/* Upload to Drive (Save) */}
              <button
                onClick={uploadToGoogleDrive}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0288D1] hover:bg-[#0277bd] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-xs shadow-3xs cursor-pointer transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Wird hochgeladen...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-white" />
                    <span>In Drive speichern</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Connection or permission error panel */}
        {uploadError && (
          <div className="w-full mt-4 p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2.5 text-left text-red-700 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h5 className="text-[11px] font-black uppercase tracking-wider mb-0.5">Fehler aufgetreten</h5>
              <p className="text-xs text-red-650 leading-relaxed font-semibold">{uploadError}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
