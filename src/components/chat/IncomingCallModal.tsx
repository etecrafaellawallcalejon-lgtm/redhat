import React from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useChat();

  if (!incomingCall) return null;

  return (
    <div
      id="incoming-call-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        id="incoming-call-card"
        className="w-full max-w-sm bg-[#1a0d0d] border-2 border-[#E53935] rounded-3xl p-6 text-center shadow-[0_0_40px_rgba(229,57,53,0.35)] flex flex-col items-center animate-bounce-subtle"
      >
        {/* Pulsing Avatar */}
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-[#E53935]/30 animate-ping" />
          <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#A51D20] to-[#E53935] shadow-[0_0_20px_#E53935]">
            <img
              src={incomingCall.caller.avatar}
              alt={incomingCall.caller.username}
              className="w-full h-full object-cover rounded-full bg-[#120707]"
            />
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-bold text-white mb-1">@{incomingCall.caller.username}</h3>
        <p className="text-xs text-[#FF5252] font-semibold tracking-wide uppercase mb-6 flex items-center gap-1.5 justify-center">
          {incomingCall.callType === 'video' ? (
            <>
              <Video className="w-3.5 h-3.5" /> Chamada de Vídeo Entrante...
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" /> Chamada de Voz Entrante...
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 w-full pt-2">
          {/* Reject */}
          <button
            id="reject-call-button"
            onClick={rejectCall}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-[#421616] hover:bg-[#D32F2F] text-[#FF8A80] hover:text-white flex items-center justify-center transition-all shadow-lg group-hover:scale-105">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-[#A98F8F] group-hover:text-white">Recusar</span>
          </button>

          {/* Accept */}
          <button
            id="accept-call-button"
            onClick={acceptCall}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-[#2E7D32] hover:bg-[#388E3C] text-white flex items-center justify-center transition-all shadow-[0_0_20px_rgba(46,125,50,0.5)] group-hover:scale-105 animate-pulse">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-[#A98F8F] group-hover:text-white">Atender</span>
          </button>
        </div>
      </div>
    </div>
  );
};
