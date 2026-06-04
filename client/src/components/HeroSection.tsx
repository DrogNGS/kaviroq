import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView
} from "react-native";

export default function HeroSection() {
  const stats = [
    { value: "500+", label: "Restaurants" },
    { value: "50k+", label: "Plats" },
    { value: "J+1", label: "Livraison" },
    { value: "24/7", label: "Support" },
  ];

  return (
    <View style={styles.hero}>

      {/* Texte principal */}
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>
          N°1 de la livraison de repas en Côte d'Ivoire
        </Text>
        <Text style={styles.heroSubtitle}>
          Hubify Côte d'Ivoire — commandez en ligne, livré à domicile
        </Text>
        <Text style={styles.heroDesc}>
          Hubify est la première plateforme de livraison de repas du pays avec plus de 500 restaurants partenaires et des milliers de plats délicieux. Restaurants, pâtisseries, hôtels — livrés à domicile en 30 min à 1h ou disponibles au retrait sur place. Paiement Mobile Money (Orange Money, MTN Money, Wave) ou en espèces à la livraison — aucune carte bancaire nécessaire.
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsGrid}
        >
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaButton}>
        <Text style={styles.ctaText}>Voir toutes les offres →</Text>
      </TouchableOpacity>

      {/* Description supplémentaire */}
      <View style={styles.descBox}>
        <Text style={styles.descText}>
          Depuis son lancement en Côte d'Ivoire, Hubify s'est imposé comme le leader incontestable de la livraison de repas dans le pays. La plateforme couvre Abidjan et toutes les grandes villes — Bouaké, Yamoussoukro, San Pédro, Daloa, Man, Korhogo — grâce à son réseau logistique propre. Chaque transaction est sécurisée par un système de paiement certifié.
        </Text>
      </View>

      {/* Newsletter */}
      <View style={styles.newsletterBox}>
        <Text style={styles.newsletterTitle}>Nouveau sur Hubify ?</Text>
        <Text style={styles.newsletterDesc}>
          Abonnez-vous à notre newsletter pour recevoir les dernières offres et promotions.
        </Text>
        <View style={styles.emailBox}>
          <Text style={styles.emailPlaceholder}>📧 votre@email.com</Text>
        </View>
        <TouchableOpacity style={styles.subscribeBtn}>
          <Text style={styles.subscribeBtnText}>S'abonner</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  hero:              { backgroundColor: "#fff", padding: 20, marginBottom: 10 },
  heroContent:       { marginBottom: 20 },
  heroTitle:         { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 8, lineHeight: 28 },
  heroSubtitle:      { fontSize: 16, color: "#FF6B35", fontWeight: "600", marginBottom: 12 },
  heroDesc:          { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 10 },
  statsContainer:    { marginBottom: 20 },
  statsGrid:         { flexDirection: "row", gap: 12 },
  statCard:          { backgroundColor: "#f5f5f5", padding: 15, borderRadius: 8, minWidth: 100, alignItems: "center" },
  statValue:         { fontSize: 18, fontWeight: "bold", color: "#FF6B35" },
  statLabel:         { fontSize: 12, color: "#999", marginTop: 4 },
  ctaButton:         { backgroundColor: "#FF6B35", padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 20 },
  ctaText:           { color: "#fff", fontSize: 16, fontWeight: "bold" },
  descBox:           { backgroundColor: "#f9f9f9", padding: 15, borderRadius: 8, marginBottom: 20 },
  descText:          { fontSize: 13, color: "#666", lineHeight: 18 },
  newsletterBox:     { backgroundColor: "#FFF0E6", padding: 15, borderRadius: 10 },
  newsletterTitle:   { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 8 },
  newsletterDesc:    { fontSize: 13, color: "#666", marginBottom: 12, lineHeight: 18 },
  emailBox:          { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: "#ddd" },
  emailPlaceholder:  { color: "#999", fontSize: 14 },
  subscribeBtn:      { backgroundColor: "#FF6B35", padding: 12, borderRadius: 8, alignItems: "center" },
  subscribeBtnText:  { color: "#fff", fontWeight: "bold", fontSize: 14 },
});