export const chatAllowedFilesTypesRegExp = /\.(png|jpe?g|webp|gif|mp4)$/;

export function isVideo(file: File) {
  return file.type.startsWith('video');
}
