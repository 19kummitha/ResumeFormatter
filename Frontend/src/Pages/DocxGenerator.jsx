import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  SectionType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  BorderStyle,
  ImageRun,
  TabStopType,
} from "docx";
import { saveAs } from "file-saver";

// Updated trueBulletParagraph function to accept a custom font size for valueText
export const trueBulletParagraph = (labelText, valueText, options = {}) => {
  const bulletColor = options.bulletColor || "000000";
  const labelColor = options.labelColor || bulletColor;
  const valueColor = options.valueColor || bulletColor;

  const labelBold = options.labelBold !== undefined ? options.labelBold : false;
  const valueBold = options.valueBold !== undefined ? options.valueBold : false;
  const alignment = options.alignment || AlignmentType.LEFT;
  const lineSpacing = options.lineSpacing || 240;
  const valueFontSize = options.valueFontSize || 20; // Default to 20 half-points (10 points)

  return new Paragraph({
    spacing: { after: 120, line: lineSpacing },
    indent: { left: 400, hanging: 200 },
    alignment: alignment,
    tabStops: [{ type: TabStopType.LEFT, position: 400 }],
    children: [
      new TextRun({
        text: "▪\t",
        font: "Arial",
        size: 20, // Bullet font size remains 20 half-points (10 points)
        color: bulletColor,
      }),
      new TextRun({
        text: labelText,
        bold: labelBold,
        font: "Arial",
        size: 20, // Label font size remains 20 half-points (10 points)
        color: labelColor,
      }),
      new TextRun({
        text: valueText,
        bold: valueBold,
        font: "Arial",
        size: valueFontSize, // Use the custom font size for valueText
        color: valueColor,
      }),
    ],
  });
};

