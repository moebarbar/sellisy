import { users, type User } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

interface UpsertByClerkArgs {
  clerkUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByClerkId(clerkUserId: string): Promise<User | undefined>;
  upsertUserByClerkId(args: UpsertByClerkArgs): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByClerkId(clerkUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId));
    return user;
  }

  async upsertUserByClerkId(args: UpsertByClerkArgs): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        clerkUserId: args.clerkUserId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        profileImageUrl: args.profileImageUrl,
      })
      .onConflictDoUpdate({
        target: users.clerkUserId,
        set: {
          email: args.email,
          firstName: args.firstName,
          lastName: args.lastName,
          profileImageUrl: args.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
