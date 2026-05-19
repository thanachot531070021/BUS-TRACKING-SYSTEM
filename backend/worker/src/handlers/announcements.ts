import { badRequest, json, readJson } from '../lib/http';
import {
  createAnnouncementService, deleteAnnouncementService, getAnnouncementByIdService,
  listActiveAnnouncementsService, listAllAnnouncementsService, updateAnnouncementService,
} from '../services/announcements.service';
import type { AuthContext, CreateAnnouncementBody, Env, UpdateAnnouncementBody } from '../types';

/** Public: active, non-expired announcements */
export async function handleListAnnouncements(env: Env) {
  return json({ data: await listActiveAnnouncementsService(env) });
}

/** Admin: all announcements */
export async function handleAdminListAnnouncements(env: Env) {
  return json({ data: await listAllAnnouncementsService(env) });
}

export async function handleAdminGetAnnouncementById(env: Env, id: string) {
  if (!id) return badRequest('id is required');
  const item = await getAnnouncementByIdService(env, id);
  if (!item) return json({ error: 'Not found' }, 404);
  return json({ data: item });
}

export async function handleAdminCreateAnnouncement(env: Env, request: Request, auth?: AuthContext) {
  const body = await readJson<CreateAnnouncementBody>(request);
  if (!body?.title) return badRequest('title is required');
  return json({ message: 'Announcement created', data: await createAnnouncementService(env, body, auth?.userId) }, 201);
}

export async function handleAdminUpdateAnnouncement(env: Env, request: Request, id: string, auth?: AuthContext) {
  if (!id) return badRequest('id is required');
  const body = await readJson<UpdateAnnouncementBody>(request);
  return json({ message: 'Announcement updated', data: await updateAnnouncementService(env, id, body ?? {}, auth?.userId) });
}

export async function handleAdminDeleteAnnouncement(env: Env, id: string) {
  if (!id) return badRequest('id is required');
  return json({ message: 'Announcement deleted', data: await deleteAnnouncementService(env, id) });
}
