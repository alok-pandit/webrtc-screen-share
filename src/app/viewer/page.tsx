'use client'
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://10.0.0.156:3001");

export default function Viewer() {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", { candidate: event.candidate, target: "broadcaster" });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    setPeerConnection(pc);

    socket.on("offer", async ({ offer, sender }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { answer, sender });
    });

    socket.on("candidate", (candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      pc.close();
    };
  }, []);

  return (
    <div>
      <h1>Device 2 (Viewer)</h1>
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%" }} />
    </div>
  );
}