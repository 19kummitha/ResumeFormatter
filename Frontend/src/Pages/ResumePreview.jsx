import React from "react";
import ReactPDF, { Image } from "@react-pdf/renderer";
import ProfessionalExperiencePage from "./ProfessionalExperience";

const { Document, Page, Text, View, StyleSheet, Font } = ReactPDF;

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
  },
  container: {
    width: "100%",
    margin: "0 auto",
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    height: 100,
    backgroundColor: "#000000",
    color: "white",
    padding: 20,
    alignItems: "center",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logo: {
    width: 60,
    height: 60,
  },
  name: {
    fontSize: 24,
    fontWeight: 900,
    margin: 40,
    textTransform: "uppercase",
  },
  content: {
    flexDirection: "row",
    margin: 20,
  },
  leftPanel: {
    backgroundColor: "#166a6a",
    color: "white",
    padding: 20,
    width: "42%",
    height: 700,
    fontSize: 9,
  },
  rightPanel: {
    padding: 20,
    width: "65%",
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
  paragraph: {
    marginBottom: 10,
    fontSize: 11,
    lineHeight: 1.4,
    textAlign: "justify",
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 15,
    position: "relative",
    fontSize: 11,
    lineHeight: 1.4,
  },
  bullet: {
    position: "absolute",
    left: 0,
    marginRight: 5,
  },
  squareBullet: {
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
    marginBottom: 1,
    paddingLeft: 20,
    position: "relative",
    fontSize: 11,
    lineHeight: 1.4,
  },
  bold: {
    fontWeight: "bold",
  },
  skillContainer: {
    marginBottom: 6,
  },
  skillLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 11,
    color: "#fff",
  },
  skillCategory: {},
  skillText: {
    fontWeight: "normal",
  },
});

// Page layout wrapper
const PageLayout = ({ children }) => (
  <View style={styles.container}>{children}</View>
);

const ResumePDF = ({ data }) => {
  const projects =
    data?.projects &&
    data.projects !== "Not available" &&
    Array.isArray(data.projects) &&
    !data.projects.includes("Not available")
      ? data.projects
      : [];

  const experienceChunks = chunkArray(data?.professional_experience || [], 10);
  const projectChunks = chunkArray(projects, 10);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageLayout>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image src={"../src/assets/logo.jpg"} style={styles.logo} />
            </View>
            <Text style={styles.name}>{data.name}</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.leftPanel}>
              <View style={{ marginBottom: 15 }}>
                <Text style={styles.sectionHeading}>Education</Text>
                {Array.isArray(data.education) &&
                data.education.length > 0 &&
                data.education[0] !== "Not available" ? (
                  <View style={styles.leftPanelListItem}>
                    <View style={styles.squareBullet} />
                    <Text style={styles.listItemText}>{data.education[0]}</Text>
                  </View>
                ) : null}
              </View>

              <View style={{ marginBottom: 5 }}>
                <Text style={styles.sectionHeading}>Technical Expertise</Text>
                {Array.isArray(data.skills) &&
                data.skills.length > 0 &&
                data.skills[0] !== "Not available"
                  ? data.skills.map((group, i) => {
                      const [category, skills] = Object.entries(group)[0];
                      return (
                        <View key={i} style={styles.skillContainer}>
                          <View style={styles.leftPanelListItem}>
                            <View style={styles.squareBullet} />
                            <Text style={styles.skillLine}>
                              <Text style={styles.skillCategory}>
                                {category}:{" "}
                              </Text>
                              <Text style={styles.skillText}>
                                {skills.join(", ")}
                              </Text>
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  : null}
              </View>

              {Array.isArray(data.certifications) &&
                data.certifications.length > 0 &&
                !data.certifications.includes("Not available") && (
                  <View style={{ marginBottom: 5 }}>
                    <Text style={styles.sectionHeading}>Certifications</Text>
                    {data.certifications.map((certificate, i) => (
                      <View key={i} style={styles.leftPanelListItem}>
                        <View style={styles.squareBullet} />
                        <Text style={styles.listItemText}>{certificate}</Text>
                      </View>
                    ))}
                  </View>
                )}

              {data.summary && data.summary !== "Not available" && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={styles.sectionHeading}>Summary</Text>
                  <View style={styles.leftPanelListItem}>
                    <View style={styles.squareBullet} />
                    <Text style={styles.listItemText}>{data.summary}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.rightPanel}>
              <Text style={styles.h2}>Professional Experience</Text>
              {experienceChunks[0]?.map((exp, i) => (
                <View key={i} style={styles.listItem}>
                  <View
                    style={{ ...styles.squareBullet, backgroundColor: "black" }}
                  />
                  <Text style={styles.listItemText}>{exp}</Text>
                </View>
              ))}

              {projectChunks[0] && projectChunks[0].length > 0 && (
                <View>
                  <Text style={{ ...styles.h2, marginTop: 15 }}>Projects</Text>
                  {projectChunks[0].map((project, i) => (
                    <View key={i} style={styles.listItem}>
                      <View
                        style={{
                          ...styles.squareBullet,
                          backgroundColor: "black",
                        }}
                      />
                      <Text style={styles.listItemText}>{project}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </PageLayout>
      </Page>

      <ProfessionalExperiencePage data={data} />

      {experienceChunks.length > 1 || projectChunks.length > 1
        ? renderAdditionalPages(experienceChunks, projectChunks)
        : null}
    </Document>
  );
};

function chunkArray(array, size) {
  if (
    !array ||
    array === "Not available" ||
    (Array.isArray(array) &&
      (array.length === 0 || array.includes("Not available")))
  ) {
    return [[]];
  }

  const arr = typeof array === "string" ? [array] : array;
  const chunked = [];
  for (let i = 0; i < arr.length; i += size) {
    chunked.push(arr.slice(i, i + size));
  }
  return chunked;
}

function renderAdditionalPages(experienceChunks, projectChunks) {
  const pages = [];

  for (
    let pageIndex = 1;
    pageIndex < Math.max(experienceChunks.length, projectChunks.length);
    pageIndex++
  ) {
    pages.push(
      <Page key={`page-${pageIndex + 1}`} size="A4" style={styles.page}>
        <PageLayout>
          <View style={{ ...styles.content, margin: 20 }}>
            <View style={styles.leftPanel}>
              <View style={{ marginBottom: 15 }}>
                <Text style={styles.sectionHeading}>Continued</Text>
                <View style={styles.leftPanelListItem}>
                  <View style={styles.squareBullet} />
                  <Text style={styles.paragraph}>Page {pageIndex + 1}</Text>
                </View>
              </View>
            </View>

            <View style={styles.rightPanel}>
              {pageIndex < experienceChunks.length &&
                experienceChunks[pageIndex].map((exp, i) => (
                  <View key={i} style={styles.listItem}>
                    <View
                      style={{
                        ...styles.squareBullet,
                        backgroundColor: "black",
                      }}
                    />
                    <Text style={styles.listItemText}>{exp}</Text>
                  </View>
                ))}

              {pageIndex < projectChunks.length &&
                projectChunks[pageIndex].map((project, i) => (
                  <View key={i} style={styles.listItem}>
                    <View
                      style={{
                        ...styles.squareBullet,
                        backgroundColor: "black",
                      }}
                    />
                    <Text style={styles.listItemText}>{project}</Text>
                  </View>
                ))}
            </View>
          </View>
        </PageLayout>
      </Page>
    );
  }

  return pages;
}

export default ResumePDF;
