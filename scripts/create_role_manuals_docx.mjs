import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, "docs");
const now = new Date().toISOString();

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function tc(text, width, isHeader) {
  const fill = isHeader ? `<w:shd w:fill="E8EEF5"/>` : "";
  const style = isHeader ? "TableHeader" : "TableBody";
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p></w:tc>`;
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
    <w:tblGrid>${grid}</w:tblGrid>${header}${body}
  </w:tbl>`;
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

const leadContent = [
  p("คู่มือการใช้งานระบบลางานสำหรับ Lead", "Title"),
  p("CKAP Leave Management System", "Subtitle"),
  p("เอกสารนี้อธิบายการใช้งานสำหรับบทบาท Lead โดยเน้นการตรวจสอบคำขอลาของทีม การอนุมัติหรือปฏิเสธคำขอ การดูข้อมูลพนักงานในความรับผิดชอบ และการจัดการผู้เข้าร่วม Event ที่ Lead ได้รับมอบหมาย", "Lead"),
  callout("ขอบเขตของ Lead", [
    "เห็นข้อมูลคำขอลาและพนักงานตามทีม/แผนกที่อยู่ในความรับผิดชอบ",
    "อนุมัติได้เฉพาะคำขอที่ระบบระบุว่า รอคุณอนุมัติ",
    "เลือกสมาชิกเข้า Event ได้เมื่อ Lead ถูกกำหนดเป็นผู้รับผิดชอบ Event นั้น",
  ]),
  h1("1. การเข้าสู่หน้าจอ Lead"),
  step("เข้าสู่ระบบด้วยรหัสพนักงานและรหัสผ่าน"),
  step("หากบัญชีมีสิทธิ์ Lead ระบบจะพาเข้าสู่หน้าจัดการทีม หรือสามารถกด จัดการทีม จากหน้า Dashboard"),
  step("ใช้ปุ่ม คำขอลา, พนักงาน และ Event เพื่อเปลี่ยนแท็บการทำงาน"),
  step("กด ใบลาของฉัน เมื่อต้องการกลับไปหน้า Dashboard ส่วนตัว"),
  h1("2. ภาพรวมหน้าจอ"),
  table(["แท็บ", "หน้าที่หลัก"], [
    ["คำขอลา", "ดูรายการคำขอลาของทีม กรองสถานะ ค้นหาพนักงาน และอนุมัติ/ปฏิเสธคำขอที่ถึงคิวของ Lead"],
    ["พนักงาน", "ดูรายชื่อพนักงาน สิทธิ์รวม ใช้ไปแล้ว วันลาคงเหลือ และเปิดดูประวัติการลารายบุคคล"],
    ["Event", "ดู Event ที่เกี่ยวข้อง เลือกคนเข้า Event และเปิดดูรายละเอียด/เวลา Event"],
  ], [1800, 7560]),
  h1("3. การตรวจสอบและกรองคำขอลา"),
  bullet("การ์ดด้านบนแสดงจำนวนคำขอ รออนุมัติ, อนุมัติแล้ว และปฏิเสธ"),
  bullet("ใช้ช่องค้นหาเพื่อค้นหาจากชื่อหรือรหัสพนักงาน"),
  bullet("ใช้ตัวกรองสถานะ ทั้งหมด, รออนุมัติ, อนุมัติแล้ว, ปฏิเสธ"),
  bullet("ใช้ตัวกรองเวลา ทั้งหมด, รายปี หรือรายเดือน เพื่อจำกัดช่วงข้อมูล"),
  bullet("กด รีเฟรช เพื่อโหลดข้อมูลล่าสุด"),
  h1("4. การอ่านสถานะ workflow"),
  p("รายการคำขอลาของ Lead มีข้อความความคืบหน้าเพื่อบอกว่าคำขออยู่ในขั้นใดของสายอนุมัติ"),
  table(["ข้อความ", "ความหมาย"], [
    ["รอคุณอนุมัติ", "คำขอนี้อยู่ในคิวของ Lead และสามารถกดอนุมัติหรือปฏิเสธได้"],
    ["ส่งต่อแล้ว: รอ ...", "Lead ดำเนินการแล้ว และระบบส่งต่อไปยังผู้อนุมัติถัดไป"],
    ["อนุมัติครบแล้ว", "คำขอผ่านครบทุกขั้นตอนแล้ว"],
    ["ปฏิเสธแล้ว", "คำขอถูกปฏิเสธแล้ว"],
  ], [3000, 6360]),
  h1("5. การเปิดดูรายละเอียดคำขอ"),
  step("คลิกแถวคำขอที่ต้องการตรวจสอบ"),
  step("ตรวจสอบข้อมูลพนักงาน ประเภทการลา วันที่/เวลา จำนวน เหตุผล และไฟล์แนบ"),
  step("หากเป็นคำขอที่ Lead อนุมัติได้ ระบบจะแสดงปุ่ม อนุมัติ และ ปฏิเสธ ที่ด้านล่าง"),
  step("กดปิดเพื่อกลับไปหน้ารายการ"),
  h1("6. การอนุมัติคำขอ"),
  step("ตรวจสอบรายละเอียดคำขอและไฟล์แนบให้ครบถ้วน"),
  step("กด อนุมัติ จากตารางหรือจากหน้ารายละเอียด"),
  step("ยืนยันการดำเนินการในหน้าต่างยืนยัน"),
  step("หลังอนุมัติ สถานะอาจเปลี่ยนเป็นส่งต่อไปยังผู้อนุมัติถัดไป หรืออนุมัติครบแล้วตาม workflow"),
  h1("7. การปฏิเสธคำขอ"),
  step("เปิดคำขอที่ต้องการปฏิเสธ"),
  step("กด ปฏิเสธ"),
  step("กรอกหมายเหตุให้ชัดเจนเพื่อให้พนักงานเข้าใจเหตุผล"),
  step("ยืนยันการปฏิเสธ"),
  callout("แนวทางการใส่หมายเหตุ", [
    "ระบุเหตุผลตรงประเด็น เช่น ข้อมูลไม่ครบ, วันไม่ถูกต้อง, เอกสารประกอบไม่พอ",
    "หลีกเลี่ยงข้อความสั้นเกินไปที่ผู้ขอไม่สามารถแก้ไขต่อได้",
  ]),
  h1("8. การดูข้อมูลพนักงานในทีม"),
  step("เปิดแท็บ พนักงาน"),
  step("ค้นหาชื่อหรือรหัสพนักงาน หรือกรองตามแผนก"),
  step("ดูสิทธิ์รวม ใช้ไปแล้ว และวันลาคงเหลือจากตาราง"),
  step("คลิกแถวพนักงานเพื่อเปิดประวัติการลารายบุคคล"),
  p("หากปุ่ม กำหนดวันลา แสดงขึ้น หมายถึงบัญชีมีสิทธิ์ปรับสิทธิ์วันลาของพนักงานคนนั้นตามเงื่อนไขระบบ"),
  h1("9. การจัดการ Event สำหรับ Lead"),
  p("Lead ไม่ได้สร้าง Event เองจากหน้าจอนี้ แต่สามารถเลือกสมาชิกเข้า Event ได้เมื่อ Event นั้นกำหนด Lead เป็นผู้รับผิดชอบ"),
  step("เปิดแท็บ Event"),
  step("คลิกปุ่ม เลือกคนเข้า Event ในรายการที่เกี่ยวข้อง"),
  step("เลือกรายชื่อสมาชิกที่ต้องเข้าร่วมจากทีมของ Lead"),
  step("กดบันทึกรายชื่อผู้เข้าร่วม"),
  step("คลิกแถว Event เพื่อดูรายละเอียด ช่วงเวลา ผู้เข้าร่วม และรายงานเวลาที่ส่งมา"),
  h1("10. Checklist สำหรับ Lead"),
  table(["รายการตรวจสอบ", "รายละเอียด"], [
    ["ตรวจคำขอ", "ดูประเภท วัน เวลา จำนวน และเหตุผลก่อนอนุมัติ"],
    ["ตรวจไฟล์แนบ", "เปิดดูเอกสารประกอบเมื่อคำขอจำเป็นต้องมีหลักฐาน"],
    ["ตรวจ workflow", "ดำเนินการเฉพาะรายการที่ขึ้นว่า รอคุณอนุมัติ"],
    ["หมายเหตุปฏิเสธ", "ใส่เหตุผลที่ช่วยให้ผู้ขอแก้ไขได้"],
    ["Event", "เลือกผู้เข้าร่วมให้ครบตามทีมที่รับผิดชอบ"],
  ], [2600, 6760]),
];

const managerContent = [
  p("คู่มือการใช้งานระบบลางานสำหรับ Manager", "Title"),
  p("CKAP Leave Management System", "Subtitle"),
  p("เอกสารนี้อธิบายการใช้งานสำหรับบทบาท Manager โดยครอบคลุมการอนุมัติคำขอลา การตรวจสอบพนักงานและสิทธิ์วันลา การดูภาพรวม Report และการจัดการ Event ตั้งแต่สร้าง Event เลือกผู้รับผิดชอบ เลือกผู้เข้าร่วม ตรวจเวลา และพิมพ์รายงาน", "Lead"),
  callout("ขอบเขตของ Manager", [
    "เห็นข้อมูลตามขอบเขตแผนก/ทีมที่ระบบกำหนดให้",
    "อนุมัติหรือปฏิเสธคำขอลาที่อยู่ในความรับผิดชอบ",
    "สร้างและจัดการ Event รวมถึงบันทึกเวลาแทน ตรวจเวลา และพิมพ์รายงาน Event",
  ]),
  h1("1. การเข้าสู่หน้าจอ Manager"),
  step("เข้าสู่ระบบด้วยบัญชี Manager หรือ Assistant Manager"),
  step("ระบบจะเข้าสู่หน้าจัดการ หรือกด จัดการทีม จาก Dashboard ส่วนตัว"),
  step("ใช้เมนู คำขอลา, พนักงาน, Event และ ภาพรวม (Report) เพื่อเลือกงานที่ต้องการ"),
  step("กด ใบลาของฉัน เพื่อกลับไปยื่นใบลาหรือตรวจประวัติของตนเอง"),
  h1("2. ภาพรวมเมนูของ Manager"),
  table(["แท็บ", "ใช้สำหรับ"], [
    ["คำขอลา", "ตรวจสอบ อนุมัติ หรือปฏิเสธคำขอลาของพนักงานในขอบเขต"],
    ["พนักงาน", "ดูรายชื่อพนักงาน สิทธิ์วันลา ประวัติการลา และกำหนดวันลาเมื่อมีสิทธิ์"],
    ["Event", "สร้าง Event เลือกผู้รับผิดชอบ เลือกผู้เข้าร่วม ตรวจ/บันทึก/ลบเวลา และพิมพ์รายงาน"],
    ["ภาพรวม (Report)", "ดูสรุปทีม จำนวนพนักงาน คำขอรออนุมัติ สถิติทีม และพนักงานที่วันลาเหลือน้อย"],
  ], [2200, 7160]),
  h1("3. การจัดการคำขอลา"),
  bullet("การ์ดสรุปด้านบนแสดงจำนวนคำขอรออนุมัติ อนุมัติแล้ว และปฏิเสธ"),
  bullet("ค้นหาจากชื่อหรือรหัสพนักงานได้จากช่องค้นหา"),
  bullet("กรองสถานะและช่วงเวลาได้จากตัวกรองในแท็บคำขอลา"),
  bullet("คลิกแถวเพื่อเปิดรายละเอียดและตรวจไฟล์แนบ"),
  h2("การอนุมัติ"),
  step("ตรวจสอบรายละเอียดคำขอ วันที่/เวลา จำนวน เหตุผล และหลักฐาน"),
  step("กด อนุมัติ จากตารางหรือหน้ารายละเอียด"),
  step("ยืนยันการอนุมัติในหน้าต่างยืนยัน"),
  step("กด รีเฟรช หากต้องการตรวจสอบรายการล่าสุด"),
  h2("การปฏิเสธ"),
  step("เปิดคำขอที่ต้องการปฏิเสธ"),
  step("กด ปฏิเสธ"),
  step("กรอกหมายเหตุเพื่อแจ้งเหตุผลให้ผู้ขอทราบ"),
  step("ยืนยันการปฏิเสธ"),
  pageBreak(),
  h1("4. การดูและจัดการพนักงาน"),
  step("เปิดแท็บ พนักงาน"),
  step("ค้นหาชื่อหรือรหัสพนักงาน หรือเลือกแผนกจากตัวกรอง"),
  step("ตรวจสิทธิ์รวม ใช้ไปแล้ว และวันลาคงเหลือจากตาราง"),
  step("คลิกแถวพนักงานเพื่อดูประวัติการลารายบุคคล"),
  step("หากมีสิทธิ์ ให้กด กำหนดวันลา เพื่อปรับสิทธิ์วันลาของพนักงาน"),
  callout("ข้อควรระวังในการกำหนดวันลา", [
    "ตรวจสอบปีที่กำหนดสิทธิ์ให้ถูกต้อง",
    "ปรับเฉพาะกรณีได้รับอนุมัติจาก HR หรือผู้รับผิดชอบนโยบายวันลา",
    "ตรวจยอดหลังบันทึกเพื่อป้องกันการกรอกผิด",
  ]),
  h1("5. ภาพรวม (Report)"),
  p("แท็บภาพรวมช่วยให้ Manager ตรวจสถานะทีมในภาพรวม เช่น จำนวนพนักงาน คำขอรออนุมัติ คำขอล่าสุด โครงสร้างทีม และพนักงานที่วันลาเหลือน้อย"),
  bullet("ใช้เพื่อดูงานค้างอนุมัติและวางแผนกำลังคน"),
  bullet("ดูสรุปทีมตามหัวหน้าเพื่อเข้าใจภาระงานของแต่ละทีม"),
  bullet("ดูพนักงานที่วันลาเหลือน้อยเพื่อประเมินความเสี่ยงด้านแผนงาน"),
  h1("6. การสร้าง Event"),
  step("เปิดแท็บ Event"),
  step("กด สร้าง Event"),
  step("กรอกชื่อ Event"),
  step("เลือกวันที่เริ่มและวันที่สิ้นสุด"),
  step("เลือกผู้รับผิดชอบอย่างน้อย 1 คนจากรายชื่อ Lead/ผู้เกี่ยวข้องที่ระบบแสดง"),
  step("กรอกรายละเอียดเพิ่มเติมถ้ามี"),
  step("กดบันทึกเพื่อสร้าง Event"),
  callout("เงื่อนไขสำคัญ", [
    "ต้องระบุชื่อ Event",
    "ต้องเลือกผู้รับผิดชอบอย่างน้อย 1 คน",
    "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น",
  ]),
  h1("7. การเลือกผู้เข้าร่วม Event"),
  step("จากรายการ Event กด เลือกคนเข้า Event"),
  step("ระบบจะแสดงสมาชิกจากทีมของผู้รับผิดชอบ/Lead ที่เกี่ยวข้อง"),
  step("เลือกรายชื่อพนักงานที่ต้องเข้าร่วม"),
  step("กดบันทึกเพื่ออัปเดตรายชื่อผู้เข้าร่วม"),
  p("ผู้เข้าร่วมที่ถูกเลือกจะเห็น Event ในหน้า Dashboard ของตนเองและสามารถส่งเวลาเข้า-ออกพร้อมหลักฐานได้"),
  h1("8. การตรวจและบันทึกเวลา Event"),
  step("คลิกแถว Event เพื่อเปิดรายละเอียด Event"),
  step("ตรวจรายการเวลาที่พนักงานส่งเข้ามา รวมถึงสถานะและหลักฐานแนบ"),
  step("กด ยืนยัน เพื่ออนุมัติเวลา หรือ ปฏิเสธ เมื่อข้อมูลไม่ถูกต้อง"),
  step("หากจำเป็น Manager สามารถบันทึกเวลา Event แทนผู้เข้าร่วมได้ โดยเลือกผู้เข้าร่วม วันที่ เวลาเข้า และเวลาออก"),
  step("สามารถลบบันทึกเวลา Event ที่ผิดพลาดได้จากหน้ารายละเอียด"),
  table(["สถานะเวลา Event", "ความหมาย"], [
    ["ยังไม่ส่ง", "ผู้เข้าร่วมยังไม่ส่งเวลาเข้า-ออก"],
    ["รอยืนยัน", "ผู้เข้าร่วมส่งข้อมูลแล้ว รอ Manager/ผู้รับผิดชอบตรวจสอบ"],
    ["ยืนยันแล้ว", "ข้อมูลเวลาผ่านการตรวจสอบแล้ว"],
    ["ปฏิเสธ", "ข้อมูลเวลาไม่ผ่าน ให้ตรวจหมายเหตุและให้ผู้เข้าร่วมแก้ไข"],
  ], [2600, 6760]),
  h1("9. การพิมพ์รายงาน Event"),
  step("เปิดรายละเอียด Event"),
  step("ตรวจว่ารายชื่อและเวลาที่ต้องการพิมพ์ถูกต้อง"),
  step("กดปุ่มพิมพ์รายงาน Event"),
  step("ระบบจะเปิดหน้าพิมพ์พร้อมตารางรายชื่อ วันที่ เวลาเข้า เวลาออก และช่องลงชื่อ"),
  step("ตรวจ preview ของ browser แล้วสั่งพิมพ์หรือบันทึกเป็น PDF"),
  h1("10. การลบข้อมูล Event"),
  bullet("Manager สามารถลบ Event ได้จากรายการ Event หรือหน้ารายละเอียดตามสิทธิ์ที่ระบบกำหนด"),
  bullet("ก่อนลบ ระบบจะแสดง popup ยืนยัน พร้อมชื่อ Event ช่วงเวลา และจำนวนผู้เข้าร่วม"),
  bullet("เมื่อลบ Event ข้อมูลผู้เข้าร่วม รายงานเวลา และไฟล์หลักฐานที่เกี่ยวข้องจะถูกลบตามไปด้วย"),
  h1("11. Checklist สำหรับ Manager"),
  table(["งาน", "ตรวจสอบก่อนจบงาน"], [
    ["คำขอลา", "ตรวจรายละเอียดและหลักฐานก่อนอนุมัติ/ปฏิเสธ"],
    ["หมายเหตุ", "ใส่เหตุผลชัดเจนเมื่อปฏิเสธ"],
    ["พนักงาน", "ตรวจยอดวันลาหลังปรับสิทธิ์ทุกครั้ง"],
    ["Report", "ตรวจรายการรออนุมัติและพนักงานวันลาเหลือน้อยเป็นประจำ"],
    ["Event", "เลือกผู้รับผิดชอบและผู้เข้าร่วมครบถ้วน"],
    ["เวลา Event", "ตรวจเวลาและหลักฐานก่อนยืนยันหรือพิมพ์รายงาน"],
    ["การลบ", "ลบเฉพาะข้อมูลที่สร้างผิดหรือยกเลิกจริง"],
  ], [2400, 6960]),
];

function writePackage(tmp, rel, content) {
  const filePath = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function buildDocx({ filename, title, content }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `ckap-${filename}-`));
  const outPath = path.join(outDir, `${filename}.docx`);

  writePackage(tmp, "[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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

  writePackage(tmp, "_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

  writePackage(tmp, "word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`);

  writePackage(tmp, "word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${content.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`);

  writePackage(tmp, "word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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

  writePackage(tmp, "word/numbering.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
  <w:abstractNum w:abstractNumId="2"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>`);

  writePackage(tmp, "word/settings.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/></w:settings>`);
  writePackage(tmp, "docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>CKAP Management System</dc:creator><cp:lastModifiedBy>CKAP Management System</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
  writePackage(tmp, "docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>CKAP Management System</Application></Properties>`);

  fs.mkdirSync(outDir, { recursive: true });
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  const zipPath = path.join(outDir, `${filename}.zip`);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${tmp}\\*' -DestinationPath '${zipPath}' -Force`], { stdio: "inherit" });
  fs.renameSync(zipPath, outPath);
  fs.rmSync(tmp, { recursive: true, force: true });
  return outPath;
}

const outputs = [
  buildDocx({ filename: "lead-manual", title: "คู่มือการใช้งานระบบลางานสำหรับ Lead", content: leadContent }),
  buildDocx({ filename: "manager-manual", title: "คู่มือการใช้งานระบบลางานสำหรับ Manager", content: managerContent }),
];

for (const output of outputs) console.log(output);
