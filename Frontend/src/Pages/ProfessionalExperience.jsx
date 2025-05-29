import { Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  section: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  experienceItem: {
    marginBottom: 20,
  },
  // Row styles
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  // Fixed width columns for better alignment
  bulletColumn: {
    width: 20, // Increased width for more space
    alignItems: "center",
  },
  bulletWrapper: {
    paddingTop: 4, // Align with the first line of text
  },
  labelColumn: {
    width: 130,
  },
  valueColumn: {
    flex: 1,
    paddingRight: 10,
  },
  // Square bullet style
  squareBullet: {
    width: 3,
    height: 3,
    backgroundColor: "black",
  },
  // Text styles
  labelText: {
    fontWeight: "bold",
  },
  valueText: {
    fontWeight: "normal",
  },
  // Responsibilities section
  responsibilitiesHeading: {
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 20, // Match bulletColumn width
  },
  responsibilityRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  responsibilityBulletColumn: {
    width: 20, // Match bulletColumn width
    alignItems: "center",
  },
  responsibilityTextColumn: {
    flex: 1,
    paddingRight: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionWrapper: {
    marginTop: 20,
  },
  leftPanelListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  leftPanelSquareBullet: {
    width: 5,
    height: 5,
    backgroundColor: "black",
    marginTop: 5,
    marginRight: 6,
  },
  listItemText: {
    fontSize: 12,
    flex: 1,
  },
});

// Create a wrapper component for bullet rows that ensures they stay together
const BulletRow = ({ label, value }) => (
  <View style={styles.row} wrap={false}>
    <View style={styles.bulletColumn}>
      <View style={styles.bulletWrapper}>
        <View style={styles.squareBullet} />
      </View>
    </View>
    <View style={styles.labelColumn}>
      <Text style={styles.labelText}>{label}:</Text>
    </View>
    <View style={styles.valueColumn}>
      <Text style={styles.valueText}>{value}</Text>
    </View>
  </View>
);

// Create a wrapper component for responsibility items
const ResponsibilityRow = ({ text }) => (
  <View style={styles.responsibilityRow} wrap={false}>
    <View style={styles.responsibilityBulletColumn}>
      <View style={styles.bulletWrapper}>
        <View style={styles.squareBullet} />
      </View>
    </View>
    <View style={styles.responsibilityTextColumn}>
      <Text style={styles.valueText}>{text}</Text>
    </View>
  </View>
);

// Professional Experience Page Component
const ProfessionalExperiencePage = ({ data }) => {
  const experiences = data.experience_data || [];

  // Separate experiences with and without responsibilities
  const experiencesWithResp = experiences.filter(
    (exp) =>
      Array.isArray(exp.responsibilities) &&
      exp.responsibilities.length > 0 &&
      exp.responsibilities !== "Not available"
  );

  const experiencesWithoutResp = experiences.filter(
    (exp) =>
      !Array.isArray(exp.responsibilities) ||
      exp.responsibilities.length === 0 ||
      exp.responsibilities === "Not available"
  );

  // Combine the arrays with experiences that have responsibilities first
  const sortedExperiences = [...experiencesWithResp, ...experiencesWithoutResp];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>Professional Experience</Text>

        {sortedExperiences.map((exp, index) => (
          <View key={`exp-${index}`} style={styles.experienceItem}>
            {/* Company */}
            {exp.company && exp.company !== "Not available" && (
              <BulletRow label="Company" value={exp.company} />
            )}

            {/* Date */}
            {exp.startDate &&
              exp.endDate &&
              exp.startDate !== "Not available" &&
              exp.endDate !== "Not available" && (
                <BulletRow
                  label="Date"
                  value={`${exp.startDate} to ${exp.endDate}`}
                />
              )}

            {/* Role */}
            {exp.role && exp.role !== "Not available" && (
              <BulletRow label="Role" value={exp.role} />
            )}

            {/* Client Engagement */}
            {exp.clientEngagement &&
              exp.clientEngagement !== "Not available" && (
                <BulletRow
                  label="Client Engagement"
                  value={exp.clientEngagement}
                />
              )}

            {/* Program */}
            {exp.program && exp.program !== "Not available" && (
              <BulletRow label="Program" value={exp.program} />
            )}

            {/* Responsibilities */}
            {Array.isArray(exp.responsibilities) &&
              exp.responsibilities.length > 0 && (
                <View>
                  <Text style={styles.responsibilitiesHeading}>
                    RESPONSIBILITIES:
                  </Text>

                  {exp.responsibilities.map(
                    (resp, respIndex) =>
                      resp &&
                      resp !== "Not available" && (
                        <ResponsibilityRow key={respIndex} text={resp} />
                      )
                  )}
                </View>
              )}
          </View>
        ))}

        {sortedExperiences.length === 0 && (
          <Text>No professional experience details available.</Text>
        )}
      </View>
      {data.education && data.education.length > 0 && (
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeading}>Education</Text>
          {data.education.map((edu, index) => (
            <View key={index} style={styles.leftPanelListItem}>
              <View style={styles.leftPanelSquareBullet} />
              <Text style={styles.listItemText}>{edu}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
};

export default ProfessionalExperiencePage;