export const generateResumeDocx = async (data) => {
  const doc = new Document({
    sections: createStyledSections(data),
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `${data.name || "resume"}.docx`);
};

const createStyledSections = (data) => {
  const leftContent = [];
  const rightContent = [];

  // === LEFT CONTENT === (Education removed from here)
  if (Array.isArray(data.skills) && data.skills.length > 0) {
    leftContent.push(createSectionHeading("Technical Expertise", "FFFFFF"));
    data.skills.forEach((skillGroup) => {
      const [category, items] = Object.entries(skillGroup)[0];
      leftContent.push(
        trueBulletParagraph(
          `${category}: `,
          Array.isArray(items) ? items.join(", ") : items,
          {
            bulletColor: "FFFFFF",
            labelColor: "FFFFFF",
            valueColor: "FFFFFF",
            labelBold: true,
            lineSpacing: 276,
            valueFontSize: 18, // Set font size to 9 points (18 half-points)
          }
        )
      );
    });
  }

  if (Array.isArray(data.certifications) && data.certifications.length > 0) {
    leftContent.push(createSectionHeading("Certifications", "FFFFFF"));
    data.certifications.forEach((cert) => {
      leftContent.push(
        trueBulletParagraph("", cert, {
          bulletColor: "FFFFFF",
          valueColor: "FFFFFF",
          lineSpacing: 276,
          valueFontSize: 18, // Set font size to 9 points (18 half-points)
        })
      );
    });
  }

  // === RIGHT CONTENT ===
  if (
    Array.isArray(data.professional_experience) &&
    data.professional_experience.length > 0
  ) {
    rightContent.push(
      createSectionHeading("Professional Experience", "000000")
    );
    data.professional_experience.forEach((item) => {
      rightContent.push(
        trueBulletParagraph("", item, {
          bulletColor: "000000",
          valueColor: "000000",
          lineSpacing: 480,
          alignment: AlignmentType.JUSTIFIED,
          // No valueFontSize specified, so it defaults to 20 half-points (10 points)
        })
      );
    });
  }

  if (Array.isArray(data.projects) && data.projects.length > 0) {
    rightContent.push(createSectionHeading("Projects", "000000"));
    data.projects.forEach((project) => {
      rightContent.push(
        trueBulletParagraph("", project, {
          bulletColor: "000000",
          valueColor: "000000",
          lineSpacing: 480,
          alignment: AlignmentType.JUSTIFIED,
          // No valueFontSize specified, so it defaults to 20 half-points (10 points)
        })
      );
    });
  }

  const ustLogoBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABCCAYAAAAL1LXDAAAAAXNSR0IArs4c6QAAA7JJREFUaEPtW4111DAMliYANmgngE4ANwFlArgJoBPQm4DeBLQTlE5AmYAyAd2AbiDyBfle4vNfciZx3tnv3evrXWLpk+RPsuKwiJyQezwx85Pnt/ZrEXlORPjsDWZ+DN079jeV+YGIXhLRK0s+ZD4Q0R0z3zv1EpHfROQCfc/MqwjgayJ67wHMY0G57lPHfCYigE0ZAL9hZui4G7wEwCICT373RVMEPYCvTMQVD1g9+3MkWGOLHeglAPYtuZSw7l6DdX1eNGAROW/I6TYhZOFB8JCPgEFg70DCpQO+IqKPHsDb5vvLbibR8Aep4R6TPUBcl2aO0gGDqN4MzQIK/CsR3SyKpRvFvWlPmdeZa0NLoHQPfyKiLwEAMAi8mAy8dMBYh38S6BgVIUD/wN+GjVFtOUfRgKFxU0qGiMuHC6xtvN8rcYsHrKBReKDaGjrg+Stm3iyCpbvoRnraTHHNzGv8swgPG621EEGOdaaqiPvh6YsQ4AdmPgtNEkobTRhl3S1Z3kZ4o8B4PTDUVyHAj8x8GgE8qjAYuhAjOoDJ4XGUoTCAr7zENBsARq2Ki10D2ypnjovsYtA8eJEZ2ElKUyGy1u8AOET7yGcAvdf5EBEUBCgMXCPaPBhijGbPjiYD9OwxrmsOEYG3EXluvSIX4Ka2c6CtEwDH+okRx9quYYcAtNYruhy74l/1uHBFnrZ/ANaXwrYtsQS6HmP1PE0Jv4S1ieXmY2TTv/rVlJ/PFKTd47JFrA3glH1nKvjediz1Jvu6hMgbOnVLwrvUEdmZpE4eZfbUiTTyEMoI6RzjDDV2L1ceWM2A4NBVyNqeFRHkW4AOpZuQQcA70KvNNnvFwQgBmHDb7SrkcIdFXAALb8fybPe2Vi9l9l2W8VZDCvytWtZmPUMY2I6hTg027HMaQMtLEBka8aaPBfnmg0iDXt9ceiWXf0r5NCW4nIYycyUD/h/C55izAp7D6lPKrB6e0tpzyKoensPqU8qsHp7S2nPIqh6ew+pTyqwentLac8g6Pg9r72jMo4uQg9Dq6Z2PmsObLpnoS+fsGxkZWfvSOY1VAWeyZvVwJkMePM1RhnToBBu6lb5TNDd6jsJldTw99B4sOdhNB0wQzMORxx1ZHqkM1V0f08aa8l6DLxFw6LBaNC1WwN0QKzSkq4cdPOCtA2pI15D2HxCZKy3VNVzX8L8jxM53rpZIWt634bqe9h29WBzgoaWofX0FXHpaqh4eaIEa0sce0uh4+N79w2E0HOld1PgLGa5FbiKSBQEAAAAASUVORK5CYII=";

  const base64String = ustLogoBase64.split(",")[1];

  function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const imageBytes = base64ToUint8Array(base64String);

  const headerTable = new Table({
    rows: [
      new TableRow({
        children: [
          // Logo cell - left side
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBytes,
                    transformation: {
                      width: 40,
                      height: 40,
                    },
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "000000" },
            width: { size: 15, type: WidthType.PERCENTAGE },
            margins: { top: 300, bottom: 300, left: 300, right: 0 },
          }),
          // Name cell - right side
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: data.name ? data.name.toUpperCase() : "YOUR NAME",
                    bold: true,
                    color: "FFFFFF",
                    size: 44,
                    font: "Arial",
                  }),
                ],
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "000000" },
            width: { size: 85, type: WidthType.PERCENTAGE },
            margins: { top: 300, bottom: 300, left: 1200, right: 300 },
          }),
        ],
        height: { value: 1700, rule: "exact" },
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
  });

  const contentTable = new Table({
    rows: [
      new TableRow({
        children: [
          // LEFT SPACER COLUMN (acts as margin)
          new TableCell({
            width: { size: 5, type: WidthType.PERCENTAGE },
            children: [new Paragraph("")],
            borders: {
              top: BorderStyle.NONE,
              bottom: BorderStyle.NONE,
              left: BorderStyle.NONE,
              right: BorderStyle.NONE,
            },
          }),
          // ACTUAL LEFT CONTENT
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: "166a6a" },
            children: leftContent,
            margins: {
              left: 300,
              right: 150,
            },
            borders: {
              top: BorderStyle.NONE,
              bottom: BorderStyle.NONE,
              left: BorderStyle.NONE,
              right: BorderStyle.NONE,
            },
          }),
          // RIGHT CONTENT
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: rightContent,
            margins: {
              top: 300,
              bottom: 1200,
              left: 300,
              right: 300,
            },
            borders: {
              top: BorderStyle.NONE,
              bottom: BorderStyle.NONE,
              left: BorderStyle.NONE,
              right: BorderStyle.NONE,
            },
          }),
          new TableCell({
            width: { size: 5, type: WidthType.PERCENTAGE },
            children: [new Paragraph("")],
            borders: {
              top: BorderStyle.NONE,
              bottom: BorderStyle.NONE,
              left: BorderStyle.NONE,
              right: BorderStyle.NONE,
            },
          }),
        ],
        height: { value: 12000, rule: "exact" },
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
  });

  const experienceDetail = [];

  if (Array.isArray(data.experience_data) && data.experience_data.length > 0) {
    experienceDetail.push(
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: "Professional Experience",
            bold: true,
            size: 32,
            font: "Arial",
            color: "000000",
          }),
        ],
      })
    );

    const isInvalid = (resps) =>
      !Array.isArray(resps) || resps.length === 0 || resps === "Not available";

    const sortedExperiences = data.experience_data.slice().sort((a, b) => {
      return isInvalid(a.responsibilities) - isInvalid(b.responsibilities);
    });

    sortedExperiences.forEach((exp) => {
      experienceDetail.push(
        trueBulletParagraph("Company: ", exp.company, {
          bulletColor: "000000",
          labelColor: "000000",
          valueColor: "000000",
          labelBold: true,
          lineSpacing: 276,
          alignment: AlignmentType.JUSTIFIED,
        })
      );

      if (!(exp.role === "Not available")) {
        experienceDetail.push(
          trueBulletParagraph("Role: ", exp.role, {
            bulletColor: "000000",
            labelColor: "000000",
            valueColor: "000000",
            labelBold: true,
            lineSpacing: 276,
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }

      if (exp.startDate || exp.endDate) {
        experienceDetail.push(
          trueBulletParagraph(
            "Duration: ",
            `${exp.startDate || ""} - ${exp.endDate || ""}`.trim(),
            {
              bulletColor: "000000",
              labelColor: "000000",
              valueColor: "000000",
              labelBold: true,
              lineSpacing: 276,
              alignment: AlignmentType.JUSTIFIED,
            }
          )
        );
      }

      if (!(exp.clientEngagement === "Not available")) {
        experienceDetail.push(
          trueBulletParagraph("Client Engagement: ", exp.clientEngagement, {
            bulletColor: "000000",
            labelColor: "000000",
            valueColor: "000000",
            labelBold: true,
            lineSpacing: 276,
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }

      if (!(exp.program === "Not available")) {
        experienceDetail.push(
          trueBulletParagraph("Program: ", exp.program, {
            bulletColor: "000000",
            labelColor: "000000",
            valueColor: "000000",
            labelBold: true,
            lineSpacing: 276,
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }

      if (
        Array.isArray(exp.responsibilities) &&
        exp.responsibilities.length > 0
      ) {
        experienceDetail.push(
          trueBulletParagraph("Responsibilities:", "", {
            bulletColor: "000000",
            labelColor: "000000",
            valueColor: "000000",
            labelBold: true,
            lineSpacing: 276,
            alignment: AlignmentType.JUSTIFIED,
          })
        );

        exp.responsibilities.forEach((res) => {
          if (res?.trim()) {
            experienceDetail.push(
              trueBulletParagraph("", res, {
                bulletColor: "000000",
                valueColor: "000000",
                lineSpacing: 276,
                alignment: AlignmentType.JUSTIFIED,
              })
            );
          }
        });
      }

      experienceDetail.push(new Paragraph(""));
    });
  }

  // === EDUCATION SECTION MOVED HERE (after experience_data) ===
  if (Array.isArray(data.education) && data.education.length > 0) {
    experienceDetail.push(
      new Paragraph({
        spacing: { after: 300, before: 600 },
        children: [
          new TextRun({
            text: "Education",
            bold: true,
            size: 32,
            font: "Arial",
            color: "000000",
          }),
        ],
      })
    );

    data.education.forEach((edu) => {
      experienceDetail.push(
        trueBulletParagraph("", edu, {
          bulletColor: "000000",
          valueColor: "000000",
          lineSpacing: 276,
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    });
  }

  return [
    {
      properties: {
        page: {
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: [headerTable, new Paragraph({})],
    },
    {
      properties: {
        type: SectionType.CONTINUOUS,
        page: {
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: [contentTable],
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: experienceDetail,
    },
  ];
};

const createSectionHeading = (title, color = "000000") =>
  new Paragraph({
    spacing: { after: 150, before: 300 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        color: color,
        size: 28,
        font: "Arial",
      }),
    ],
  });
