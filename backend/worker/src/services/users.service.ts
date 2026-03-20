import { createUser, deleteUser, getUserById, listUsers, updateUser } from '../repositories/users';
import type { CreateUserBody, Env, UpdateUserBody } from '../types';

export async function listUsersService(env: Env) {
  return listUsers(env);
}

export async function getUserByIdService(env: Env, userId: string) {
  return getUserById(env, userId);
}

export async function createUserService(env: Env, body: CreateUserBody) {
  return createUser(env, body);
}

export async function updateUserService(env: Env, userId: string, body: UpdateUserBody) {
  return updateUser(env, userId, body);
}

export async function deleteUserService(env: Env, userId: string) {
  return deleteUser(env, userId);
}
