import { eq } from "drizzle-orm";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { getDb as getDbInternal } from './database';
import { logger } from './logger';

// Exportar getDb para uso nos routers
export const getDb = getDbInternal;

/**
 * Obter instância do Drizzle ORM para banco Logística
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = getDbInternal('logistica');
  if (!db) {
    logger.warn('Database', "Cannot upsert user: database not available");
    throw new Error("Database not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL: use ON CONFLICT DO UPDATE
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error: any) {
    logger.error('Database', "Failed to upsert user", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDbInternal('logistica');
  if (!db) {
    logger.warn('Database', "Cannot get user: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error: any) {
    logger.error('Database', "Failed to get user", error instanceof Error ? error : new Error(String(error)));
    return undefined;
  }
}

// TODO: add feature queries here as your schema grows.
