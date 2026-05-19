# 📝 การตั้งค่า Supabase สำหรับช่วง Demo

> **วัตถุประสงค์:** ใช้อีเมลสมมุติ (เช่น `test@fake.com`) ในการทดสอบระบบ  
> โดยปิดการส่งอีเมลยืนยันตัวตน เพื่อให้สมัครและ Login ได้ทันทีโดยไม่ต้องรอ

---

## ขั้นตอนการตั้งค่า

### 1. เปิด Supabase Dashboard

ไปที่ [https://supabase.com/dashboard](https://supabase.com/dashboard) แล้วเลือก Project ของคุณ

---

### 2. ปิดการยืนยัน Email

```
Authentication → Providers → Email
```

| หัวข้อ | การตั้งค่า |
|--------|-----------|
| **Confirm email** | ปิด (Toggle Off) 🔴 |

**วิธีทำ:**
1. ไปที่เมนู **Authentication** (แถบซ้าย)
2. เลือก **Providers**
3. คลิกเปิดแถบ **Email**
4. ตรงหัวข้อ **Confirm email** → เปลี่ยนสถานะเป็น **ปิด (Off)**
5. กด **Save**

---

## 💡 ผลลัพธ์หลังแก้ไข

| พฤติกรรม | ก่อนแก้ไข | หลังแก้ไข |
|---------|-----------|----------|
| สมัครด้วยอีเมลสมมุติ | ต้องกดยืนยันใน Inbox | ✅ Confirmed ทันที |
| ส่ง Confirmation Email | ส่งทุกครั้ง | ✅ ไม่ส่งเลย |
| Login หลังสมัครเสร็จ | ต้องรอยืนยัน Email ก่อน | ✅ Login ได้ทันที |

---

## ⚠️ ข้อควรระวัง

> **ห้ามใช้ Setting นี้ใน Production!**

- ตั้งค่านี้เหมาะสำหรับ **ช่วง Demo / Dev / Testing เท่านั้น**
- เมื่อขึ้น Production จริง ให้กลับมาเปิด **Confirm email → On** เสมอ
- ในโหมด Production ผู้ใช้จะยืนยัน Email ผ่านกล่องจดหมายของตัวเอง  
  หรือ Admin สามารถกดยืนยันให้ได้จากหน้า Dashboard → **ผู้ใช้งาน → ปุ่ม ✉️**

---

## 🔧 ทางเลือกสำหรับ Production

หาก Supabase อยู่ในโหมด Confirm email: On  
แต่ผู้ใช้ยังไม่ได้รับหรือยืนยันอีเมล Admin สามารถ:

1. ไปที่หน้า **Admin Dashboard → ผู้ใช้งาน**
2. มองหาแถว User ที่มีสถานะ **⏳ รอยืนยัน**
3. กดปุ่ม **✉️** ในช่อง Action
4. ยืนยันผ่าน Dialog → ระบบจะอัพเดท Supabase Auth ให้อัตโนมัติ

ผู้ใช้สามารถ Login ได้ทันทีหลังจาก Admin กดยืนยันให้

---

## 📋 Checklist ก่อนขึ้น Production

- [ ] เปิด **Confirm email** → On กลับ
- [ ] ตรวจสอบ SMTP settings (ถ้าต้องการใช้ Custom Email Server)
- [ ] ทดสอบ Email Verification flow ด้วยอีเมลจริง
- [ ] ตั้งค่า Rate Limit สำหรับ Signup/Login

---

*อัพเดทล่าสุด: 2026-05-20*
