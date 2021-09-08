import fs from 'fs';
import prettyBytes from 'pretty-bytes';

export default class FileHelper {
  static async getFileStatus(downloadsFolder) {
    const currentFiles = await fs.promises.readdir(downloadsFolder);

    const statuses = await Promise.all(currentFiles.map( file => fs.promises.stat(`${downloadsFolder}/${file}`)));

    return statuses.map((file, index) => {
      const {birthtime, size } = file;

      return {
        size: prettyBytes(size),
        file: currentFiles[index],
        lastModified: birthtime,
        owner: process.env.USER || "ThaSMorato"
      }
    })
  }
}