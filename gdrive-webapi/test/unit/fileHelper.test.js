import {
  describe,
  test,
  expect,
  jest
} from '@jest/globals';

import fs from 'fs';
import FileHelper from '../../src/fileHelper';

describe("#Routes suite test", () => {

  describe('#setSocketInstance', () => {
    test('It should return files statuses in correct format', async () => {

      const statMock = {
        dev: 3825603812,        
        mode: 33206,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 4096,
        ino: 174795960537325020,
        size: 125200,
        blocks: 248,
        atimeMs: 1630949582770.8545,
        mtimeMs: 1630949582461.9998,
        ctimeMs: 1630949582462.9849,
        birthtimeMs: 1630949576712.4558,
        atime: '2021-09-06T17:33:02.771Z',
        mtime: '2021-09-06T17:33:02.462Z',
        ctime: '2021-09-06T17:33:02.463Z',
        birthtime: '2021-09-06T17:32:56.712Z'
      }

      const mockUser = "ThaSMorato";

      process.env.USER = mockUser;

      const fileName = 'file.png';

      jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValue(statMock);

      jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValue([fileName]);

      const result = await FileHelper.getFileStatus('/tmp');

      const expectedResult =  [
        {
          size: "125 kB",
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: fileName
        }
      ]

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${fileName}`);
      expect(result).toMatchObject(expectedResult);
    })
  })
})
