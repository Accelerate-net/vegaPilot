// Digital Signage media client.
//
// Thin, signage-specific wrapper over the shared Bunny storage layer
// (`bunnyStorageApi.js`). It pins the `digital-signage` folder and the media
// (image/video/audio/Lottie) upload rules so the signage page code stays
// unchanged. All Bunny mechanics — proxy route, filename convention, listing
// shape — live in the shared layer.

import {
  ACCEPT,
  BUNNY_FOLDERS,
  DEFAULT_MAX_UPLOAD_BYTES,
  buildBunnyFileName,
  bunnyErrorMessage,
  deleteBunnyStorage,
  displayNameFromStored,
  listBunnyStorage,
  mediaTypeFromName,
  uploadBunnyStorage,
  validateUpload as validateStorageUpload,
} from './bunnyStorageApi';

export const SIGNAGE_FOLDER = BUNNY_FOLDERS.SIGNAGE;
export const MAX_UPLOAD_BYTES = DEFAULT_MAX_UPLOAD_BYTES;

export { buildBunnyFileName, mediaTypeFromName, displayNameFromStored, bunnyErrorMessage };

export function isAllowedUpload(file) {
  return !!file && ACCEPT.MEDIA(file);
}

export function validateUpload(file) {
  return validateStorageUpload(file, {
    accept: ACCEPT.MEDIA,
    maxBytes: MAX_UPLOAD_BYTES,
    typeError: 'Unsupported file type. Use image, video, audio, or Lottie JSON.',
  });
}

export function listBunnyMedia(path = SIGNAGE_FOLDER) {
  return listBunnyStorage(path);
}

export function uploadBunnyMedia(file, { path = SIGNAGE_FOLDER, fileName } = {}) {
  return uploadBunnyStorage(file, { path, fileName });
}

export function deleteBunnyMedia(fileName, path = SIGNAGE_FOLDER) {
  return deleteBunnyStorage(fileName, path);
}
