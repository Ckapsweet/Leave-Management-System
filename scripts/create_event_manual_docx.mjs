import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, "docs");
const outPath = path.join(outDir, "event-user-guide-manager.docx");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "event-manual-docx-"));

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function write(rel, content) {
  const filePath = path.join(tmp, rel);
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, "utf8");
}

function p(text, style = "BodyText") {
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Bullet"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function step(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Numbered"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function h1(text) {
  return p(text, "Heading1");
}

function h2(text) {
  return p(text, "Heading2");
}

function table(headers, rows, widths) {
  const grid = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const header = `<w:tr>${headers.map((cell, i) => tc(cell, widths[i], true)).join("")}</w:tr>`;
  const body = rows.map((row) => `<w:tr>${row.map((cell, i) => tc(cell, widths[i], false)).join("")}</w:tr>`).join("");
  return `<w:tbl>
    <w:tblPr>
      <w:tblStyle w:val="TableGrid"/>
      <w:tblW w:w="9360" w:type="dxa"/>
      <w:tblInd w:w="120" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/>
        <w:bottom w:w="120" w:type="dxa"/><w:right w:w="140" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tblGrid>${grid}</w:tblGrid>${header}${body}</w:tbl>`;
}

function tc(text, width, isHeader) {
  const fill = isHeader ? `<w:shd w:fill="E8EEF5"/>` : "";
  const style = isHeader ? "TableHeader" : "TableBody";
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p></w:tc>`;
}

function callout(title, lines) {
  return `<w:tbl>
    <w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="CBD5E1"/><w:left w:val="single" w:sz="4" w:color="CBD5E1"/>
      <w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/><w:right w:val="single" w:sz="4" w:color="CBD5E1"/>
    </w:tblBorders><w:tblCellMar><w:top w:w="160" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="160" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tblCellMar></w:tblPr>
    <w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid>
    <w:tr><w:tc><w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:fill="F4F6F9"/></w:tcPr>
      <w:p><w:pPr><w:pStyle w:val="CalloutTitle"/></w:pPr><w:r><w:t>${esc(title)}</w:t></w:r></w:p>
      ${lines.map((line) => `<w:p><w:pPr><w:pStyle w:val="CalloutBody"/></w:pPr><w:r><w:t>${esc(line)}</w:t></w:r></w:p>`).join("")}
    </w:tc></w:tr>
  </w:tbl>`;
}

const content = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>คู่มือการใช้งานระบบ Event</w:t></w:r></w:p>`,
  `<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr><w:r><w:t>สำหรับนำเสนอผู้จัดการและรองผู้จัดการ | CKAP Leave Management System</w:t></w:r></w:p>`,
  p("เอกสารนี้สรุปวิธีใช้งานส่วน Event ตั้งแต่การสร้าง Event เลือกผู้รับผิดชอบ เลือกผู้เข้าร่วม บันทึกเวลา ตรวจสอบรีพอร์ต พิมพ์รายงาน และลบข้อมูลเมื่อจำเป็น", "Lead"),
  callout("ภาพรวมสำหรับผู้จัดการ", [
    "Event ใช้สำหรับจัดกลุ่มงานนอกสถานที่/กิจกรรม/ภารกิจพิเศษ และติดตามเวลาเข้า-ออกของผู้เข้าร่วม",
    "Manager, Assistant Manager และ Admin สามารถสร้าง Event เลือกผู้รับผิดชอบ บันทึกเวลาแทนผู้เข้าร่วม และลบข้อมูลได้ตามสิทธิ์",
    "ข้อมูลเวลาที่บันทึกโดยผู้จัดการจะถูกยืนยันแล้วทันที เพื่อนำไปพิมพ์รีพอร์ตได้รวดเร็ว",
  ]),
  h1("1. สิทธิ์การใช้งาน"),
  table(["บทบาท", "สิ่งที่ทำได้ใน Event", "ขอบเขตข้อมูลที่เห็น"], [
    ["Manager", "สร้าง Event, เลือกผู้รับผิดชอบ, เลือกผู้เข้าร่วม, บันทึกเวลา, ยืนยัน/ลบเวลา, ลบ Event, พิมพ์รีพอร์ต", "Event และพนักงานในแผนกของตน"],
    ["Assistant Manager", "สร้าง Event, เลือกผู้รับผิดชอบในแผนก, บันทึกเวลา, ลบเวลา, ลบ Event, พิมพ์รีพอร์ต", "Event ที่เกี่ยวข้องกับแผนก/ทีมที่รับผิดชอบ"],
    ["Admin", "จัดการ Event ได้ครบทุกฟังก์ชัน", "ข้อมูลทุกแผนกตามสิทธิ์ผู้ดูแลระบบ"],
    ["Lead", "เลือกสมาชิกเข้าร่วม Event และตรวจสอบรายการที่เกี่ยวข้อง", "Event ที่ถูก assign ให้ตน"],
    ["User", "ส่งเวลา Event พร้อมหลักฐานในหน้าของตน", "Event ที่ตนเป็นผู้เข้าร่วม"],
  ], [1900, 4660, 2800]),
  h1("2. การสร้าง Event"),
  p("ไปที่เมนู Event แล้วกดปุ่ม สร้าง Event ระบบจะแสดงฟอร์มสำหรับกรอกข้อมูลหลักของกิจกรรม"),
  step("กรอกชื่อ Event เช่น ชื่องาน, สถานที่, หรือภารกิจ"),
  step("เลือกวันที่เริ่มและวันที่สิ้นสุด ระบบจะใช้ช่วงนี้กำหนดวันที่ที่สามารถบันทึกเวลาได้"),
  step("เลือกผู้รับผิดชอบ โดยรายการจะแสดง user ในแผนกที่เลือกได้ทั้งหมด ไม่จำกัดเฉพาะ Lead"),
  step("กรอกรายละเอียดเพิ่มเติม เช่น จุดประสงค์ หมายเหตุ หรือข้อมูลที่ทีมควรรู้"),
  step("กด สร้าง Event เพื่อบันทึก"),
  callout("ข้อควรระวัง", [
    "ต้องเลือกผู้รับผิดชอบอย่างน้อย 1 คน",
    "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม",
    "ผู้รับผิดชอบที่เลือกต้องอยู่ในขอบเขตแผนก/สิทธิ์ของผู้ใช้งาน",
  ]),
  h1("3. การเลือกผู้เข้าร่วม Event"),
  p("หลังสร้าง Event แล้ว ผู้จัดการสามารถกดปุ่ม เลือกคนเข้า Event ได้จากตารางรายการ Event หรือจากหน้ารายละเอียด Event"),
  bullet("เลือกพนักงานที่ต้องเข้าร่วมจากรายการในแผนก"),
  bullet("ระบบแสดงจำนวนผู้เข้าร่วมและรายชื่อย่อในตาราง Event"),
  bullet("สามารถกลับมาแก้ไขรายชื่อได้ตามสิทธิ์"),
  h1("4. การบันทึกเวลาเข้า-ออก"),
  p("ในหน้ารายละเอียด Event จะมีส่วน รีพอร์ตเวลา Event สำหรับดูรายการเวลาที่ส่งแล้ว และฟอร์มสำหรับผู้จัดการ/รองผู้จัดการ/Admin บันทึกเวลาเอง"),
  step("เลือกผู้เข้าร่วมจาก dropdown"),
  step("เลือกวันที่ที่อยู่ในช่วง Event"),
  step("กรอกเวลาเข้าและเวลาออกแบบ 24 ชั่วโมง เช่น 08:30 และ 17:30"),
  step("กด บันทึกเวลา ระบบจะบันทึกสถานะเป็น ยืนยันแล้ว ทันที"),
  table(["เงื่อนไข", "รายละเอียด"], [
    ["รูปแบบเวลา", "ใช้ 24 ชั่วโมงเท่านั้น เช่น 08:00, 13:30, 19:00"],
    ["ช่วงวันที่", "วันที่ต้องอยู่ระหว่างวันที่เริ่มและวันที่สิ้นสุดของ Event"],
    ["เวลาออก", "ต้องมากกว่าเวลาเข้า"],
    ["การบันทึกซ้ำ", "ถ้าเป็นคนเดิมและวันที่เดิม ระบบจะ update รายการเดิม"],
  ], [2500, 6860]),
  h1("5. การตรวจสอบ ยืนยัน และลบบันทึกเวลา"),
  bullet("รายการที่พนักงานส่งพร้อมหลักฐานจะขึ้นสถานะ รอยืนยัน"),
  bullet("ผู้มีสิทธิ์สามารถกด ยืนยัน หรือ ปฏิเสธ ได้"),
  bullet("รายการที่บันทึกโดยผู้จัดการจะเป็นสถานะ ยืนยันแล้ว"),
  bullet("ถ้าต้องแก้ไขข้อมูลผิด ให้กด ลบ ในรายการรีพอร์ตเวลา แล้วบันทึกใหม่"),
  bullet("ระบบจะแสดง popup ยืนยันก่อนลบ พร้อมชื่อพนักงาน วันที่ และเวลา"),
  h1("6. การพิมพ์รีพอร์ต"),
  p("กดปุ่ม พิมพ์รีพอร์ต ในหน้ารายละเอียด Event เพื่อเปิดหน้าพิมพ์รายงานเวลา ระบบจะแสดงรายชื่อผู้เข้าร่วม วันที่ เวลาเข้า เวลาออก และช่องลงชื่อสำหรับใช้งานเอกสาร"),
  callout("เหมาะสำหรับ", [
    "แนบเอกสารประกอบการอนุมัติ",
    "สรุปเวลาทำงานนอกสถานที่",
    "ใช้ตรวจสอบกับทีมหลังจบกิจกรรม",
  ]),
  h1("7. การลบ Event"),
  p("สามารถลบ Event ได้ทั้งจากตารางรายการ Event และจากหน้ารายละเอียด Event โดยระบบจะแสดง popup ยืนยันก่อนลบ"),
  bullet("popup จะแสดงชื่อ Event, ช่วงเวลา, จำนวนผู้เข้าร่วม และจำนวนรีพอร์ตเวลา"),
  bullet("เมื่อลบ Event แล้ว ข้อมูลผู้เข้าร่วม รีพอร์ตเวลา และไฟล์หลักฐานที่เกี่ยวข้องจะถูกลบตามไปด้วย"),
  bullet("ควรใช้เฉพาะกรณีสร้างผิด ทดสอบข้อมูล หรือกิจกรรมนั้นถูกยกเลิกจริง"),
  h1("8. Checklist ก่อนนำไปใช้งานจริง"),
  table(["รายการตรวจสอบ", "สถานะที่คาดหวัง"], [
    ["สร้าง Event", "ชื่อและช่วงวันที่ถูกต้อง"],
    ["เลือกผู้รับผิดชอบ", "เห็น user ในแผนกและเลือกได้ตามสิทธิ์"],
    ["เลือกผู้เข้าร่วม", "รายชื่อและจำนวนตรงกับทีมงานจริง"],
    ["บันทึกเวลา", "ใช้รูปแบบ 24 ชั่วโมงและสถานะเป็น ยืนยันแล้ว"],
    ["พิมพ์รีพอร์ต", "ข้อมูลเวลาแสดงครบถ้วน"],
    ["ลบข้อมูล", "มี popup ยืนยันก่อนลบทุกครั้ง"],
  ], [3800, 5560]),
  h1("9. ประเด็นนำเสนอผู้จัดการ"),
  bullet("ช่วยรวมข้อมูลกิจกรรมและผู้เข้าร่วมไว้ที่เดียว"),
  bullet("ลดงานเอกสาร เพราะผู้จัดการสามารถบันทึกเวลาให้ทีมได้โดยตรง"),
  bullet("รองรับการตรวจสอบย้อนหลังผ่านรีพอร์ตและหลักฐานแนบ"),
  bullet("มีการจำกัดสิทธิ์ตามบทบาทและแผนก ลดความเสี่ยงในการเห็นข้อมูลเกินสิทธิ์"),
  bullet("มี popup ยืนยันก่อนลบข้อมูลสำคัญ เพื่อป้องกันความผิดพลาด"),
];

write("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

write("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

write("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`);

write("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${content.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`);

write("word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="22"/></w:rPr><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:qFormat/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="42"/><w:color w:val="0B2545"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:pPr><w:spacing w:after="220"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="24"/><w:color w:val="64748B"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Lead"><w:name w:val="Lead"/><w:pPr><w:spacing w:after="180" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="23"/><w:color w:val="334155"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="200"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="140"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="26"/><w:color w:val="2E74B5"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Bullet"><w:name w:val="Bullet"/><w:pPr><w:spacing w:after="80" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Numbered"><w:name w:val="Numbered"/><w:pPr><w:spacing w:after="80" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/><w:pPr><w:spacing w:after="0" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="20"/><w:color w:val="0B2545"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableBody"><w:name w:val="Table Body"/><w:pPr><w:spacing w:after="0" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="CalloutTitle"><w:name w:val="Callout Title"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="23"/><w:color w:val="1F3A5F"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="CalloutBody"><w:name w:val="Callout Body"/><w:pPr><w:spacing w:after="60" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr></w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9E2EC"/><w:left w:val="single" w:sz="4" w:color="D9E2EC"/><w:bottom w:val="single" w:sz="4" w:color="D9E2EC"/><w:right w:val="single" w:sz="4" w:color="D9E2EC"/><w:insideH w:val="single" w:sz="4" w:color="D9E2EC"/><w:insideV w:val="single" w:sz="4" w:color="D9E2EC"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`);

write("word/numbering.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
  <w:abstractNum w:abstractNumId="2"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>`);

write("word/settings.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/></w:settings>`);
write("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>คู่มือการใช้งานระบบ Event</dc:title><dc:creator>CKAP Management System</dc:creator><cp:lastModifiedBy>CKAP Management System</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-05-25T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-25T00:00:00Z</dcterms:modified></cp:coreProperties>`);
write("docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>CKAP Management System</Application></Properties>`);

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
const zipPath = path.join(outDir, "event-user-guide-manager.zip");
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execFileSync("powershell", [
  "-NoProfile",
  "-Command",
  `Compress-Archive -Path '${tmp}\\*' -DestinationPath '${zipPath}' -Force`,
], { stdio: "inherit" });
fs.renameSync(zipPath, outPath);

console.log(outPath);
