import { describe, test, expect, jest, beforeEach, beforeAll, afterAll } from "@jest/globals";
import FormData from "form-data";
import Routes from "../../src/routes.js";
import { tmpdir } from "os";
import { join } from "path";
import TestUtil from "../_util/testUtil.js";
import fs from "fs";
import { logger } from "../../src/logger.js";

describe("#Routes integration test", () => {
  let defaultDownloadsFolder = "";

  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), "downloads-"));
  });

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true });
  });

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("#getFileStatus", () => {
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, message) => {},
    };

    test("Should upload file to the folder", async () => {
      const fileName = "image.jpg";

      const fileStream = fs.createReadStream(`./test/integration/mocks/${fileName}`);

      const response = TestUtil.generateWriteableStream(() => {});

      const form = new FormData();
      form.append("photo", fileStream);

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: "POST",
          url: "socketId=10",
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams),
      };

      const routes = new Routes(defaultDownloadsFolder);

      routes.setSocketInstance(ioObj);
      const dir = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dir).toEqual([]);

      await routes.handler(...defaultParams.values());

      const dirAfterPost = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirAfterPost).toEqual([fileName]);

      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200);
      const data = JSON.stringify({ result: "Files uploaded with success!" });
      expect(defaultParams.response.end).toHaveBeenCalledWith(data);
    });
  });
});
