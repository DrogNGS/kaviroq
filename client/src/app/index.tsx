import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";

const particleHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.5 ? '#FF6B35' : '#ffffff'
      });
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0,   '#0f0c29');
      g.addColorStop(0.5, '#302b63');
      g.addColorStop(1,   '#24243e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = '#FF6B35';
            ctx.globalAlpha = (1 - d/120) * 0.3;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>
`;

export default function SplashScreen() {
  const router = useRouter();

  // Animations
  const logoScale    = useRef(new Animated.Value(0)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const btnOpacity   = useRef(new Animated.Value(0)).current;
  const btnTranslate = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo apparaît
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // Boutons montent
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(btnOpacity,   { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(btnTranslate, { toValue: 0, friction: 5, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const BackgroundComponent = () => {
    if (Platform.OS === "web") {
      return (
        <iframe
          srcDoc={particleHtml}
          style={{
            position: "absolute" as any,
            top: 0, left: 0, right: 0, bottom: 0,
            width: "100%", height: "100%",
            border: "none", zIndex: 0,
          } as any}
        />
      );
    }
    const { WebView } = require("react-native-webview");
    return (
      <WebView
        source={{ html: particleHtml }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
      />
    );
  };

  return (
    <View style={styles.container}>

      {/* Fond animé particules */}
      <BackgroundComponent />

      {/* Contenu par dessus */}
      <View style={styles.content}>

        {/* Logo animé */}
        <Animated.View style={[styles.logoBox, {
          transform: [{ scale: logoScale }],
          opacity: logoOpacity
        }]}>
          <View style={styles.logoIconBox}>
            <Text style={styles.logoIcon}>🚀</Text>
          </View>
          <Text style={styles.logo}>KAVIROQ</Text>
          <Text style={styles.subtitle}>Livraison & Services en Côte d'Ivoire</Text>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: "#FF6B35" }]} />
            <View style={[styles.dot, { backgroundColor: "#fff", opacity: 0.5 }]} />
            <View style={[styles.dot, { backgroundColor: "#fff", opacity: 0.3 }]} />
          </View>
        </Animated.View>

        {/* Boutons animés */}
        <Animated.View style={[styles.buttonsBox, {
          opacity: btnOpacity,
          transform: [{ translateY: btnTranslate }]
        }]}>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push("/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push("/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>Créer un compte</Text>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            En continuant, vous acceptez nos{" "}
            <Text style={styles.legalLink}>Conditions d'utilisation</Text>
          </Text>

        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#0f0c29" },
  content:         { flex: 1, alignItems: "center", justifyContent: "space-between", padding: 30, paddingTop: 80, paddingBottom: 50, zIndex: 10 },
  logoBox:         { alignItems: "center" },
  logoIconBox:     { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,107,53,0.2)", borderWidth: 1.5, borderColor: "rgba(255,107,53,0.5)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  logoIcon:        { fontSize: 36 },
  logo:            { fontSize: 48, fontWeight: "900", color: "#fff", letterSpacing: 6, textShadowColor: "rgba(255,107,53,0.8)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  subtitle:        { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 10, letterSpacing: 1 },
  dots:            { flexDirection: "row", gap: 6, marginTop: 20 },
  dot:             { width: 6, height: 6, borderRadius: 3 },
  buttonsBox:      { width: "100%", gap: 12 },
  btnPrimary:      { backgroundColor: "#FF6B35", padding: 16, borderRadius: 14, alignItems: "center", shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  btnPrimaryText:  { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.5 },
  btnSecondary:    { backgroundColor: "rgba(255,255,255,0.1)", padding: 16, borderRadius: 14, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)" },
  btnSecondaryText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  legalText:       { color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", marginTop: 8 },
  legalLink:       { color: "#FF6B35", textDecorationLine: "underline" },
});