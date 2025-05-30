import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

import ProfessionalExperiencePage from "./ProfessionalExperience";

// Font registration
Font.register({
  family: "Helvetica",
  src: "https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0e.ttf",
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#f2f2f2",
    padding: 0,
    minHeight: "90%",
  },
  container: {
    width: "100%",
    margin: "0 auto",
    backgroundColor: "white",
    minHeight: "100%",
  },
  header: {
    flexDirection: "row",
    height: 100,
    backgroundColor: "#000000",
    color: "white",
    padding: 15,
    alignItems: "center", // Vertical center
    justifyContent: "center", // Horizontal center for name
    position: "relative", // Needed for absolute logo
  },
  logoContainer: {
    position: "absolute",
    left: 15,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  logo: {
    width: 30,
    height: 30,
  },
  name: {
    fontSize: 24,
    fontWeight: 900,
    textTransform: "uppercase",
    color: "white",
  },
  columnsContainer: {
    flexDirection: "row",
    width: "100%",
    flex: 1,
  },
  leftPanel: {
    backgroundColor: "#166a6a",
    color: "white",
    paddingTop: 20,
    paddingBottom: 30,
    paddingLeft: 20,
    paddingRight: 15,
    fontSize: 9,
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 20,
    width: "40%",
    minHeight: "80%",
  },
  rightPanel: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingLeft: 15,
    paddingRight: 20,
    fontSize: 9,
    width: "60%",
    marginRight: 20,
    marginTop: 20,
    marginBottom: 20,
    minHeight: "80%",
  },
  // Styles for content that might break across pages
  leftPanelContent: {
    paddingBottom: 20,
  },
  rightPanelContent: {
    paddingBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  h2: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 15,
    position: "relative",
    fontSize: 11,
    lineHeight: 1.15,
  },
  squareBullet: {
    position: "absolute",
    left: 0,
    top: 3.7,
    width: 3,
    height: 3,
    backgroundColor: "black",
    marginRight: 8,
  },
  leftPanelSquareBullet: {
    position: "absolute",
    left: 0,
    top: 3.7,
    width: 3,
    height: 3,
    backgroundColor: "white",
    marginRight: 8,
  },
  listItemText: {
    flex: 1,
    textAlign: "justify",
  },
  leftPanelListItem: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 20,
    position: "relative",
    fontSize: 11,
    lineHeight: 1.15,
  },

  skillLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 11,
    color: "#fff",
  },
  skillText: {
    fontWeight: "normal",
  },
  // Section wrapper to handle page breaks better
  sectionWrapper: {
    marginBottom: 20,
    orphans: 2,
    widows: 2,
  },
  // Professional experience wrapper
  experienceWrapper: {
    break: false, // Prevent breaking in the middle of an experience item
    marginBottom: 5,
  },
});

