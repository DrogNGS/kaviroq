import React from "react";
import { View, StyleSheet, Platform } from "react-native";

const particleHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0f0c29; }
    canvas { display: block; }
    .overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .logo {
      font-family: 'Arial Black', sans-serif;
      font-size: 52px;
      font-weight: 900;
      color: #fff;
      letter-spacing: 6px;
      text-shadow: 0 0 30px rgba(255,107,53,0.8), 0 0 60px rgba(255,107,53,0.4);
      animation: pulse 2s ease-in-out infinite;
    }
    .tagline {
      font-family: Arial, sans-serif;
      font-size: 16px;
      color: rgba(255,255,255,0.7);
      letter-spacing: 3px;
      margin-top: 12px;
      text-transform: uppercase;
    }
    .dot {
      width: 8px; height: 8px;
      background: #FF6B35;
      border-radius: 50%;
      display: inline-block;
      margin: 20px 4px 0;
      animation: bounce 1.4s ease-in-out infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-10px); opacity: 1; }
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="overlay">
    <div class="logo">KAVIROQ</div>
    <div class="tagline">Livraison & Services</div>
    <div>
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    const PARTICLE_COUNT = 80;
    const particles = [];

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x  = Math.random() * canvas.width;
        this.y  = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.r  = Math.random() * 2.5 + 1;
        this.alpha = Math.random() * 0.6 + 0.2;
        this.color = Math.random() > 0.5 ? '#FF6B35' : '#ffffff';
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = '#FF6B35';
            ctx.globalAlpha = (1 - dist / 120) * 0.3;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fond dégradé
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0,   '#0f0c29');
      gradient.addColorStop(0.5, '#302b63');
      gradient.addColorStop(1,   '#24243e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawConnections();
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }

    animate();
  </script>
</body>
</html>
`;

export default function ParticleBackground() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={particleHtml}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          } as any}
        />
      </View>
    );
  }

  const { WebView } = require("react-native-webview");
  return (
    <View style={styles.container}>
      <WebView
        source={{ html: particleHtml }}
        style={{ flex: 1 }}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: -1,
  },
});