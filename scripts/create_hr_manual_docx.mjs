import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, "docs");
const outPath = path.join(outDir, "hr-manual.docx");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ckap-hr-manual-"));
const now = new Date().toISOString();

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

function h1(text) {
  return p(text, "Heading1");
}

function h2(text) {
  return p(text, "Heading2");
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Bullet"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function step(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Numbered"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function table(headers, rows, widths) {
  const total = widths.reduce((sum, width) => sum + width, 0);
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
  const header = `<w:tr>${headers.map((cell, i) => tc(cell, widths[i], true)).join("")}</w:tr>`;
  const body = rows.map((row) => `<w:tr>${row.map((cell, i) => tc(cell, widths[i], false)).join("")}</w:tr>`).join("");
  return `<w:tbl>
    <w:tblPr>
      <w:tblStyle w:val="ManualTable"/>
      <w:tblW w:w="${total}" w:type="dxa"/>
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
    <w:tblGrid>${grid}</w:tblGrid>
    ${header}
    ${body}
  </w:tbl>`;
}

function tc(text, width, isHeader) {
  const fill = isHeader ? `<w:shd w:fill="E8EEF5"/>` : "";
  const style = isHeader ? "TableHeader" : "TableBody";
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p></w:tc>`;
}

function callout(title, lines) {
  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="9360" w:type="dxa"/>
      <w:tblInd w:w="120" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="4" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="4" w:color="CBD5E1"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="160" w:type="dxa"/><w:left w:w="180" w:type="dxa"/>
        <w:bottom w:w="160" w:type="dxa"/><w:right w:w="180" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid>
    <w:tr><w:tc><w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:fill="F4F6F9"/></w:tcPr>
      <w:p><w:pPr><w:pStyle w:val="CalloutTitle"/></w:pPr><w:r><w:t>${esc(title)}</w:t></w:r></w:p>
      ${lines.map((line) => `<w:p><w:pPr><w:pStyle w:val="CalloutBody"/></w:pPr><w:r><w:t>${esc(line)}</w:t></w:r></w:p>`).join("")}
    </w:tc></w:tr>
  </w:tbl>`;
}

const content = [
  p("คู่มือการใช้งานระบบลางานสำหรับ HR", "Title"),
  p("CKAP Leave Management System", "Subtitle"),
  p("เอกสารนี้อธิบายการใช้งานสำหรับบทบาท HR โดยเน้นการตรวจสอบสิทธิ์วันลาของพนักงาน การปรับสิทธิ์วันลารายปี การดูประวัติการลา และการดูสรุปรายงานภาพรวมเพื่อใช้ติดตามข้อมูลฝ่ายบุคคล", "Lead"),
  callout("ขอบเขตของบทบาท HR", [
    "HR ใช้สำหรับดูแลข้อมูลสิทธิ์วันลาของพนักงานและตรวจสอบภาพรวมการลา",
    "HR สามารถเปิดดูรายละเอียดคำขอและประวัติพนักงานได้ แต่หน้าจอ HR ไม่ใช่หน้าหลักสำหรับอนุมัติหรือปฏิเสธคำขอลา",
    "หากต้องแก้ไขข้อมูลผู้ใช้ role ทีม หรือแผนก ให้ส่งต่อผู้ดูแลระบบที่มีสิทธิ์ Admin",
  ]),
  h1("1. การเข้าสู่หน้าจอ HR"),
  step("เข้าสู่ระบบด้วยรหัสพนักงานและรหัสผ่านของบัญชี HR"),
  step("หลังเข้าสู่ระบบ ระบบจะพาไปยังหน้า HR โดยตรง หรือเลือก ระบบจัดการการลา จากหน้าเลือกใช้งานระบบ"),
  step("ใช้ปุ่ม แก้ไขโปรไฟล์ เมื่อต้องการแก้ไขข้อมูลส่วนตัวหรือเปลี่ยนรหัสผ่าน"),
  step("เมื่อใช้งานเสร็จ ให้กด ออกจากระบบ โดยเฉพาะเมื่อใช้เครื่องส่วนกลาง"),
  h1("2. ภาพรวมหน้าจอ HR"),
  p("หน้าจอ HR แบ่งการทำงานหลักออกเป็น 3 แท็บ เพื่อให้ตรวจสอบข้อมูลพนักงาน ประวัติการลา และรายงานภาพรวมได้รวดเร็ว"),
  table(["แท็บ", "ใช้ทำอะไร"], [
    ["วันลาพนักงาน", "ดูรายชื่อพนักงานทั้งหมด สิทธิ์วันลารวม ใช้ไปแล้ว คงเหลือ และเปิดแก้ไขสิทธิ์วันลารายบุคคล"],
    ["ประวัติการลา", "ดูรายการคำขอลาของพนักงาน กรองตามสถานะ ค้นหา กรองรายปีหรือรายเดือน และเปิดดูรายละเอียดคำขอ"],
    ["สรุปรวม", "ดูรายงานสรุปการลาในภาพรวม เช่น การใช้วันลา รายการรออนุมัติ และข้อมูลที่ช่วยติดตามสถานะฝ่ายบุคคล"],
  ], [2400, 6960]),
  h1("3. การตรวจสอบวันลาพนักงาน"),
  p("แท็บ วันลาพนักงาน เป็นหน้าหลักสำหรับ HR ใช้ตรวจสอบยอดวันลาของพนักงานทุกคนในระบบ"),
  bullet("การ์ดด้านบนแสดงจำนวนพนักงานทั้งหมด สิทธิ์วันลารวม ใช้ไปแล้ว และจำนวนพนักงานที่วันลาคงเหลือใกล้หมด"),
  bullet("ใช้ช่องค้นหาเพื่อค้นหาจากชื่อหรือรหัสพนักงาน"),
  bullet("ใช้ตัวกรองแผนกเพื่อดูพนักงานเฉพาะแผนกที่ต้องการ"),
  bullet("กด รีเฟรช เพื่อโหลดข้อมูลล่าสุดหลังมีการปรับสิทธิ์หรือมีคำขอใหม่"),
  table(["คอลัมน์", "ความหมาย"], [
    ["พนักงาน", "แสดงชื่อ แผนก และรหัสพนักงาน"],
    ["สิทธิ์รวม", "จำนวนสิทธิ์วันลาที่พนักงานได้รับในปีนั้น"],
    ["ใช้ไปแล้ว", "จำนวนวันหรือชั่วโมงลาที่ใช้แล้วจากคำขอที่มีผลกับยอดลา"],
    ["คงเหลือ", "ยอดวันลาที่สามารถใช้ได้หลังหักยอดใช้ไปแล้ว"],
    ["การใช้งาน", "แถบแสดงสัดส่วนการใช้สิทธิ์เพื่อช่วยมองเห็นพนักงานที่ใช้สิทธิ์สูง"],
  ], [2300, 7060]),
  h1("4. การปรับสิทธิ์วันลาพนักงาน"),
  p("HR สามารถปรับสิทธิ์วันลาของพนักงานจากแท็บ วันลาพนักงาน เมื่อมีการจัดสรรสิทธิ์ประจำปี แก้ไขยอดเริ่มต้น หรือปรับตามนโยบายบริษัท"),
  step("ไปที่แท็บ วันลาพนักงาน"),
  step("ค้นหาพนักงานที่ต้องการปรับสิทธิ์ หรือเลือกแผนกเพื่อจำกัดรายการ"),
  step("กดปุ่ม เพิ่มวันลา ในแถวของพนักงานคนนั้น"),
  step("ตรวจสอบชื่อ รหัสพนักงาน แผนก และปีที่ต้องการปรับสิทธิ์"),
  step("ปรับจำนวนวัน ชั่วโมง หรือนาทีในแต่ละประเภทการลาให้ถูกต้อง"),
  step("กดบันทึก แล้วตรวจสอบยอดในตารางอีกครั้ง"),
  callout("ข้อควรระวังในการปรับสิทธิ์", [
    "ตรวจสอบปีให้ถูกต้องก่อนบันทึก เพราะสิทธิ์วันลาเป็นข้อมูลรายปี",
    "การปรับสิทธิ์ควรอ้างอิงเอกสารหรือหลักเกณฑ์ของบริษัทเพื่อให้ตรวจสอบย้อนหลังได้",
    "หากยอดใช้ไปแล้วผิดปกติ ให้เปิดประวัติการลาของพนักงานเพื่อตรวจสอบคำขอที่เกี่ยวข้องก่อนแก้ไขสิทธิ์",
  ]),
  h1("5. การเปิดดูประวัติรายบุคคล"),
  p("จากแท็บ วันลาพนักงาน HR สามารถคลิกแถวของพนักงานเพื่อเปิดแถบรายละเอียดด้านข้างและตรวจสอบประวัติการลาของบุคคลนั้น"),
  bullet("แถบรายละเอียดแสดงข้อมูลพนักงาน ยอดวันลา และรายการคำขอของพนักงานคนนั้น"),
  bullet("ใช้ปุ่ม เพิ่มวันลา ในแถบรายละเอียดเพื่อเปิดหน้าปรับสิทธิ์ของพนักงานคนนั้นได้เช่นกัน"),
  bullet("ตรวจสอบรายการคำขอเพื่อดูประเภทการลา วันที่ จำนวนวันหรือชั่วโมง เหตุผล และสถานะ"),
  h1("6. การตรวจสอบประวัติการลา"),
  p("แท็บ ประวัติการลา ใช้สำหรับตรวจสอบรายการคำขอลาของพนักงานทั้งหมดในขอบเขตที่ HR มองเห็น"),
  table(["ตัวกรอง", "วิธีใช้"], [
    ["สถานะ", "เลือก ทั้งหมด, รออนุมัติ, อนุมัติแล้ว หรือ ปฏิเสธ เพื่อดูเฉพาะรายการที่ต้องการ"],
    ["ค้นหา", "ค้นหาจากชื่อหรือรหัสพนักงาน"],
    ["ช่วงเวลา", "เลือกดูทั้งหมด รายปี หรือรายเดือน เพื่อจำกัดรายการตามช่วงเวลา"],
    ["รีเฟรช", "โหลดรายการล่าสุดหลังมีคำขอใหม่หรือมีการเปลี่ยนสถานะ"],
  ], [2400, 6960]),
  step("ไปที่แท็บ ประวัติการลา"),
  step("เลือกสถานะหรือช่วงเวลาที่ต้องการตรวจสอบ"),
  step("คลิกแถวคำขอเพื่อเปิดรายละเอียด"),
  step("ตรวจสอบข้อมูลพนักงาน ประเภทการลา วันที่ เวลา จำนวน เหตุผล ไฟล์แนบ และหมายเหตุจากผู้อนุมัติถ้ามี"),
  callout("หมายเหตุเรื่องการอนุมัติ", [
    "หน้าจอ HR แสดงรายละเอียดคำขอเพื่อการตรวจสอบและรายงาน",
    "การอนุมัติหรือปฏิเสธคำขอควรดำเนินการโดยผู้อนุมัติใน workflow เช่น Lead, Assistant Manager, Manager หรือ Admin ตามสิทธิ์ที่ระบบกำหนด",
  ]),
  h1("7. การดูรายงานสรุปรวม"),
  p("แท็บ สรุปรวม ใช้ดูภาพรวมการใช้วันลาขององค์กรหรือกลุ่มพนักงาน เพื่อช่วยติดตามแนวโน้มและเตรียมข้อมูลสำหรับงาน HR"),
  bullet("ตรวจสอบจำนวนคำขอและสถานะรวม เพื่อดูภาระงานที่ยังรอการดำเนินการ"),
  bullet("ดูข้อมูลการใช้วันลาแยกตามช่วงเวลา ประเภทการลา หรือกลุ่มพนักงานตามที่รายงานแสดง"),
  bullet("ใช้รายงานร่วมกับแท็บ วันลาพนักงาน เพื่อหาพนักงานที่ยอดคงเหลือใกล้หมดหรือมีการลาเยอะผิดปกติ"),
  bullet("หากข้อมูลรายงานดูไม่ตรง ให้กดรีเฟรชหรือกลับไปตรวจสอบรายการคำขอและยอดสิทธิ์รายบุคคล"),
  h1("8. การแก้ไขโปรไฟล์และรหัสผ่าน"),
  h2("แก้ไขข้อมูลส่วนตัว"),
  step("กด แก้ไขโปรไฟล์ ที่มุมบนของหน้าจอ"),
  step("แก้ไขข้อมูลที่อนุญาต เช่น ชื่อ อีเมล หรือเบอร์โทร"),
  step("กดบันทึกและตรวจสอบข้อความแจ้งผล"),
  h2("เปลี่ยนรหัสผ่าน"),
  step("เปิดหน้าต่างแก้ไขโปรไฟล์"),
  step("เลือกแท็บ เปลี่ยนรหัสผ่าน"),
  step("กรอกรหัสผ่านปัจจุบัน รหัสผ่านใหม่ และยืนยันรหัสผ่านใหม่"),
  step("กด เปลี่ยนรหัสผ่าน"),
  h1("9. ปัญหาที่พบบ่อย"),
  table(["ปัญหา", "แนวทางแก้ไข"], [
    ["ไม่พบพนักงาน", "ตรวจสอบคำค้นหา ตัวกรองแผนก และกดรีเฟรช หากยังไม่พบให้ติดต่อ Admin เพื่อตรวจสอบสถานะผู้ใช้"],
    ["เพิ่มวันลาไม่ได้", "ตรวจสอบว่าบัญชีมี role HR และพนักงานอยู่ในขอบเขตที่อนุญาตให้แก้ไขสิทธิ์"],
    ["ยอดวันลาไม่ตรง", "เปิดประวัติรายบุคคลเพื่อตรวจสอบคำขอที่อนุมัติแล้ว รายการย้อนหลัง หรือการปรับสิทธิ์ล่าสุด"],
    ["ไม่เห็นปุ่มอนุมัติ", "เป็นพฤติกรรมปกติของหน้า HR หากต้องอนุมัติให้ดำเนินการผ่านผู้อนุมัติใน workflow หรือผู้ดูแลระบบตามสิทธิ์"],
    ["รายงานไม่อัปเดต", "กดรีเฟรชหรือเข้าแท็บใหม่อีกครั้ง หากยังไม่ตรงให้ตรวจสอบการเชื่อมต่อ API"],
  ], [3000, 6360]),
  h1("10. Checklist สำหรับ HR"),
  table(["งาน", "ตรวจสอบก่อนจบงาน"], [
    ["ปรับสิทธิ์วันลา", "เลือกพนักงานและปีถูกต้อง บันทึกยอดตามเอกสารอ้างอิง และตรวจยอดหลังบันทึก"],
    ["ตรวจประวัติการลา", "ใช้ตัวกรองสถานะและช่วงเวลาให้ถูกต้องก่อนสรุปข้อมูล"],
    ["ดูพนักงานคงเหลือน้อย", "ตรวจสอบการ์ดคงเหลือใกล้หมดและเปิดดูรายละเอียดรายบุคคล"],
    ["ทำรายงาน", "ใช้แท็บสรุปรวมร่วมกับประวัติการลาเพื่อยืนยันตัวเลข"],
    ["ความปลอดภัย", "ออกจากระบบทุกครั้งเมื่อใช้เครื่องร่วมกัน"],
  ], [2500, 6860]),
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
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:qFormat/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="42"/><w:color w:val="0B2545"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="24"/><w:color w:val="64748B"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Lead"><w:name w:val="Lead"/><w:pPr><w:spacing w:after="180" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="23"/><w:color w:val="334155"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="200"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="140"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="26"/><w:color w:val="2E74B5"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Bullet"><w:name w:val="Bullet"/><w:pPr><w:spacing w:after="80" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Numbered"><w:name w:val="Numbered"/><w:pPr><w:spacing w:after="80" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/><w:pPr><w:spacing w:after="0" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="20"/><w:color w:val="0B2545"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableBody"><w:name w:val="Table Body"/><w:pPr><w:spacing w:after="0" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="CalloutTitle"><w:name w:val="Callout Title"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:b/><w:sz w:val="23"/><w:color w:val="1F3A5F"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="CalloutBody"><w:name w:val="Callout Body"/><w:pPr><w:spacing w:after="60" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr></w:style>
  <w:style w:type="table" w:styleId="ManualTable"><w:name w:val="Manual Table"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9E2EC"/><w:left w:val="single" w:sz="4" w:color="D9E2EC"/><w:bottom w:val="single" w:sz="4" w:color="D9E2EC"/><w:right w:val="single" w:sz="4" w:color="D9E2EC"/><w:insideH w:val="single" w:sz="4" w:color="D9E2EC"/><w:insideV w:val="single" w:sz="4" w:color="D9E2EC"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`);

write("word/numbering.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
  <w:abstractNum w:abstractNumId="2"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>`);

write("word/settings.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/></w:settings>`);
write("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>คู่มือการใช้งานระบบลางานสำหรับ HR</dc:title><dc:creator>CKAP Management System</dc:creator><cp:lastModifiedBy>CKAP Management System</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
write("docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>CKAP Management System</Application></Properties>`);

fs.mkdirSync(outDir, { recursive: true });
let finalOutPath = outPath;
if (fs.existsSync(finalOutPath)) {
  try {
    fs.unlinkSync(finalOutPath);
  } catch (error) {
    if (error?.code !== "EBUSY" && error?.code !== "EPERM") throw error;
    finalOutPath = path.join(outDir, "hr-manual-updated.docx");
    if (fs.existsSync(finalOutPath)) fs.unlinkSync(finalOutPath);
  }
}
const zipPath = path.join(outDir, "hr-manual.zip");
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execFileSync("powershell", [
  "-NoProfile",
  "-Command",
  `Compress-Archive -Path '${tmp}\\*' -DestinationPath '${zipPath}' -Force`,
], { stdio: "inherit" });
fs.renameSync(zipPath, finalOutPath);
fs.rmSync(tmp, { recursive: true, force: true });

console.log(finalOutPath);
