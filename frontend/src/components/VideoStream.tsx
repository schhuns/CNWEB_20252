"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface VideoStreamProps {
  cameraId: string;
}

export default function VideoStream({ cameraId }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // ---------------- CAMERA ----------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      runningRef.current = true;

      connectWebSocket();
    } catch (err) {
      console.error("Camera error:", err);
      alert("Cannot access camera. Please allow permission.");
    }
  };

  const stopCamera = () => {
    runningRef.current = false;

    // stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // close websocket
    wsRef.current?.close();
    wsRef.current = null;

    // clear canvas
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, 640, 480);

    setStatus("disconnected");
  };

  // ---------------- WEBSOCKET ----------------
  const connectWebSocket = () => {
    setStatus("connecting");

    const ws = new WebSocket("ws://localhost:8000/ws/stream");

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setStatus("connected");
      sendFrames();
    };

    ws.onmessage = (event) => {
      const img = new Image();

      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 640, 480);
      };

      img.src = event.data;
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      setStatus("disconnected");

      if (runningRef.current) {
        setTimeout(connectWebSocket, 2000);
      }
    };
  };

  // ---------------- FRAME LOOP (FIXED) ----------------
  const sendFrames = useCallback(() => {
    const loop = () => {
      if (
        !runningRef.current ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !videoRef.current
      ) {
        return;
      }

      const video = videoRef.current;

      if (video.readyState >= 2) {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, 640, 480);

          const frame = canvas.toDataURL("image/jpeg", 0.6);
          wsRef.current?.send(frame);
        }
      }

      setTimeout(loop, 60); // ~15 FPS
    };

    loop();
  }, []);

  // ---------------- CLEANUP ----------------
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="stream-container">
      <div className="video-wrapper">
        {/* CAMERA FEED (hidden but active) */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ display: "none" }}
        />

        {/* AI OUTPUT */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            display: "block",
            background: "#000",
          }}
        />

        {status === "disconnected" && (
          <div className="camera-placeholder">CAMERA OFFLINE</div>
        )}

        <div className="connection-status">
          {status === "connected"
            ? "LIVE AI"
            : status === "connecting"
            ? "CONNECTING..."
            : "OFFLINE"}
        </div>

        <div className="camera-label">{cameraId}</div>
      </div>

      <div className="controls">
        {runningRef.current ? (
          <button onClick={stopCamera}>Stop</button>
        ) : (
          <button onClick={startCamera}>Enable AI Camera</button>
        )}
      </div>
    </div>
  );
}
