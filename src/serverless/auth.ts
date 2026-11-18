import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import mongoose from 'mongoose';

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

export interface ApiResponse extends ServerResponse {
  statusCode: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  ageBand: string;
  preferredLanguage: string;
  theme: string;
  role: string;
  streakDays: number;
  createdAt: string;
}

export interface StoredSoundscape {
  id: string;
  titleEn: string;
  titleBn: string;
  audioFileName?: string;
  contentType?: string;
  audioData?: Buffer;
  soundType?: 'rain' | 'ocean' | 'forest' | 'birds' | 'whitenoise';
  createdAt: Date;
}

export interface StoredAboutTeamMember {
  id: string;
  name: string;
  phone: string;
  position: string;
  university: string;
  socialLinks: {
    facebook: string;
    linkedin: string;
    instagram: string;
    twitter: string;
  };
  imageContentType?: string;
  imageData?: Buffer;
  updatedAt: Date;
}

export interface StoredAboutTeamConfig {
  id: string;
  memberIds: string[];
}

export interface StoredCrisisHelpline {
  id: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  phone: string;
}

export interface StoredCrisisHelplineConfig {
  id: string;
  helplines: StoredCrisisHelpline[];
}

export const DEFAULT_ABOUT_TEAM_MEMBER_IDS = ['member-1', 'member-2', 'member-3'];

const userSchema = new mongoose.Schema<AppUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  ageBand: { type: String, default: 'adult' },
  preferredLanguage: { type: String, default: 'bn' },
  theme: { type: String, default: 'light' },
  role: { type: String, default: 'user' },
  streakDays: { type: Number, default: 1 },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
});

const UserModel = mongoose.models.User || mongoose.model<AppUser>('User', userSchema);

const soundscapeSchema = new mongoose.Schema<StoredSoundscape>({
  id: { type: String, required: true, unique: true },
  titleEn: { type: String, required: true },
  titleBn: { type: String, required: true },
  audioFileName: { type: String },
  contentType: { type: String },
  audioData: { type: Buffer, select: false },
  soundType: { type: String, enum: ['rain', 'ocean', 'forest', 'birds', 'whitenoise'] },
  createdAt: { type: Date, default: Date.now },
});

const SoundscapeModel = mongoose.models.AmbientSoundscape
  || mongoose.model<StoredSoundscape>('AmbientSoundscape', soundscapeSchema);

const aboutTeamMemberSchema = new mongoose.Schema<StoredAboutTeamMember>({
  id: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  position: { type: String, default: '' },
  university: { type: String, default: '' },
  socialLinks: {
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },
  imageContentType: { type: String },
  imageData: { type: Buffer, select: false },
  updatedAt: { type: Date, default: Date.now },
});
const AboutTeamMemberModel = mongoose.models.AboutTeamMember
  || mongoose.model<StoredAboutTeamMember>('AboutTeamMember', aboutTeamMemberSchema);

const aboutTeamConfigSchema = new mongoose.Schema<StoredAboutTeamConfig>({
  id: { type: String, required: true, unique: true },
  memberIds: { type: [String], default: [] },
});
const AboutTeamConfigModel = mongoose.models.AboutTeamConfig
  || mongoose.model<StoredAboutTeamConfig>('AboutTeamConfig', aboutTeamConfigSchema);

const crisisHelplineSchema = new mongoose.Schema<StoredCrisisHelpline>({
  id: { type: String, required: true },
  nameEn: { type: String, default: '' },
  nameBn: { type: String, default: '' },
  descriptionEn: { type: String, default: '' },
  descriptionBn: { type: String, default: '' },
  phone: { type: String, required: true },
}, { _id: false });
const crisisHelplineConfigSchema = new mongoose.Schema<StoredCrisisHelplineConfig>({
  id: { type: String, required: true, unique: true },
  helplines: { type: [crisisHelplineSchema], default: [] },
});
const CrisisHelplineConfigModel = mongoose.models.CrisisHelplineConfig
  || mongoose.model<StoredCrisisHelplineConfig>('CrisisHelplineConfig', crisisHelplineConfigSchema);

export async function getAboutTeamMemberIds(): Promise<string[]> {
  const config = await AboutTeamConfigModel.findOneAndUpdate(
    { id: 'about-team' },
    { $setOnInsert: { memberIds: DEFAULT_ABOUT_TEAM_MEMBER_IDS } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<StoredAboutTeamConfig>();
  return config?.memberIds || DEFAULT_ABOUT_TEAM_MEMBER_IDS;
}

declare global {
  // Reuse the MongoDB connection across warm serverless function invocations.
  var mindCareMongoConnection: Promise<typeof mongoose> | undefined;
}

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured in the deployment environment.');
  }

  if (mongoose.connection.readyState === 1) return;

  if (!globalThis.mindCareMongoConnection) {
    globalThis.mindCareMongoConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    }).catch((error: unknown) => {
      globalThis.mindCareMongoConnection = undefined;
      throw error;
    });
  }

  await globalThis.mindCareMongoConnection;
}

export async function readJsonBody(req: ApiRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body) as Record<string, unknown>;
    }
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      return req.body as Record<string, unknown>;
    }
    throw new Error('Request body must be a JSON object.');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) return {};
  const parsed: unknown = JSON.parse(rawBody);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Request body must be a JSON object.');
  }
  return parsed as Record<string, unknown>;
}

export function sendJson(res: ApiResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function makeAdminToken(user: Pick<AppUser, 'id' | 'role'>): string {
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.ADMIN_SESSION_SECRET || adminPassword || 'mindcare-admin-session-secret';
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    role: user.role,
    expiresAt: Date.now() + (8 * 60 * 60 * 1000),
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function isValidAdminToken(token: string): boolean {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.ADMIN_SESSION_SECRET || adminPassword || 'mindcare-admin-session-secret';
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expectedSignature.length
    || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      userId?: string;
      role?: string;
      expiresAt?: number;
    };
    return (session.role === 'admin' || session.role === 'super_admin')
      && typeof session.userId === 'string'
      && typeof session.expiresAt === 'number'
      && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export { AboutTeamConfigModel, AboutTeamMemberModel, CrisisHelplineConfigModel, SoundscapeModel, UserModel };
