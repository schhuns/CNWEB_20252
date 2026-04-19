import VideoStream from '@/components/VideoStream';

export default function Home() {
  return (
    <main className="dashboard-container">
      <header className="header">
        <h1>VisionAI Workspace</h1>
        <p>Enterprise Real-time AI Video Analytics</p>
      </header>

      <div className="glass-panel">
        <h2 style={{marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span style={{display: 'inline-block', width: '8px', height: '8px', background: '#00f2fe', borderRadius: '50%'}}></span>
          Live Camera Feeds
        </h2>
        
        <div className="video-grid">
          <VideoStream cameraId="CAM-01 (Front Desk)" />
          {/* We can add more cameras in the future */}
        </div>
      </div>
    </main>
  );
}
