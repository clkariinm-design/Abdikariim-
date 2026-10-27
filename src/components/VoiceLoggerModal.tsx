import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Volume2,
  Check,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { BeverageType, formatVolume, UnitMode } from "../types";

interface VoiceLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogEntry: (amountMl: number, beverage: string, notes?: string) => void;
  unit: UnitMode;
}

export const VoiceLoggerModal: React.FC<VoiceLoggerModalProps> = ({
  isOpen,
  onClose,
  onLogEntry,
  unit,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [transcript, setTranscript] = useState<string | null>(null);
  const [extractedAmount, setExtractedAmount] = useState<number>(250);
  const [extractedBeverage, setExtractedBeverage] = useState<string>("Water");
  const [extractedNotes, setExtractedNotes] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
    setIsProcessing(false);
    setErrorMessage(null);
    setTranscript(null);
    setExtractedAmount(250);
    setExtractedBeverage("Water");
    setExtractedNotes("");
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscript(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Microphone access is not supported in this browser environment."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported mime type
      let mimeType = "audio/webm";
      if (
        typeof MediaRecorder !== "undefined" &&
        !MediaRecorder.isTypeSupported("audio/webm")
      ) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });

        if (audioBlob.size === 0) {
          setErrorMessage("No audio recorded. Please try speaking again.");
          return;
        }

        processAudio(audioBlob, mimeType);
      };

      mediaRecorder.start(250); // collect in 250ms chunks
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            // Auto stop after 15 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      let msg = "Could not access microphone.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg =
          "Microphone permission was denied. Please allow microphone access in your browser settings.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip data:audio/xyz;base64, prefix
        const base64Data = base64String.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const base64Data = await blobToBase64(blob);

      const response = await fetch("/api/transcribe-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server responded with status ${response.status}`
        );
      }

      const data = await response.json();

      setTranscript(data.transcript || "(No speech detected)");
      if (data.parsed) {
        setExtractedAmount(data.parsed.amountMl || 250);
        setExtractedBeverage(data.parsed.beverage || "Water");
        setExtractedNotes(data.parsed.notes || "");
      }
    } catch (err: any) {
      console.error("Failed to transcribe audio:", err);
      setErrorMessage(
        err.message ||
          "Failed to transcribe audio with Gemini. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmLog = () => {
    onLogEntry(
      extractedAmount,
      extractedBeverage,
      extractedNotes || (transcript ? `Voice: "${transcript}"` : undefined)
    );
    onClose();
  };

  // Sample prompt helper for test/fallback
  const simulateVoicePrompt = async (samplePhrase: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // Simulate quick voice transcription and extraction
      setTranscript(samplePhrase);
      if (samplePhrase.includes("500") || samplePhrase.includes("bottle")) {
        setExtractedAmount(500);
        setExtractedBeverage("Water");
      } else if (samplePhrase.includes("tea")) {
        setExtractedAmount(300);
        setExtractedBeverage("Herbal Tea");
      } else if (samplePhrase.includes("lemon")) {
        setExtractedAmount(250);
        setExtractedBeverage("Lemon Water");
      } else {
        setExtractedAmount(250);
        setExtractedBeverage("Water");
      }
      setExtractedNotes(`Voice: "${samplePhrase}"`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-logger-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-sky-100 dark:border-slate-800">
        {/* Close Button */}
        <button
          id="close-voice-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Voice Hydration Logger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                gemini-3.5-transcribe
              </span>
            </p>
          </div>
        </div>

        {/* Recording Animation Stage */}
        <div className="my-6 flex flex-col items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 animate-pulse">
                Transcribing audio & analyzing hydration...
              </p>
            </div>
          ) : !transcript ? (
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-4">
                {isRecording && (
                  <>
                    <span className="absolute -inset-3 rounded-full bg-sky-400/20 animate-ping" />
                    <span className="absolute -inset-6 rounded-full bg-sky-400/10 animate-pulse" />
                  </>
                )}
                <button
                  id="record-mic-action-btn"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-lg ${
                    isRecording
                      ? "bg-rose-500 text-white hover:bg-rose-600 ring-4 ring-rose-300 dark:ring-rose-900"
                      : "bg-sky-500 text-white hover:bg-sky-600 ring-4 ring-sky-100 dark:ring-sky-900/40"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 fill-current" />
                  ) : (
                    <Mic className="w-9 h-9" />
                  )}
                </button>
              </div>

              <div className="text-center">
                {isRecording ? (
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-1">
                      Recording ({recordingSeconds}s / 15s)
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tap the red square when you are finished speaking.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Tap to start speaking
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                      Say what you drank naturally, like "Drank a 500ml water
                      bottle" or "A glass of lemon tea".
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Result verification stage */
            <div className="w-full space-y-4">
              {/* Transcribed text bubble */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" /> Transcription
                  </span>
                  <button
                    onClick={startRecording}
                    className="text-xs text-slate-500 hover:text-sky-600 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-record
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                  "{transcript}"
                </p>
              </div>

              {/* Parsed attributes card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 block">
                  Detected Beverage & Amount
                </span>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                      Amount
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={extractedAmount}
                        onChange={(e) =>
                          setExtractedAmount(
                            Math.max(10, Number(e.target.value))
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                      <span className="text-xs font-semibold text-slate-500">
                        {unit}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                      Beverage
                    </label>
                    <input
                      type="text"
                      value={extractedBeverage}
                      onChange={(e) => setExtractedBeverage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {[150, 250, 350, 500].map((quickMl) => (
                    <button
                      key={quickMl}
                      type="button"
                      onClick={() => setExtractedAmount(quickMl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        extractedAmount === quickMl
                          ? "bg-sky-500 text-white"
                          : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-sky-50"
                      }`}
                    >
                      {formatVolume(quickMl, unit)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmLog}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-all shadow-md shadow-sky-500/20 active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  Confirm & Log {formatVolume(extractedAmount, unit)}
                </button>
                <button
                  type="button"
                  onClick={resetState}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Sample phrases & quick test buttons for accessibility/iframe support */}
        {!transcript && !isRecording && !isProcessing && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Try sample voice inputs
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Drank 500ml water bottle",
                "Glass of cold water",
                "Warm cup of herbal tea",
                "Large lemon water",
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => simulateVoicePrompt(sample)}
                  className="px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-300 transition-colors"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
