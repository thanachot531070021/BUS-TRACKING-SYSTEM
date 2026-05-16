ให้ทำการแก้ไขและเพิ่มฟีเจอร์ในโปรเจกต์ Flutter (3.41.9 / Dart ≥ 3.3) โดยใช้ Supabase เป็น Backend และ Provider เป็น State Management ตามรายละเอียดโครงสร้าง UI/UX ใหม่ด้านล่างนี้ โดยเน้นจัด Layout ให้สวยงาม คลีน และใช้งานง่ายเหมือนแอป Grab

1. เพิ่มหน้าจอลงทะเบียน (Register Screen)
Target: สร้างหน้าสำหรับบุคคลทั่วไป (Passenger) เพื่อลงทะเบียนเข้าใช้งาน
UI Components:
Form Fields: ชื่อ-นามสกุล (Full Name), เบอร์โทรศัพท์ (Phone Number), อีเมล (Email), และรหัสผ่าน (Password)
ปุ่ม "ลงทะเบียน" (Register Button) ไฮไลท์สีเด่นชัด ต้องมี Facebook gooogle
Logic (Supabase Integration):
เมื่อกดลงทะเบียน ให้ใช้ Supabase.instance.client.auth.signUp()
หลังจากสร้าง Account สำเร็จ ให้ Insert ข้อมูลลงใน Table profiles (หรือ Table ที่เก็บ User Data) โดยให้กำหนด Default Role เป็น 'passenger' โดยอัตโนมัติ
2. ปรับโครงสร้างหน้าหลักผู้โดยสาร (Passenger Main Layout)
ให้แก้หน้าหลักฝั่งผู้โดยสารให้เป็นแบบ Main Dashboard Layout โดยควบคุมด้วย Bottom Navigation Bar และมี Top Bar อยู่ด้านบนสุดตลอดเวลาในหน้าหลัก
2.1 โครงสร้าง Top Bar (สไตล์ Grab)
ให้ทำเป็น Custom Widget หรือ Floating Bar วางอยู่ด้านบนสุดของหน้าหลัก ประกอบด้วย:
ด้านขวา (): Profile Icon (วงกลม Avatar) เมื่อกดแล้วจะเปิดหน้าต่างข้อมูลส่วนตัว (My Profile Screen) แสดงชื่อ-นามสกุล และปุ่ม Logout
ตรงกลาง (Center): Search Bar แถบค้นหา "สายรถ" หรือ "จุดหมายปลายทาง"
 ด้านซ้าย(): ปุ่มสแกน QR Code (Scan Icon) เตรียม Widget ให้พร้อมสำหรับเรียกใช้งานกล้องเพื่อสแกนในอนาคต
2.2 โครงสร้าง Bottom Navigation Bar (4 เมนูหลัก)
ให้ใช้ IndexedStack ในการจัดการหน้าจอเพื่อป้องกันไม่ให้หน้าแผนที่โหลดใหม่ทุกครั้งที่สลับเมนู โดยแบ่งเป็น 4 แท็บดังนี้:
หน้าหลัก (Home Screen):
แสดง Google Maps เต็มจอ (google_maps_flutter) ด้านหลัง
มี SlidingUpPanel หรือ BottomSheet ด้านล่างที่ดึงขึ้นมาได้ ด้านในแสดงรายชื่อสายรถที่เปิดวิ่งอยู่ และปุ่มลัดสำหรับกด "แจ้งรอรถ"
สิ่งที่น่าสนใจ (Explore Screen):
หน้ารวมข่าวสาร ประกาศ (Announcements) หรือโปรโมชัน
จัด Layout ด้วย ListView แสดงผลเป็นการ์ด (Cards) สวยงาม
รายการ (Activity Screen):
แบ่งเป็น 2 แท็บย่อย (Tab Controller):
แท็บ 1 (Active): แสดงสถานะรถที่กำลังกดรออยู่ปัจจุบัน (พร้อมปุ่ม "ยกเลิกการรอรถ")
แท็บ 2 (History): ประวัติการเดินทางย้อนหลัง (ดึงข้อมูลจากประวัติการแจ้งรอรถ)
ข้อความ (Inbox Screen):
แบ่งเป็น 2 แท็บย่อย (Tab Controller):
แท็บ 1 (Notifications): รายการแจ้งเตือนจากระบบ (เช่น "รถกำลังจะถึงจุดจอด")
แท็บ 2 (Chat): หน้ารวมห้องแชท (สำหรับติดต่ออนาคต)

3. สิ่งที่ต้องระวังในการ Code (Technical Constraints)
State Management: ใช้ Provider ในการควบคุมการสลับหน้า (Bottom Nav Index) และดึงข้อมูลโปรไฟล์ผู้ใช้งานจาก Supabase มาแสดงในหน้าปัจจุบัน
UI/UX: เน้นการใช้สี แอนิเมชันตอนกดเปลี่ยนเมนู และระยะห่าง (Padding/Margin) ให้ดูพรีเมียม ลื่นไหล และคล้ายคลึงกับแอปพลิเคชัน Grab


