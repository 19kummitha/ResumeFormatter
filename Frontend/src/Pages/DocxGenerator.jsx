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
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              color: "FFFFFF",
              font: "Arial",
              spacing: { after: 400 },
            }),
            new TextRun({ text: edu, color: "FFFFFF", font: "Arial" }),
          ],
          indent: { left: 360 },
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
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              color: "FFFFFF",
              spacing: { after: 400 },
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
          indent: { left: 360 },
        })
      );
    });
  }

  if (Array.isArray(data.certifications) && data.certifications.length > 0) {
    leftContent.push(createSectionHeading("Certifications", "FFFFFF"));
    data.certifications.forEach((cert) => {
      leftContent.push(
        new Paragraph({
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
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({ text: item, font: "Arial" }),
          ],
          indent: { left: 360 },
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

  // === HEADER ===
  const headerTable = new Table({
    rows: [
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
            shading: { fill: "000000" },
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 70, type: WidthType.PERCENTAGE },
          }),
        ],
        height: { value: 2000, rule: "exact" },
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
            width: { size: 30, type: WidthType.PERCENTAGE },
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
              bottom: 300,
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

    data.experience_data.forEach((exp) => {
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
            new TextRun({ text: `Company: `, bold: true, font: "Arial" }),
            new TextRun({ text: exp.company, font: "Arial" }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({ text: `Role: `, bold: true, font: "Arial" }),
            new TextRun({ text: exp.role, font: "Arial" }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({ text: `Duration: `, bold: true, font: "Arial" }),
            new TextRun({
              text: `${exp.startDate} - ${exp.endDate}`,
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({
              text: `Client Engagement: `,
              bold: true,
              font: "Arial",
            }),
            new TextRun({
              text: exp.clientEngagement || "Not available",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "▪ ",
              bold: true,
              spacing: { after: 400 },
              font: "Arial",
            }),
            new TextRun({ text: `Program: `, bold: true, font: "Arial" }),
            new TextRun({
              text: exp.program || "Not available",
              font: "Arial",
            }),
          ],
        })
      );

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
          experienceDetail.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "▪ ",
                  bold: true,
                  color: "FFFFFF",
                  spacing: { after: 400 },
                  font: "Arial",
                }),
                new TextRun({
                  text: res,
                  bullet: { level: 0 },
                  spacing: { after: 100 },
                  font: "Arial",
                }),
              ],
            })
          );
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
