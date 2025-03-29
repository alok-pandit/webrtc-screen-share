'use client'
import { useRef, useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io(`http://localhost:3001`);

export default function Broadcaster() {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    socket.emit("broadcaster"); // Announce this device as the broadcaster

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", { candidate: event.candidate, target: "viewer" });
      }
    };

    setPeerConnection(pc);
  }, []);

  const startScreenShare = async () => {
    if (!peerConnection || !localVideoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor", frameRate: { ideal: 30, max: 60 } },
        audio: false,
      });

      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("offer", { offer, target: "viewer" });
    } catch (error) {
      console.error("Screen sharing failed:", error);
    }
  };

  return (
    <div>
      <h1>Device 1 (Broadcaster)</h1>
      <button onClick={startScreenShare}>Share Screen</button>
      <video ref={localVideoRef} autoPlay playsInline style={{ width: "50%" }} />
    </div>
  );
}