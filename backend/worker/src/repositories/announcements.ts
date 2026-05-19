import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { Announcement, CreateAnnouncementBody, Env, JsonRecord, UpdateAnnouncementBody } from '../types';

const ANNOUNCEMENT_SELECT = 'id,title,subtitle,tag,type,tone,icon_emoji,cta_text,cta_url,image_url,sort_order,is_active,starts_at,ends_at,created_by,updated_by,created_at,updated_at';

/** Public: active announcements, not expired, ordered by sort_order */
export async function listActiveAnnouncements(env: Env): Promise<Announcement[]> {
  if (!usingSupabase(env)) return _mockAnnouncements();
  const now = new Date().toISOString();
  // is_active=true AND (ends_at is null OR ends_at > now)
  return supabaseFetch<Announcement[]>(
    env,
    `announcements?select=${ANNOUNCEMENT_SELECT}&is_active=eq.true&or=(ends_at.is.null,ends_at.gt.${now})&order=sort_order.asc,created_at.desc`,
  );
}

/** Admin: all announcements */
export async function listAllAnnouncements(env: Env): Promise<Announcement[]> {
  if (!usingSupabase(env)) return _mockAnnouncements();
  return supabaseFetch<Announcement[]>(env, `announcements?select=${ANNOUNCEMENT_SELECT}&order=sort_order.asc,created_at.desc`);
}

export async function getAnnouncementById(env: Env, id: string): Promise<Announcement | null> {
  if (!usingSupabase(env)) return _mockAnnouncements().find(a => a.id === id) ?? null;
  const rows = await supabaseFetch<Announcement[]>(env, `announcements?select=${ANNOUNCEMENT_SELECT}&id=eq.${id}&limit=1`);
  return rows[0] ?? null;
}

export async function createAnnouncement(env: Env, body: CreateAnnouncementBody, userId?: string | null): Promise<Announcement> {
  if (!usingSupabase(env)) {
    return { id: crypto.randomUUID(), title: body.title, type: body.type ?? 'news', tone: body.tone ?? 'info', sort_order: body.sortOrder ?? 0, is_active: body.isActive ?? true } as Announcement;
  }
  const created = await supabaseFetch<JsonRecord[]>(env, 'announcements', {
    method: 'POST',
    body: JSON.stringify([{
      title:       body.title,
      subtitle:    body.subtitle ?? null,
      tag:         body.tag ?? null,
      type:        body.type ?? 'news',
      tone:        body.tone ?? 'info',
      icon_emoji:  body.iconEmoji ?? null,
      cta_text:    body.ctaText ?? null,
      cta_url:     body.ctaUrl ?? null,
      image_url:   body.imageUrl ?? null,
      sort_order:  body.sortOrder ?? 0,
      is_active:   body.isActive ?? true,
      starts_at:   body.startsAt ?? null,
      ends_at:     body.endsAt ?? null,
      created_by:  userId ?? null,
      updated_by:  userId ?? null,
    }]),
  });
  return created[0] as Announcement;
}

export async function updateAnnouncement(env: Env, id: string, body: UpdateAnnouncementBody, userId?: string | null): Promise<Announcement> {
  if (!usingSupabase(env)) return { id, ...body } as Announcement;
  const patch: JsonRecord = { updated_by: userId ?? null };
  if (body.title       !== undefined) patch.title       = body.title;
  if (body.subtitle    !== undefined) patch.subtitle    = body.subtitle;
  if (body.tag         !== undefined) patch.tag         = body.tag;
  if (body.type        !== undefined) patch.type        = body.type;
  if (body.tone        !== undefined) patch.tone        = body.tone;
  if (body.iconEmoji   !== undefined) patch.icon_emoji  = body.iconEmoji;
  if (body.ctaText     !== undefined) patch.cta_text    = body.ctaText;
  if (body.ctaUrl      !== undefined) patch.cta_url     = body.ctaUrl;
  if (body.imageUrl    !== undefined) patch.image_url   = body.imageUrl;
  if (body.sortOrder   !== undefined) patch.sort_order  = body.sortOrder;
  if (body.isActive    !== undefined) patch.is_active   = body.isActive;
  if (body.startsAt    !== undefined) patch.starts_at   = body.startsAt;
  if (body.endsAt      !== undefined) patch.ends_at     = body.endsAt;
  const updated = await supabaseFetch<JsonRecord[]>(env, `announcements?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return updated[0] as Announcement;
}

export async function deleteAnnouncement(env: Env, id: string) {
  if (!usingSupabase(env)) return { id, deleted: true };
  await supabaseFetch<JsonRecord[]>(env, `announcements?id=eq.${id}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return { id, deleted: true };
}

function _mockAnnouncements(): Announcement[] {
  return [
    { id: 'mock-1', title: 'เพื่อนใหม่รับฟรีเครดิต 50 บาท', subtitle: 'ใช้ได้ทุกเส้นทาง · หมดเขต 31 พ.ค.', tag: 'โปรโมชั่นเดือนนี้', type: 'promo', tone: 'promo', icon_emoji: '🎉', cta_text: 'รับเครดิต', sort_order: 0, is_active: true },
    { id: 'mock-2', title: 'R-08 ปรับเปลี่ยนเส้นทางชั่วคราว', subtitle: 'เนื่องจากการก่อสร้างถนนรอบเมือง · 12–18 พ.ค.', tag: 'แจ้งเตือนบริการ', type: 'announcement', tone: 'warning', icon_emoji: '⚠️', sort_order: 1, is_active: true },
    { id: 'mock-3', title: 'เพิ่มจุดรอใหม่ได้แล้ว 5 จังหวัด', subtitle: 'เชียงใหม่ · ขอนแก่น · ภูเก็ต · ชลบุรี · นครราชสีมา', tag: 'ฟีเจอร์ใหม่', type: 'news', tone: 'success', icon_emoji: '⚡', sort_order: 2, is_active: true },
    { id: 'mock-4', title: 'งดให้บริการ R-04 วันหยุดราชการ', subtitle: 'วันจันทร์ที่ 20 พ.ค. งดให้บริการทั้งวัน', tag: 'ประกาศ', type: 'announcement', tone: 'info', icon_emoji: '📢', sort_order: 3, is_active: true },
  ];
}
