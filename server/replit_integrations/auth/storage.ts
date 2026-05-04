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
    // 1. Existing row with this Clerk ID: refresh its profile fields and return.
    const byClerk = await this.getUserByClerkId(args.clerkUserId);
    if (byClerk) {
      const [updated] = await db.update(users).set({
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        profileImageUrl: args.profileImageUrl,
        updatedAt: new Date(),
      }).where(eq(users.id, byClerk.id)).returning();
      return updated;
    }

    // 2. No Clerk match, but an existing row with this email exists (probably
    //    from an earlier test instance whose users we never cleaned up).
    //    Adopt that row by stamping the new clerkUserId onto it instead of
    //    creating a duplicate that would violate the unique-email index.
    if (args.email) {
      const byEmail = await this.getUserByEmail(args.email);
      if (byEmail) {
        const [adopted] = await db.update(users).set({
          clerkUserId: args.clerkUserId,
          firstName: args.firstName,
          lastName: args.lastName,
          profileImageUrl: args.profileImageUrl,
          updatedAt: new Date(),
        }).where(eq(users.id, byEmail.id)).returning();
        return adopted;
      }
    }

    // 3. Brand new user: insert.
    const [created] = await db.insert(users).values({
      clerkUserId: args.clerkUserId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      profileImageUrl: args.profileImageUrl,
    }).returning();
    return created;
  }
}

export const authStorage = new AuthStorage();
