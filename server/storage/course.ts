// Course domain — lessons, modules, lesson progress, quizzes (questions /
// choices / attempts), certificates, and per-lesson comments. Largest
// remaining domain extracted from server/storage.ts as part of the
// Phase 1 storage split.

import { db } from "../db";
import {
  courseLessons,
  courseLessonProgress,
  courseModules,
  quizQuestions,
  quizChoices,
  quizAttempts,
  certificateIssued,
  courseLessonComments,
  orders,
  type CourseLesson,
  type InsertCourseLesson,
  type CourseLessonProgress,
  type InsertCourseLessonProgress,
  type CourseModule,
  type InsertCourseModule,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizChoice,
  type QuizAttempt,
  type InsertQuizAttempt,
  type CertificateIssued,
  type InsertCertificateIssued,
  type CourseLessonComment,
  type InsertCourseLessonComment,
} from "@shared/schema";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

export const courseStorage = {
  // ─── Course lessons ─────────────────────────────────────────────────

  async getLessonsByProduct(productId: string): Promise<CourseLesson[]> {
    return db.select().from(courseLessons)
      .where(and(eq(courseLessons.productId, productId), isNull(courseLessons.deletedAt)))
      .orderBy(courseLessons.sortOrder, courseLessons.createdAt);
  },

  async getLessonById(id: string): Promise<CourseLesson | undefined> {
    const [row] = await db.select().from(courseLessons)
      .where(and(eq(courseLessons.id, id), isNull(courseLessons.deletedAt)))
      .limit(1);
    return row;
  },

  async createLesson(data: InsertCourseLesson): Promise<CourseLesson> {
    const [row] = await db.insert(courseLessons).values(data).returning();
    return row;
  },

  async updateLesson(id: string, data: Partial<InsertCourseLesson>): Promise<CourseLesson | undefined> {
    const [row] = await db.update(courseLessons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseLessons.id, id))
      .returning();
    return row;
  },

  async softDeleteLesson(id: string): Promise<void> {
    await db.update(courseLessons)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(courseLessons.id, id));
  },

  async reorderLessons(productId: string, lessonIds: string[]): Promise<void> {
    // Set sort_order to position in the array. Run in a transaction so
    // a partial failure doesn't leave the course half-reordered.
    await db.transaction(async (tx) => {
      for (let i = 0; i < lessonIds.length; i++) {
        await tx.update(courseLessons)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(and(eq(courseLessons.id, lessonIds[i]), eq(courseLessons.productId, productId)));
      }
    });
  },

  async getLessonProgressForOrder(orderId: string): Promise<CourseLessonProgress[]> {
    return db.select().from(courseLessonProgress)
      .where(eq(courseLessonProgress.orderId, orderId));
  },

  async markLessonComplete(data: InsertCourseLessonProgress): Promise<CourseLessonProgress> {
    // Idempotent insert — if (lessonId, orderId) already exists, no-op.
    try {
      const [row] = await db.insert(courseLessonProgress).values(data).returning();
      return row;
    } catch (err: any) {
      if (err?.code === "23505") {
        const [existing] = await db.select().from(courseLessonProgress)
          .where(and(
            eq(courseLessonProgress.lessonId, data.lessonId),
            eq(courseLessonProgress.orderId, data.orderId),
          ))
          .limit(1);
        return existing;
      }
      throw err;
    }
  },

  async unmarkLessonComplete(lessonId: string, orderId: string): Promise<void> {
    await db.delete(courseLessonProgress)
      .where(and(
        eq(courseLessonProgress.lessonId, lessonId),
        eq(courseLessonProgress.orderId, orderId),
      ));
  },

  // ─── Course modules ─────────────────────────────────────────────────

  async getModulesByProduct(productId: string): Promise<CourseModule[]> {
    return db.select().from(courseModules)
      .where(and(eq(courseModules.productId, productId), isNull(courseModules.deletedAt)))
      .orderBy(courseModules.sortOrder, courseModules.createdAt);
  },

  async getModuleById(id: string): Promise<CourseModule | undefined> {
    const [row] = await db.select().from(courseModules)
      .where(and(eq(courseModules.id, id), isNull(courseModules.deletedAt)))
      .limit(1);
    return row;
  },

  async createModule(data: InsertCourseModule): Promise<CourseModule> {
    const [row] = await db.insert(courseModules).values(data).returning();
    return row;
  },

  async updateModule(id: string, data: Partial<InsertCourseModule>): Promise<CourseModule | undefined> {
    const [row] = await db.update(courseModules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseModules.id, id))
      .returning();
    return row;
  },

  async softDeleteModule(id: string): Promise<void> {
    // Soft-delete the module AND un-module all its lessons so they survive
    // (lessons aren't cascade-deleted — they become un-grouped at the top
    // of the course outline). Owner can re-assign them later.
    await db.transaction(async (tx) => {
      await tx.update(courseModules)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(courseModules.id, id));
      await tx.update(courseLessons)
        .set({ moduleId: null, updatedAt: new Date() })
        .where(eq(courseLessons.moduleId, id));
    });
  },

  async reorderModules(productId: string, moduleIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < moduleIds.length; i++) {
        await tx.update(courseModules)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(and(eq(courseModules.id, moduleIds[i]), eq(courseModules.productId, productId)));
      }
    });
  },

  // ─── Quizzes ────────────────────────────────────────────────────────

  async getQuestionsByLesson(lessonId: string): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions)
      .where(and(eq(quizQuestions.lessonId, lessonId), isNull(quizQuestions.deletedAt)))
      .orderBy(quizQuestions.sortOrder, quizQuestions.createdAt);
  },

  async getQuestionById(id: string): Promise<QuizQuestion | undefined> {
    const [row] = await db.select().from(quizQuestions)
      .where(and(eq(quizQuestions.id, id), isNull(quizQuestions.deletedAt)))
      .limit(1);
    return row;
  },

  async createQuestion(data: InsertQuizQuestion): Promise<QuizQuestion> {
    const [row] = await db.insert(quizQuestions).values(data).returning();
    return row;
  },

  async updateQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const [row] = await db.update(quizQuestions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quizQuestions.id, id))
      .returning();
    return row;
  },

  async softDeleteQuestion(id: string): Promise<void> {
    // Choices stay in DB but are unreachable through the soft-deleted question.
    await db.update(quizQuestions)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(quizQuestions.id, id));
  },

  async getChoicesByQuestion(questionId: string): Promise<QuizChoice[]> {
    return db.select().from(quizChoices)
      .where(eq(quizChoices.questionId, questionId))
      .orderBy(quizChoices.sortOrder, quizChoices.createdAt);
  },

  async getChoicesByQuestionIds(questionIds: string[]): Promise<QuizChoice[]> {
    if (questionIds.length === 0) return [];
    return db.select().from(quizChoices)
      .where(inArray(quizChoices.questionId, questionIds))
      .orderBy(quizChoices.sortOrder);
  },

  async replaceChoicesForQuestion(questionId: string, choices: { label: string; isCorrect: boolean }[]): Promise<QuizChoice[]> {
    // Wipe + re-insert. Simpler than diffing add/update/delete and choices
    // are small (typically 2-5 per question). All-or-nothing in a transaction.
    return db.transaction(async (tx) => {
      await tx.delete(quizChoices).where(eq(quizChoices.questionId, questionId));
      if (choices.length === 0) return [];
      const rows = await tx.insert(quizChoices)
        .values(choices.map((c, i) => ({
          questionId,
          label: c.label,
          isCorrect: c.isCorrect,
          sortOrder: i,
        })))
        .returning();
      return rows;
    });
  },

  async createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt> {
    const [row] = await db.insert(quizAttempts).values(data).returning();
    return row;
  },

  async getLatestPassingAttempt(lessonId: string, orderId: string): Promise<QuizAttempt | undefined> {
    const [row] = await db.select().from(quizAttempts)
      .where(and(
        eq(quizAttempts.lessonId, lessonId),
        eq(quizAttempts.orderId, orderId),
        eq(quizAttempts.passed, true),
      ))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(1);
    return row;
  },

  async hasLessonQuiz(lessonId: string): Promise<boolean> {
    const [row] = await db.select({ id: quizQuestions.id }).from(quizQuestions)
      .where(and(eq(quizQuestions.lessonId, lessonId), isNull(quizQuestions.deletedAt)))
      .limit(1);
    return !!row;
  },

  // ─── Certificates ───────────────────────────────────────────────────

  async getCertificateForOrderProduct(orderId: string, productId: string): Promise<CertificateIssued | undefined> {
    const [row] = await db.select().from(certificateIssued)
      .where(and(eq(certificateIssued.orderId, orderId), eq(certificateIssued.productId, productId)))
      .limit(1);
    return row;
  },

  async createCertificate(data: InsertCertificateIssued): Promise<CertificateIssued> {
    try {
      const [row] = await db.insert(certificateIssued).values(data).returning();
      return row;
    } catch (err: any) {
      // Idempotent: if another request already issued one, return existing.
      if (err?.code === "23505") {
        const existing = await courseStorage.getCertificateForOrderProduct(data.orderId, data.productId);
        if (existing) return existing;
      }
      throw err;
    }
  },

  async getCertificateByCode(code: string): Promise<CertificateIssued | undefined> {
    const [row] = await db.select().from(certificateIssued)
      .where(eq(certificateIssued.verificationCode, code))
      .limit(1);
    return row;
  },

  // ─── Course lesson comments ─────────────────────────────────────────

  async getCommentsByLesson(lessonId: string): Promise<CourseLessonComment[]> {
    return db.select().from(courseLessonComments)
      .where(and(eq(courseLessonComments.lessonId, lessonId), isNull(courseLessonComments.deletedAt)))
      // Pinned first (desc), then newest first
      .orderBy(desc(courseLessonComments.isPinned), desc(courseLessonComments.createdAt));
  },

  async getCommentById(id: string): Promise<CourseLessonComment | undefined> {
    const [row] = await db.select().from(courseLessonComments)
      .where(and(eq(courseLessonComments.id, id), isNull(courseLessonComments.deletedAt)))
      .limit(1);
    return row;
  },

  async createComment(data: InsertCourseLessonComment): Promise<CourseLessonComment> {
    const [row] = await db.insert(courseLessonComments).values(data).returning();
    return row;
  },

  async softDeleteComment(id: string): Promise<void> {
    await db.update(courseLessonComments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(courseLessonComments.id, id));
  },

  async editComment(id: string, body: string): Promise<void> {
    const now = new Date();
    await db.update(courseLessonComments)
      .set({ body, editedAt: now, updatedAt: now })
      .where(eq(courseLessonComments.id, id));
  },

  async setCommentPinned(id: string, isPinned: boolean): Promise<void> {
    await db.update(courseLessonComments)
      .set({ isPinned, updatedAt: new Date() })
      .where(eq(courseLessonComments.id, id));
  },

  // Returns one row per opted-in participant (email + orderId) so the caller
  // can build personalized unsubscribe links. Excludes orders that have
  // turned off comment notifications.
  async getCommentNotifyRecipientsForLesson(lessonId: string): Promise<Array<{ email: string; orderId: string }>> {
    // We want one row per (orderId), with the most recent author email for
    // display — but since authorEmail comes from order.buyerEmail at post
    // time, joining straight to orders.buyerEmail is more reliable.
    const rows = await db
      .selectDistinct({
        email: orders.buyerEmail,
        orderId: courseLessonComments.orderId,
      })
      .from(courseLessonComments)
      .innerJoin(orders, eq(orders.id, courseLessonComments.orderId))
      .where(and(
        eq(courseLessonComments.lessonId, lessonId),
        eq(courseLessonComments.authorType, "buyer"),
        isNull(courseLessonComments.deletedAt),
        eq(orders.commentNotificationsEnabled, true),
      ));
    return rows
      .filter((r): r is { email: string; orderId: string } => !!r.email && !!r.orderId);
  },

  async setOrderCommentNotifications(orderId: string, enabled: boolean): Promise<void> {
    await db.update(orders)
      .set({ commentNotificationsEnabled: enabled, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  },

  // Distinct buyer emails who've posted a comment on this lesson. Used to
  // build the recipient list when the instructor replies — everyone who's
  // participated gets notified (other than the just-posted comment row).
  async getDistinctBuyerEmailsForLesson(lessonId: string, excludeCommentId?: string): Promise<string[]> {
    const conditions = [
      eq(courseLessonComments.lessonId, lessonId),
      eq(courseLessonComments.authorType, "buyer"),
      isNull(courseLessonComments.deletedAt),
      sql`${courseLessonComments.authorEmail} IS NOT NULL`,
    ];
    if (excludeCommentId) conditions.push(sql`${courseLessonComments.id} != ${excludeCommentId}`);
    const rows = await db.selectDistinct({ email: courseLessonComments.authorEmail })
      .from(courseLessonComments)
      .where(and(...conditions));
    return rows.map((r) => r.email).filter((e): e is string => !!e);
  },

  async countRecentCommentsByOrder(orderId: string, withinMinutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const [row] = await db.select({ n: sql<number>`count(*)::int` })
      .from(courseLessonComments)
      .where(and(
        eq(courseLessonComments.orderId, orderId),
        sql`${courseLessonComments.createdAt} > ${cutoff}`,
      ));
    return row?.n ?? 0;
  },
};

export type CourseStorage = typeof courseStorage;