const ResumePDF = ({ data }) => {
  const ustLogoBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABCCAYAAAAL1LXDAAAAAXNSR0IArs4c6QAAA7JJREFUaEPtW4111DAMliYANmgngE4ANwFlArgJoBPQm4DeBLQTlE5AmYAyAd2AbiDyBfle4vNfciZx3tnv3evrXWLpk+RPsuKwiJyQezwx85Pnt/ZrEXlORPjsDWZ+DN079jeV+YGIXhLRK0s+ZD4Q0R0z3zv1EpHfROQCfc/MqwjgayJ67wHMY0G57lPHfCYigE0ZAL9hZui4G7wEwCICT373RVMEPYCvTMQVD1g9+3MkWGOLHeglAPYtuZSw7l6DdX1eNGAROW/I6TYhZOFB8JCPgEFg70DCpQO+IqKPHsDb5vvLbibR8Aep4R6TPUBcl2aO0gGDqN4MzQIK/CsR3SyKpRvFvWlPmdeZa0NLoHQPfyKiLwEAMAi8mAy8dMBYh38S6BgVIUD/wN+GjVFtOUfRgKFxU0qGiMuHC6xtvN8rcYsHrKBReKDaGjrg+Stm3iyCpbvoRnraTHHNzGv8swgPG621EEGOdaaqiPvh6YsQ4AdmPgtNEkobTRhl3S1Z3kZ4o8B4PTDUVyHAj8x8GgE8qjAYuhAjOoDJ4XGUoTCAr7zENBsARq2Ki10D2ypnjovsYtA8eJEZ2ElKUyGy1u8AOET7yGcAvdf5EBEUBCgMXCPaPBhijGbPjiYD9OwxrmsOEYG3EXluvSIX4Ka2c6CtEwDH+okRx9quYYcAtNYruhy74l/1uHBFnrZ/ANaXwrYtsQS6HmP1PE0Jv4S1ieXmY2TTv/rVlJ/PFKTd47JFrA3glH1nKvjediz1Jvu6hMgbOnVLwrvUEdmZpE4eZfbUiTTyEMoI6RzjDDV2L1ceWM2A4NBVyNqeFRHkW4AOpZuQQcA70KvNNnvFwQgBmHDb7SrkcIdFXAALb8fybPe2Vi9l9l2W8VZDCvytWtZmPUMY2I6hTg027HMaQMtLEBka8aaPBfnmg0iDXt9ceiWXf0r5NCW4nIYycyUD/h/C55izAp7D6lPKrB6e0tpzyKoensPqU8qsHp7S2nPIqh6ew+pTyqwentLac8g6Pg9r72jMo4uQg9Dq6Z2PmsObLpnoS+fsGxkZWfvSOY1VAWeyZvVwJkMePM1RhnToBBu6lb5TNDd6jsJldTw99B4sOdhNB0wQzMORxx1ZHqkM1V0f08aa8l6DLxFw6LBaNC1WwN0QKzSkq4cdPOCtA2pI15D2HxCZKy3VNVzX8L8jxM53rpZIWt634bqe9h29WBzgoaWofX0FXHpaqh4eaIEa0sce0uh4+N79w2E0HOld1PgLGa5FbiKSBQEAAAAASUVORK5CYII=";

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image src={ustLogoBase64} style={styles.logo} />
            </View>
            <Text style={styles.name}>{data.name}</Text>
          </View>

          {/* CONTENT: two-column layout */}
          <View style={styles.columnsContainer}>
            {/* Left Column */}
            <View style={styles.leftPanel}>
              <View style={styles.leftPanelContent}>
                {/* Skills */}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                  <View style={styles.sectionWrapper}>
                    <Text style={styles.sectionHeading}>
                      Technical Expertise
                    </Text>
                    {data.skills.map((group, i) => {
                      const [category, skills] = Object.entries(group)[0];
                      return (
                        <View key={i} style={styles.skillContainer}>
                          <View style={styles.leftPanelListItem}>
                            <View style={styles.leftPanelSquareBullet} />
                            <Text style={styles.skillLine}>
                              <Text>{category}: </Text>
                              <Text style={styles.skillText}>
                                {skills.join(", ")}
                              </Text>
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Certifications */}
                {Array.isArray(data.certifications) &&
                  data.certifications.length > 0 &&
                  !data.certifications.includes("Not available") && (
                    <View style={styles.sectionWrapper}>
                      <Text style={styles.sectionHeading}>Certifications</Text>
                      {data.certifications.map((certificate, i) => (
                        <View key={i} style={styles.leftPanelListItem}>
                          <View style={styles.leftPanelSquareBullet} />
                          <Text style={styles.listItemText}>{certificate}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                {/* Summary */}
                {data.summary && data.summary !== "Not available" && (
                  <View style={styles.sectionWrapper}>
                    <Text style={styles.sectionHeading}>Summary</Text>
                    <View style={styles.leftPanelListItem}>
                      <View style={styles.leftPanelSquareBullet} />
                      <Text style={styles.listItemText}>{data.summary}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.rightPanel}>
              <View style={styles.rightPanelContent}>
                <Text style={styles.h2}>Professional Experience</Text>
                {Array.isArray(data.professional_experience) &&
                  data.professional_experience.map((exp, i) => (
                    <View key={i} style={styles.experienceWrapper}>
                      <View style={styles.listItem}>
                        <View style={styles.squareBullet} />
                        <Text style={styles.listItemText}>{exp}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* Optional: Add additional custom pages (e.g., ProfessionalExperiencePage) */}
      <ProfessionalExperiencePage data={data} />
    </Document>
  );
};

export default ResumePDF;
