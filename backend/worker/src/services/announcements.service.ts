import {
  createAnnouncement, deleteAnnouncement, getAnnouncementById,
  listActiveAnnouncements, listAllAnnouncements, updateAnnouncement,
} from '../repositories/announcements';
import type { CreateAnnouncementBody, Env, UpdateAnnouncementBody } from '../types';

export const listActiveAnnouncementsService = (env: Env) => listActiveAnnouncements(env);
export const listAllAnnouncementsService    = (env: Env) => listAllAnnouncements(env);
export const getAnnouncementByIdService     = (env: Env, id: string) => getAnnouncementById(env, id);
export const createAnnouncementService      = (env: Env, body: CreateAnnouncementBody, userId?: string | null) => createAnnouncement(env, body, userId);
export const updateAnnouncementService      = (env: Env, id: string, body: UpdateAnnouncementBody, userId?: string | null) => updateAnnouncement(env, id, body, userId);
export const deleteAnnouncementService      = (env: Env, id: string) => deleteAnnouncement(env, id);
