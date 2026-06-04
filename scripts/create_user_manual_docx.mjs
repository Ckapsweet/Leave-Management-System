import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, "docs");
const outPath = path.join(outDir, "user-manual.docx");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ckap-user-manual-"));

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

function pageBreak() {
  return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
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
  p("คู่มือการใช้งานระบบลางาน", "Title"),
  p("สำหรับผู้ใช้งานทั่วไป | CKAP Leave Management System", "Subtitle"),
  p("เอกสารฉบับนี้อธิบายขั้นตอนการใช้งานระบบสำหรับพนักงาน ตั้งแต่การเข้าสู่ระบบ การตรวจสอบสิทธิ์วันลา การยื่นคำขอลา การติดตามสถานะ การยกเลิกคำขอที่ยังรออนุมัติ การแก้ไขข้อมูลส่วนตัว และการส่งเวลา Event เมื่อได้รับมอบหมาย", "Lead"),
  callout("ขอบเขตของคู่มือ", [
    "คู่มือนี้เหมาะสำหรับบัญชีผู้ใช้งานทั่วไปที่เข้าเมนูระบบจัดการการลา",
    "หน้าจอและปุ่มบางส่วนอาจแตกต่างตามสิทธิ์ของบัญชี เช่น Lead, Manager หรือ Admin",
    "หากข้อมูลสิทธิ์วันลาไม่แสดงหรือข้อมูลส่วนตัวไม่ถูกต้อง ให้ติดต่อ HR หรือผู้ดูแลระบบ",
  ]),
  h1("1. ภาพรวมหน้าจอผู้ใช้งาน"),
  p("หลังเข้าสู่ระบบ ผู้ใช้งานจะเห็น Dashboard สำหรับตรวจสอบข้อมูลการลาและจัดการคำขอของตนเอง ส่วนสำคัญในหน้า Dashboard มีดังนี้"),
  table(["ส่วนหน้าจอ", "ใช้ทำอะไร"], [
    ["ข้อมูลผู้ใช้งาน", "แสดงชื่อ แผนก รหัสพนักงาน และสรุปวันลาคงเหลือ/ใช้ไปแล้ว/รออนุมัติ"],
    ["เพิ่มการลา", "เปิดฟอร์มสำหรับยื่นคำขอลา ลาเป็นชั่วโมง หรือลาสาย"],
    ["Event ของฉัน", "แสดง Event ที่ผู้ใช้งานถูกเพิ่มเป็นผู้เข้าร่วม พร้อมช่องส่งเวลาเข้า-ออกและหลักฐาน"],
    ["วันลาคงเหลือแต่ละประเภท", "แสดงสิทธิ์รวม ใช้ไปแล้ว และคงเหลือตามประเภทการลา"],
    ["ประวัติการลา", "ดูรายการคำขอทั้งหมด พร้อมตัวกรองสถานะ รายปี และรายเดือน"],
  ], [2500, 6860]),
  h1("2. การเข้าสู่ระบบ"),
  step("เปิดหน้าเข้าสู่ระบบของ CKAP Leave Management System"),
  step("กรอกรหัสพนักงานในช่อง รหัส เช่น MKT-9999"),
  step("กรอกรหัสผ่านของตนเอง"),
  step("กดปุ่ม เข้าสู่ระบบ"),
  p("หากเข้าสู่ระบบสำเร็จ ระบบจะพาไปยังหน้าที่ตรงกับสิทธิ์ของบัญชี หากเป็นผู้ใช้งานทั่วไปจะเข้าสู่ Dashboard โดยตรง"),
  callout("กรณีเข้าสู่ระบบไม่ได้", [
    "ตรวจสอบว่ารหัสพนักงานและรหัสผ่านถูกต้อง",
    "หากระบบแจ้งข้อผิดพลาดซ้ำ ให้ติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่านหรือตรวจสอบสถานะบัญชี",
  ]),
  h1("3. การเลือกเข้าระบบจัดการการลา"),
  p("หากระบบแสดงหน้าเลือกใช้งานระบบ ให้เลือก ระบบจัดการการลา เพื่อเข้าสู่หน้าจอการลา ส่วนระบบจัดการ OT ยังอยู่ระหว่างพัฒนาและจะแสดงข้อความแจ้งเตือนเมื่อกดเลือก"),
  step("คลิกการ์ด ระบบจัดการการลา"),
  step("ระบบจะพาไปยังหน้า Dashboard หรือหน้าจัดการทีมตามสิทธิ์ของบัญชี"),
  step("หากต้องการออกจากระบบ ให้กด ออกจากระบบ ที่มุมขวาบน"),
  h1("4. การตรวจสอบสิทธิ์วันลา"),
  p("ในหน้า Dashboard ระบบจะแสดงยอดวันลาคงเหลือแบบรวม และแยกตามประเภทการลา ผู้ใช้งานควรตรวจสอบยอดก่อนยื่นคำขอทุกครั้ง"),
  bullet("วันคงเหลือ คือจำนวนสิทธิ์ที่ยังใช้ได้"),
  bullet("วันที่ใช้ไป คือจำนวนวันที่ถูกใช้ไปแล้วจากคำขอที่เกี่ยวข้อง"),
  bullet("รออนุมัติ คือจำนวนคำขอที่ยังอยู่ระหว่างรอผู้อนุมัติพิจารณา"),
  bullet("การ์ดวันลาคงเหลือแต่ละประเภทจะแสดงสิทธิ์รวม ใช้ไปแล้ว และคงเหลือ พร้อมแถบสถานะ"),
  h1("5. การยื่นคำขอลา"),
  p("กดปุ่ม เพิ่มการลา ที่มุมขวาบนของ Dashboard เพื่อเปิดฟอร์มยื่นคำขอ ระบบรองรับ 3 รูปแบบ ได้แก่ ลาเป็นวัน ลาเป็นชั่วโมง และลาสาย"),
  h2("5.1 ลาเป็นวัน"),
  step("เลือก รูปแบบคำขอ เป็น ลาเป็นวัน"),
  step("เลือกประเภทการลา โดยระบบจะแสดงยอดคงเหลือของแต่ละประเภท"),
  step("เลือกวันที่เริ่มลาและวันที่สิ้นสุด"),
  step("กรอกเหตุผลการลาให้ครบถ้วน"),
  step("แนบไฟล์ประกอบเหตุผลถ้ามี โดยรองรับไฟล์รูปภาพและ PDF"),
  step("ตรวจสอบสรุปจำนวนวัน แล้วกด ส่งคำขอลา"),
  h2("5.2 ลาเป็นชั่วโมง"),
  step("เลือก รูปแบบคำขอ เป็น ลาเป็นชั่วโมง"),
  step("เลือกประเภทการลา"),
  step("เลือกวันที่ลา"),
  step("กรอกเวลาเริ่มและเวลาสิ้นสุดในรูปแบบ 24 ชั่วโมง เช่น 09:00 ถึง 12:00"),
  step("กรอกเหตุผลและแนบไฟล์ถ้ามี"),
  step("กด ส่งคำขอลา"),
  h2("5.3 ลาสาย"),
  step("เลือก รูปแบบคำขอ เป็น ลาสาย"),
  step("เลือกประเภทที่ใช้บันทึก"),
  step("เลือกวันที่ลาสาย"),
  step("กรอกเวลาเริ่มงานปกติและเวลาเข้างานจริง"),
  step("กรอกเหตุผลการลาสายและแนบไฟล์ถ้ามี"),
  step("กด ส่งคำขอลาสาย"),
  callout("เงื่อนไขสำคัญในการกรอกคำขอ", [
    "ต้องเลือกประเภทการลา วันที่ และเหตุผลทุกครั้ง",
    "ระบบไม่อนุญาตให้เลือกวันเสาร์หรือวันอาทิตย์เป็นวันลา",
    "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น",
    "กรณีลาเป็นชั่วโมง เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น",
    "ไฟล์แนบรองรับเฉพาะรูปภาพและ PDF",
  ]),
  pageBreak(),
  h1("6. การติดตามประวัติและสถานะคำขอ"),
  p("ส่วน ประวัติการลา แสดงรายการคำขอทั้งหมดของผู้ใช้งาน สามารถกรองรายการตามสถานะและช่วงเวลาได้"),
  table(["สถานะ", "ความหมาย", "สิ่งที่ผู้ใช้งานทำได้"], [
    ["รออนุมัติ", "คำขอถูกส่งแล้วและรอผู้อนุมัติพิจารณา", "เปิดดูรายละเอียดหรือยกเลิกคำขอ"],
    ["อนุมัติแล้ว", "คำขอผ่านการอนุมัติแล้ว", "เปิดดูรายละเอียด ผู้อนุมัติ และวันเวลาที่อนุมัติ"],
    ["ปฏิเสธ", "คำขอไม่ผ่านการอนุมัติ", "เปิดดูรายละเอียดและอ่านหมายเหตุจากผู้อนุมัติ ถ้ามี"],
  ], [1800, 3660, 3900]),
  h2("การดูรายละเอียดคำขอ"),
  step("คลิกแถวคำขอที่ต้องการดูในตารางประวัติการลา"),
  step("ระบบจะแสดงแถบรายละเอียดด้านข้าง พร้อมสถานะ วันที่ ประเภท จำนวนวัน/ชั่วโมง เหตุผล ผู้อนุมัติ และหมายเหตุ"),
  step("กดปุ่มปิดหรือคลิกพื้นที่ด้านนอกเพื่อกลับไปยัง Dashboard"),
  h2("การกรองรายการ"),
  bullet("ใช้ปุ่มสถานะ ทั้งหมด, รออนุมัติ, อนุมัติแล้ว, ปฏิเสธ เพื่อดูเฉพาะรายการที่ต้องการ"),
  bullet("เลือกมุมมอง ทั้งหมด, รายปี หรือรายเดือน เพื่อจำกัดช่วงเวลา"),
  bullet("เมื่อเลือก รายปี หรือ รายเดือน ให้เลือกปี และเลือกเดือนเพิ่มเติมตามต้องการ"),
  h1("7. การยกเลิกคำขอลา"),
  p("ผู้ใช้งานสามารถยกเลิกได้เฉพาะคำขอที่ยังอยู่ในสถานะ รออนุมัติ เท่านั้น"),
  step("ไปที่ตาราง ประวัติการลา"),
  step("หารายการที่มีสถานะ รออนุมัติ"),
  step("กดปุ่ม ยกเลิก ในแถวนั้น หรือเปิดรายละเอียดคำขอแล้วกดยกเลิก"),
  step("ระบบจะแสดงหน้าต่างยืนยันการยกเลิก"),
  step("กด ยืนยันยกเลิก เพื่อดำเนินการ"),
  callout("ข้อควรระวัง", [
    "การยกเลิกคำขอไม่สามารถย้อนกลับได้",
    "หากคำขอถูกอนุมัติหรือปฏิเสธแล้ว จะไม่สามารถกดยกเลิกจากหน้าผู้ใช้งานได้",
  ]),
  h1("8. การส่งเวลา Event ของฉัน"),
  p("เมื่อผู้ใช้งานถูกเพิ่มเป็นผู้เข้าร่วม Event ระบบจะแสดงส่วน Event ของฉัน บน Dashboard ผู้ใช้งานต้องส่งเวลาเข้า-ออกและหลักฐานตามวันที่กำหนด"),
  step("ดูรายการ Event ของฉัน และเลือกวันที่ต้องการส่งเวลา"),
  step("กรอกเวลาเข้างานและเวลาออกงาน"),
  step("แนบหลักฐานเข้างานและหลักฐานออกงาน โดยรองรับรูปภาพและ PDF"),
  step("กด ส่งยืนยัน"),
  step("หลังส่งแล้ว สถานะจะเปลี่ยนเป็น รอยืนยัน และช่องกรอกของวันนั้นจะถูกล็อกจนกว่าจะมีการตรวจสอบ"),
  table(["สถานะ Event", "ความหมาย"], [
    ["ยังไม่ส่ง", "ยังไม่ได้ส่งเวลาเข้า-ออกสำหรับวันนั้น"],
    ["รอยืนยัน", "ส่งข้อมูลแล้ว รอผู้รับผิดชอบตรวจสอบ"],
    ["ยืนยันแล้ว", "ข้อมูลเวลาได้รับการยืนยันแล้ว"],
    ["ถูกปฏิเสธ", "ข้อมูลถูกปฏิเสธ ให้ตรวจสอบหมายเหตุและส่งข้อมูลใหม่ตามขั้นตอนของทีม"],
  ], [2200, 7160]),
  h1("9. การแก้ไขข้อมูลส่วนตัวและรหัสผ่าน"),
  p("กดที่ชื่อหรือรูปโปรไฟล์ของตนเองบริเวณมุมขวาบนของ Dashboard เพื่อเปิดหน้าต่าง แก้ไขข้อมูลส่วนตัว"),
  h2("ข้อมูลทั่วไป"),
  bullet("แก้ไขชื่อ-นามสกุล"),
  bullet("เพิ่มหรือแก้ไข Email 1 สำหรับรับการแจ้งเตือนจากระบบ"),
  bullet("เพิ่มหรือแก้ไข Email 2"),
  bullet("เพิ่มหรือแก้ไขเบอร์โทร"),
  bullet("กด บันทึกการแก้ไข เมื่อข้อมูลถูกต้อง"),
  h2("เปลี่ยนรหัสผ่าน"),
  step("เลือกแท็บ เปลี่ยนรหัสผ่าน"),
  step("กรอกรหัสผ่านปัจจุบัน"),
  step("กรอกรหัสผ่านใหม่"),
  step("กรอกยืนยันรหัสผ่านใหม่ให้ตรงกัน"),
  step("กด เปลี่ยนรหัสผ่าน"),
  h1("10. การสลับระบบและออกจากระบบ"),
  bullet("กด สลับระบบ เพื่อกลับไปหน้าเลือกเข้าใช้งานระบบ"),
  bullet("กด ออกจากระบบ เมื่อต้องการสิ้นสุดการใช้งาน โดยเฉพาะเมื่อใช้เครื่องส่วนกลาง"),
  bullet("ผู้ที่มีสิทธิ์ Lead, Assistant Manager หรือ Manager อาจเห็นปุ่ม จัดการทีม เพิ่มเติม"),
  h1("11. ปัญหาที่พบบ่อย"),
  table(["ปัญหา", "แนวทางแก้ไข"], [
    ["ไม่เห็นข้อมูลวันลาคงเหลือ", "ติดต่อ HR หรือผู้ดูแลระบบเพื่อตรวจสอบสิทธิ์วันลาประจำปี"],
    ["เลือกวันลาไม่ได้", "ตรวจสอบว่าไม่ได้เลือกวันเสาร์หรือวันอาทิตย์ และวันที่สิ้นสุดไม่น้อยกว่าวันเริ่มต้น"],
    ["ส่งคำขอไม่ได้", "ตรวจสอบว่ากรอกประเภท วันที่ เวลา และเหตุผลครบถ้วน รวมถึงไฟล์แนบเป็นรูปภาพหรือ PDF"],
    ["ต้องการแก้คำขอที่ส่งไปแล้ว", "หากยังรออนุมัติ ให้ยกเลิกคำขอเดิมแล้วส่งใหม่ หากอนุมัติแล้วให้ติดต่อผู้อนุมัติหรือ HR"],
    ["เปลี่ยนรหัสผ่านไม่ได้", "ตรวจสอบว่ากรอกรหัสผ่านปัจจุบันถูกต้อง และยืนยันรหัสผ่านใหม่ตรงกัน"],
    ["ส่งเวลา Event ไม่ได้", "ตรวจสอบว่า Event ยังไม่ถูกล็อก สถานะไม่ใช่รอยืนยันหรือยืนยันแล้ว และแนบไฟล์ในรูปแบบที่รองรับ"],
  ], [3000, 6360]),
  h1("12. Checklist ก่อนส่งคำขอ"),
  table(["ตรวจสอบ", "รายละเอียด"], [
    ["ประเภทการลา", "เลือกประเภทถูกต้องและยอดคงเหลือเพียงพอ"],
    ["วันที่/เวลา", "วันและเวลาถูกต้อง ไม่เป็นวันเสาร์หรืออาทิตย์ และช่วงเวลาสมเหตุสมผล"],
    ["เหตุผล", "ระบุเหตุผลครบถ้วน ชัดเจน และตรงกับประเภทการลา"],
    ["ไฟล์แนบ", "แนบหลักฐานที่จำเป็น และไฟล์เป็นรูปภาพหรือ PDF"],
    ["สถานะหลังส่ง", "ตรวจสอบว่ารายการขึ้นสถานะรออนุมัติในประวัติการลา"],
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
write("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>คู่มือการใช้งานระบบลางาน</dc:title><dc:creator>CKAP Management System</dc:creator><cp:lastModifiedBy>CKAP Management System</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
write("docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>CKAP Management System</Application></Properties>`);

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
const zipPath = path.join(outDir, "user-manual.zip");
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execFileSync("powershell", [
  "-NoProfile",
  "-Command",
  `Compress-Archive -Path '${tmp}\\*' -DestinationPath '${zipPath}' -Force`,
], { stdio: "inherit" });
fs.renameSync(zipPath, outPath);
fs.rmSync(tmp, { recursive: true, force: true });

console.log(outPath);
