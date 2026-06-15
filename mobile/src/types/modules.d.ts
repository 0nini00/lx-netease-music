declare module 'react-native-file-system' {
  export const Dirs: any;
  export const FileSystem: any;
  export const AndroidScoped: any;
  export type OpenDocumentOptions = any;
  export type Encoding = any;
  export type HashAlgorithm = any;
  export type FileType = any;
  export function getExternalStoragePaths(is_removable?: boolean): Promise<any>;
}

declare module 'react-native-local-media-metadata' {
  export const readPic: any;
  export type MusicMetadata = any;
  export type MusicMetadataFull = any;
  export const readMetadata: any;
  export const writeMetadata: any;
  export const writePic: any;
  export const readLyric: any;
  export const writeLyric: any;
  export const getMetadata: any;
}

declare module 'pako';
