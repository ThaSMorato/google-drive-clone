import { describe, test, expect, jest } from "@jest/globals";
import Routes from "../../src/routes.js";
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";

describe("#Routes suite test", () => {
  const request = TestUtil.generateReadableStream(["some file bytes"]);
  const response = TestUtil.generateWriteableStream(() => {});

  const defaultParams = {
    request: Object.assign(request, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      method: "",
      body: {},
    }),
    response: Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    }),
    values: () => Object.values(defaultParams),
  };

  describe("#setSocketInstance", () => {
    test("setSocket should store io instance", () => {
      const routes = new Routes();
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {},
      };

      routes.setSocketInstance(ioObj);

      expect(routes.io).toStrictEqual(ioObj);
    });
  });

  describe("#Handler", () => {
    test("given an inexistent route it should choose a default route", () => {
      const routes = new Routes();

      const params = {
        ...defaultParams,
      };

      params.request.method = "inexistent";

      routes.handler(...params.values());

      expect(params.response.end).toHaveBeenCalledWith("hello word");
    });

    test("it should set any request with cors enabled", () => {
      const routes = new Routes();

      const params = {
        ...defaultParams,
      };

      params.request.method = "inexistent";

      routes.handler(...params.values());

      expect(params.response.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    });

    test("given method options, it shoul choose options route", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams,
      };

      params.request.method = "OPTIONS";

      await routes.handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(204);
      expect(params.response.end).toHaveBeenCalled();
    });

    test("given method post, it shoul choose post route", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams,
      };

      params.request.method = "POST";

      jest.spyOn(routes, routes.post.name).mockResolvedValue();

      await routes.handler(...params.values());

      expect(routes.post).toHaveBeenCalled();
    });

    test("given method get, it shoul choose get route", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams,
      };

      params.request.method = "GET";

      jest.spyOn(routes, routes.get.name).mockResolvedValue();

      await routes.handler(...params.values());

      expect(routes.get).toHaveBeenCalled();
    });
  });

  describe("#Get", () => {
    test("Given method GET it shoul liste all files downloaded", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams,
      };

      const filesStatusesMock = [
        {
          size: "125 kB",
          lastModified: "2021-09-06T17:32:56.712Z",
          owner: "ThaSMorato",
          file: "file.txt",
        },
      ];

      jest
        .spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name)
        .mockResolvedValue(filesStatusesMock);

      params.request.method = "GET";

      await routes.handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(200);
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(filesStatusesMock));
    });
  });

  describe("#Post", () => {
    test("it should validate post route workflow", async () => {
      const routes = new Routes("/tmp");

      const options = { ...defaultParams };

      options.request.method = "POST";
      options.request.url = "socketId=10";

      jest
        .spyOn(UploadHandler.prototype, UploadHandler.prototype.registerEvents.name)
        .mockImplementation((header, onFinish) => {
          const writable = TestUtil.generateWriteableStream(() => {});
          writable.on("finish", onFinish);

          return writable;
        });

      await routes.handler(...options.values());

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled();
      expect(options.response.writeHead).toHaveBeenCalledWith(200);

      const data = JSON.stringify({ result: "Files uploaded with success!" });
      expect(options.response.end).toHaveBeenCalledWith(data);
    });
  });
});
