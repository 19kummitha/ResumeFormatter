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
} from "docx";
import { saveAs } from "file-saver";

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

  // === LEFT CONTENT ===
  if (Array.isArray(data.education) && data.education.length > 0) {
    leftContent.push(createSectionHeading("Education", "FFFFFF"));
    data.education.forEach((edu) => {
      leftContent.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360 }, // 1.5 line spacing
          indent: {
            left: 360, // indent whole paragraph
            hanging: 240, // aligns second line under text, not bullet
            right: 360,
          },
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              color: "FFFFFF",
              font: "Arial",
            }),
            new TextRun({
              text: edu,
              color: "FFFFFF",
              font: "Arial",
            }),
          ],
        })
      );
    });
  }

  if (Array.isArray(data.skills) && data.skills.length > 0) {
    leftContent.push(createSectionHeading("Technical Expertise", "FFFFFF"));
    data.skills.forEach((skillGroup) => {
      const [category, items] = Object.entries(skillGroup)[0];
      leftContent.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360 }, // 1.5 line spacing
          indent: {
            left: 360, // overall left indent
            hanging: 240, // aligns second+ lines under first text, not bullet
            right: 360,
          },
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              color: "FFFFFF",
              font: "Arial",
            }),
            new TextRun({
              text: `${category}: `,
              bold: true,
              color: "FFFFFF",
              font: "Arial",
            }),
            new TextRun({
              text: Array.isArray(items) ? items.join(", ") : items,
              color: "FFFFFF",
              font: "Arial",
            }),
          ],
        })
      );
    });
  }

  if (Array.isArray(data.certifications) && data.certifications.length > 0) {
    leftContent.push(createSectionHeading("Certifications", "FFFFFF"));
    data.certifications.forEach((cert) => {
      leftContent.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360 }, // 1.5 line spacing
          indent: {
            left: 360, // overall left indent
            hanging: 240, // aligns second+ lines under first text, not bullet
            right: 360,
          },
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              color: "FFFFFF",
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({ text: `${cert}`, color: "FFFFFF", font: "Arial" }),
          ],
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
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 480 }, // 1.5 line spacing
          indent: {
            left: 360, // overall left indent
            hanging: 240, // aligns second+ lines under first text, not bullet
            right: 360,
          },
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({ text: item, font: "Arial" }),
          ],
        })
      );
    });
  }

  if (Array.isArray(data.projects) && data.projects.length > 0) {
    rightContent.push(createSectionHeading("Projects", "000000"));
    data.projects.forEach((project) => {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({ text: project, font: "Arial" }),
          ],
          indent: { left: 360 },
        })
      );
    });
  }
  // 1. Original Base64 with prefix
  const ustLogoBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABCCAYAAAAL1LXDAAAAAXNSR0IArs4c6QAAA7JJREFUaEPtW4111DAMliYANmgngE4ANwFlArgJoBPQm4DeBLQTlE5AmYAyAd2AbiDyBfle4vNfciZx3tnv3evrXWLpk+RPsuKwiJyQezwx85Pnt/ZrEXlORPjsDWZ+DN079jeV+YGIXhLRK0s+ZD4Q0R0z3zv1EpHfROQCfc/MqwjgayJ67wHMY0G57lPHfCYigE0ZAL9hZui4G7wEwCICT373RVMEPYCvTMQVD1g9+3MkWGOLHeglAPYtuZSw7l6DdX1eNGAROW/I6TYhZOFB8JCPgEFg70DCpQO+IqKPHsDb5vvLbibR8Aep4R6TPUBcl2aO0gGDqN4MzQIK/CsR3SyKpRvFvWlPmdeZa0NLoHQPfyKiLwEAMAi8mAy8dMBYh38S6BgVIUD/wN+GjVFtOUfRgKFxU0qGiMuHC6xtvN8rcYsHrKBReKDaGjrg+Stm3iyCpbvoRnraTHHNzGv8swgPG621EEGOdaaqiPvh6YsQ4AdmPgtNEkobTRhl3S1Z3kZ4o8B4PTDUVyHAj8x8GgE8qjAYuhAjOoDJ4XGUoTCAr7zENBsARq2Ki10D2ypnjovsYtA8eJEZ2ElKUyGy1u8AOET7yGcAvdf5EBEUBCgMXCPaPBhijGbPjiYD9OwxrmsOEYG3EXluvSIX4Ka2c6CtEwDH+okRx9quYYcAtNYruhy74l/1uHBFnrZ/ANaXwrYtsQS6HmP1PE0Jv4S1ieXmY2TTv/rVlJ/PFKTd47JFrA3glH1nKvjediz1Jvu6hMgbOnVLwrvUEdmZpE4eZfbUiTTyEMoI6RzjDDV2L1ceWM2A4NBVyNqeFRHkW4AOpZuQQcA70KvNNnvFwQgBmHDb7SrkcIdFXAALb8fybPe2Vi9l9l2W8VZDCvytWtZmPUMY2I6hTg027HMaQMtLEBka8aaPBfnmg0iDXt9ceiWXf0r5NCW4nIYycyUD/h/C55izAp7D6lPKrB6e0tpzyKoensPqU8qsHp7S2nPIqh6ew+pTyqwentLac8g6Pg9r72jMo4uQg9Dq6Z2PmsObLpnoS+fsGxkZWfvSOY1VAWeyZvVwJkMePM1RhnToBBu6lb5TNDd6jsJldTw99B4sOdhNB0wQzMORxx1ZHqkM1V0f08aa8l6DLxFw6LBaNC1WwN0QKzSkq4cdPOCtA2pI15D2HxCZKy3VNVzX8L8jxM53rpZIWt634bqe9h29WBzgoaWofX0FXHpaqh4eaIEa0sce0uh4+N79w2E0HOld1PgLGa5FbiKSBQEAAAAASUVORK5CYII=";

  // 2. Extract raw base64 (remove prefix)
  const base64String = ustLogoBase64.split(",")[1];

  // 3. Convert base64 to Uint8Array
  function base64ToUint8Array(base64) {
    const binaryString = atob(base64); // works in browser
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const imageBytes = base64ToUint8Array(base64String);

  // 4. Now define your header table
  const headerTable = new Table({
    rows: [
      // Row 1: Logo (top-left)
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new ImageRun({
                    data: imageBytes,
                    transformation: {
                      width: 60,
                      height: 60,
                    },
                  }),
                ],
                spacing: { before: 100, after: 100 },
              }),
            ],
            verticalAlign: VerticalAlign.TOP,
            shading: { fill: "000000" },
            borders: {
              top: BorderStyle.NONE,
              bottom: BorderStyle.NONE,
              left: BorderStyle.NONE,
              right: BorderStyle.NONE,
            },
          }),
        ],
        height: { value: 1200, rule: "exact" },
      }),

      // Row 2: Name (centered)
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: data.name || "Your Name",
                    bold: true,
                    color: "FFFFFF",
                    size: 48,
                    font: "Arial",
                  }),
                ],
                spacing: { before: 100, after: 300 },
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "000000" },
            borders: {
              top: BorderStyle.NONE,
              bottom: BorderStyle.NONE,
              left: BorderStyle.NONE,
              right: BorderStyle.NONE,
            },
          }),
        ],
        height: { value: 1000, rule: "exact" },
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BorderStyle.NONE,
      bottom: BorderStyle.NONE,
      left: BorderStyle.NONE,
      right: BorderStyle.NONE,
      insideHorizontal: BorderStyle.NONE,
      insideVertical: BorderStyle.NONE,
    },
  });

  // === TWO-COLUMN CONTENT TABLE ===
  const contentTable = new Table({
    rows: [
      new TableRow({
        children: [
          // LEFT SPACER COLUMN (acts as margin)
          new TableCell({
            width: { size: 5, type: WidthType.PERCENTAGE }, // 5% spacer
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
            borders: {
              top: BorderStyle.NONE,
              bottom: BorderStyle.NONE,
              left: BorderStyle.NONE,
              right: BorderStyle.NONE,
            },
          }),
          // RIGHT CONTENT
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
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
            width: { size: 5, type: WidthType.PERCENTAGE }, // 5% spacer
            children: [new Paragraph("")],
            borders: {
              top: BorderStyle.NONE,
              bottom: BorderStyle.NONE,
              left: BorderStyle.NONE,
              right: BorderStyle.NONE,
            },
          }),
        ],
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

    // Sort experience_data
    const isInvalid = (resps) =>
      !Array.isArray(resps) || resps.length === 0 || resps === "Not available";

    const sortedExperiences = data.experience_data.slice().sort((a, b) => {
      return isInvalid(a.responsibilities) - isInvalid(b.responsibilities);
    });

    sortedExperiences.forEach((exp) => {
      experienceDetail.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({ text: "Company: ", bold: true, font: "Arial" }),
            new TextRun({ text: exp.company, font: "Arial" }),
          ],
        })
      );

      if (!(exp.role === "Not available")) {
        experienceDetail.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "▪ ",
                bold: true,
                spacing: { after: 400 },
                font: "Arial",
              }),
              new TextRun({ text: "Role: ", bold: true, font: "Arial" }),
              new TextRun({ text: exp.role, font: "Arial" }),
            ],
          })
        );
      }

      if (exp.startDate || exp.endDate) {
        experienceDetail.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "▪ ",
                bold: true,
                spacing: { after: 400 },
                font: "Arial",
              }),
              new TextRun({ text: "Duration: ", bold: true, font: "Arial" }),
              new TextRun({
                text: `${exp.startDate || ""} - ${exp.endDate || ""}`.trim(),
                font: "Arial",
              }),
            ],
          })
        );
      }

      if (!(exp.clientEngagement === "Not available")) {
        experienceDetail.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "▪ ",
                bold: true,
                spacing: { after: 400 },
                font: "Arial",
              }),
              new TextRun({
                text: "Client Engagement: ",
                bold: true,
                font: "Arial",
              }),
              new TextRun({ text: exp.clientEngagement, font: "Arial" }),
            ],
          })
        );
      }

      if (!(exp.program === "Not available")) {
        experienceDetail.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "▪ ",
                bold: true,
                spacing: { after: 400 },
                font: "Arial",
              }),
              new TextRun({ text: "Program: ", bold: true, font: "Arial" }),
              new TextRun({ text: exp.program, font: "Arial" }),
            ],
          })
        );
      }

      if (
        Array.isArray(exp.responsibilities) &&
        exp.responsibilities.length > 0
      ) {
        experienceDetail.push(
          new Paragraph({
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({
                text: "▪ ",
                bold: true,
                spacing: { after: 400 },
                font: "Arial",
              }),
              new TextRun({
                text: "Responsibilities:",
                bold: true,
                font: "Arial",
              }),
            ],
          })
        );

        exp.responsibilities.forEach((res) => {
          if (res?.trim()) {
            experienceDetail.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "▪ ",
                    bold: true,
                    spacing: { after: 400 },
                    font: "Arial",
                  }),
                  new TextRun({
                    text: res,
                    spacing: { after: 100 },
                    font: "Arial",
                  }),
                ],
              })
            );
          }
        });
      }

      experienceDetail.push(new Paragraph("")); // spacer
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
          margin: { top: 720, bottom: 720, left: 720, right: 720 }, // 1 inch margins
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
