import type { Platform } from "@/types";
import type { SocialCapabilities } from "./types";

/**
 * Declared capabilities per platform. Providers advertise what they can do so
 * the composer and publishing queue never assume a uniform feature set
 * (spec §2 "architecture must allow a provider to declare which operations it
 * supports").
 */
export const CAPABILITIES: Record<Platform, SocialCapabilities> = {
  facebook: {
    publishText: true,
    publishImage: true,
    publishVideo: true,
    multiImage: true,
    nativeSchedule: true,
    deletePost: true,
    refreshToken: true,
  },
  instagram: {
    publishText: false, // Instagram requires media
    publishImage: true,
    publishVideo: true,
    multiImage: true,
    nativeSchedule: false,
    deletePost: false,
    refreshToken: true,
  },
  linkedin: {
    publishText: true,
    publishImage: true,
    publishVideo: true,
    multiImage: true,
    nativeSchedule: false,
    deletePost: true,
    refreshToken: true,
  },
  x: {
    publishText: true,
    publishImage: true,
    publishVideo: true,
    multiImage: true,
    nativeSchedule: false,
    deletePost: true,
    refreshToken: true,
  },
  youtube: {
    publishText: false, // YouTube posts are videos
    publishImage: false,
    publishVideo: true,
    multiImage: false,
    nativeSchedule: true,
    deletePost: true,
    refreshToken: true,
  },
};
