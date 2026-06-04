import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking
} from "react-native";

export default function Footer() {
  const sections = [
    {
      title: "BESOIN D'AIDE?",
      links: [
        { label: "Discuter avec nous", action: () => Linking.openURL("tel:+22520200616161") },
        { label: "Aide & FAQ", action: () => {} },
        { label: "Contactez-nous", action: () => Linking.openURL("mailto:support@Kaviroq.ci") },
      ]
    },
    {
      title: "À PROPOS",
      links: [
        { label: "Qui sommes-nous", action: () => {} },
        { label: "Carrières chez Kaviroq", action: () => {} },
        { label: "Conditions d'utilisation", action: () => {} },
        { label: "Kaviroq Express", action: () => {} },
      ]
    },
    {
      title: "GAGNEZ DE L'ARGENT",
      links: [
        { label: "Vendre sur Kaviroq", action: () => {} },
        { label: "Espace vendeur", action: () => {} },
        { label: "Devenez Consultant Kaviroq", action: () => {} },
      ]
    },
  ];

  const countries = ["Côte d'Ivoire", "Sénégal", "Ghana", "Mali", "Burkina Faso"];
  const paymentMethods = ["Orange Money", "Wave", "MTN Money", "Virement bancaire"];

  return (
    <View style={styles.footer}>

      {/* Sections principales */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionsContainer}
      >
        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.links.map((link, i) => (
              <TouchableOpacity key={i} onPress={link.action}>
                <Text style={styles.sectionLink}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.divider} />

      {/* Pays */}
      <View style={styles.countriesSection}>
        <Text style={styles.subTitle}>Kaviroq À L'INTERNATIONAL</Text>
        <View style={styles.countriesGrid}>
          {countries.map((country, idx) => (
            <TouchableOpacity key={idx} style={styles.countryBtn}>
              <Text style={styles.countryText}>{country}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Moyens de paiement */}
      <View style={styles.paymentSection}>
        <Text style={styles.subTitle}>MODES DE PAIEMENT</Text>
        <View style={styles.paymentGrid}>
          {paymentMethods.map((method, idx) => (
            <View key={idx} style={styles.paymentBadge}>
              <Text style={styles.paymentText}>{method}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Réseaux sociaux */}
      <View style={styles.socialSection}>
        <Text style={styles.subTitle}>SUIVEZ-NOUS</Text>
        <View style={styles.socialIcons}>
          <TouchableOpacity onPress={() => Linking.openURL("https://facebook.com")}>
            <Text style={styles.socialIcon}>f</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://instagram.com")}>
            <Text style={styles.socialIcon}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://twitter.com")}>
            <Text style={styles.socialIcon}>𝕏</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://youtube.com")}>
            <Text style={styles.socialIcon}>▶️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://linkedin.com")}>
            <Text style={styles.socialIcon}>in</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Infos légales */}
      <View style={styles.legalSection}>
        <Text style={styles.companyName}>Kaviroq - Livraison Express</Text>
        <Text style={styles.companyInfo}>
          Siège : Abidjan, Cocody • Tél : +225 20 20 00 61 61
        </Text>
        <Text style={styles.footerCopy}>
          © 2024 Kaviroq. Tous droits réservés.
        </Text>
        <TouchableOpacity>
          <Text style={styles.legalLink}>Politique de confidentialité</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  footer:              { backgroundColor: "#2a2a2a", padding: 20 },
  sectionsContainer:   { paddingVertical: 10 },
  section:             { marginRight: 30, minWidth: 140 },
  sectionTitle:        { fontSize: 12, fontWeight: "bold", color: "#fff", marginBottom: 10, letterSpacing: 0.5 },
  sectionLink:         { fontSize: 13, color: "#bbb", marginBottom: 6, lineHeight: 18 },
  divider:             { height: 1, backgroundColor: "#444", marginVertical: 15 },
  countriesSection:    { marginBottom: 10 },
  subTitle:            { fontSize: 12, fontWeight: "bold", color: "#fff", marginBottom: 10, letterSpacing: 0.5 },
  countriesGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  countryBtn:          { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#333", borderRadius: 6 },
  countryText:         { fontSize: 13, color: "#999" },
  paymentSection:      { marginBottom: 10 },
  paymentGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  paymentBadge:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#333", borderRadius: 6 },
  paymentText:         { fontSize: 12, color: "#999" },
  socialSection:       { marginBottom: 10 },
  socialIcons:         { flexDirection: "row", gap: 15, marginTop: 8 },
  socialIcon:          { fontSize: 18, color: "#FF6B35" },
  legalSection:        { alignItems: "center", gap: 6 },
  companyName:         { fontSize: 14, fontWeight: "bold", color: "#fff" },
  companyInfo:         { fontSize: 11, color: "#999" },
  footerCopy:          { fontSize: 11, color: "#666", marginVertical: 8 },
  legalLink:           { fontSize: 11, color: "#FF6B35", textDecorationLine: "underline" },
});