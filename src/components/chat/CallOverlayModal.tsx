import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const CallOverlayModal: React.FC = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    endCall,
    toggleCallMute,
    toggleCallVideo,
    toggleScreenShare,
  } = useChat();

  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Call timer
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'connected') {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - (activeCall.startedAt || Date.now())) / 1000);
      setCallDuration(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall]);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isVideo = activeCall.type === 'video' || activeCall.isScreenSharing;

  return (
    <div
      id="call-overlay-modal"
      className={`fixed z-50 transition-all duration-300 ${
        isFullscreen
          ? 'inset-0 bg-[#0a0404]'
          : 'bottom-6 right-6 w-[420px] h-[580px] rounded-3xl bg-[#120707] border-2 border-[#A51D20] shadow-[0_15px_50px_rgba(0,0,0,0.9)] overflow-hidden'
      } flex flex-col`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#1a0d0d]/90 border-b border-[#241212] backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E53935] animate-ping" />
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">
              Chamada com @{activeCall.targetUser.username}
            </h4>
            <span className="text-[11px] text-[#A98F8F] font-mono">
              {activeCall.status === 'calling' ? 'Chamando...' : formatDuration(callDuration)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg bg-[#241212] hover:bg-[#351717] text-[#A98F8F] hover:text-white transition-colors cursor-pointer"
          title={isFullscreen ? 'Reduzir janela' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Video / Screen Canvas Area */}
      <div className="flex-1 bg-[#0d0505] relative flex items-center justify-center overflow-hidden">
        {activeCall.isScreenSharing && localStream ? (
          // Active Screen Share Stream View
          <div className="w-full h-full flex items-center justify-center bg-black relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 px-3 py-1 bg-[#E53935]/80 backdrop-blur-md rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg">
              <Monitor className="w-3.5 h-3.5" /> Compartilhando sua Tela
            </div>
          </div>
        ) : isVideo && !activeCall.isVideoOff && localStream ? (
          // Camera Video Stream View
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            {/* Small PIP for remote / target info */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2.5 px-3 py-1.5 bg-[#120707]/80 backdrop-blur-md rounded-xl border border-[#351717]">
              <img
                src={activeCall.targetUser.avatar}
                alt={activeCall.targetUser.username}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-xs font-semibold text-white">@{activeCall.targetUser.username}</span>
            </div>
          </div>
        ) : (
          // Audio / Camera Off Placeholder with Ambient Crimson Glow
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#A51D20]/20 to-[#E53935]/20 blur-xl animate-pulse" />
              <div className="relative w-28 h-28 rounded-full p-1.5 bg-gradient-to-tr from-[#A51D20] to-[#E53935] shadow-[0_0_30px_rgba(229,57,53,0.4)]">
                <img
                  src={activeCall.targetUser.avatar}
                  alt={activeCall.targetUser.username}
                  className="w-full h-full object-cover rounded-full bg-[#120707]"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">@{activeCall.targetUser.username}</h3>
            <p className="text-xs text-[#A98F8F] mb-3">
              {activeCall.status === 'calling' ? 'Aguardando resposta do usuário...' : 'Áudio e Conexão Ativos'}
            </p>

            {activeCall.status === 'connected' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1a0d0d] border border-[#351717] rounded-full text-[#FF5252] text-xs font-medium">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Voz em Alta Definição (HD)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Call Action Controls */}
      <div className="p-4 bg-[#1a0d0d]/95 border-t border-[#241212] backdrop-blur-md flex items-center justify-center gap-3.5">
        {/* Mute Toggle */}
        <button
          id="call-toggle-mute-button"
          onClick={toggleCallMute}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
            activeCall.isMuted
              ? 'bg-[#E53935] text-white border-[#E53935] shadow-[0_0_15px_#E53935]'
              : 'bg-[#241212] hover:bg-[#351717] text-[#F5EEEE] border-[#351717]'
          }`}
          title={activeCall.isMuted ? 'Desmutar microfone' : 'Mutar microfone'}
        >
          {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          id="call-toggle-video-button"
          onClick={toggleCallVideo}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
            activeCall.isVideoOff
              ? 'bg-[#E53935] text-white border-[#E53935] shadow-[0_0_15px_#E53935]'
              : 'bg-[#241212] hover:bg-[#351717] text-[#F5EEEE] border-[#351717]'
          }`}
          title={activeCall.isVideoOff ? 'Ligar câmera' : 'Desligar câmera'}
        >
          {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          id="call-toggle-screen-share-button"
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
            activeCall.isScreenSharing
              ? 'bg-[#2E7D32] text-white border-[#2E7D32] shadow-[0_0_15px_rgba(46,125,50,0.6)]'
              : 'bg-[#241212] hover:bg-[#351717] text-[#F5EEEE] border-[#351717]'
          }`}
          title={activeCall.isScreenSharing ? 'Parar transmissão de tela' : 'Compartilhar tela inteira'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Hang Up End Call */}
        <button
          id="call-hangup-button"
          onClick={endCall}
          className="w-14 h-12 rounded-2xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white flex items-center justify-center transition-all shadow-[0_0_20px_rgba(211,47,47,0.5)] active:scale-95 cursor-pointer ml-2"
          title="Encerrar chamada"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
