import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import Routes from "../../src/routes.js";
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";
import fs from "fs";
import { resolve } from "path";
import { pipeline } from "stream/promises";
import { logger } from "../../src/logger.js";

describe("#UploadHandler test suit", () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {},
  };

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("#Register Events", () => {
    test("Should call onFile and onFinish functions on Busboy instance", () => {
      const uploadHandler = new UploadHandler({ io: ioObj, socketId: "09123" });

      const headers = {
        "content-type": "multipart/form-data; boundary=",
      };

      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue();

      const onFinish = jest.fn();

      const busboyInstance = uploadHandler.registerEvents(headers, onFinish);

      const fileStream = TestUtil.generateReadableStream(["chunk", "of", "data"]);

      busboyInstance.emit("file", "fieldname", fileStream, "filename.txt");

      busboyInstance.listeners("finish")[0].call();

      expect(uploadHandler.onFile).toHaveBeenCalled();

      expect(onFinish).toHaveBeenCalled();
    });
  });

  describe("#On file", () => {
    test("givan a string file it should save it on disk", async () => {
      const chunks = ["hey", "dude", "dont", "make", "it", "bad"];
      const downloadsFolder = "/tmp";
      const handler = new UploadHandler({
        io: ioObj,
        socketId: "0129",
        downloadsFolder,
      });

      const onData = jest.fn();
      const onTransform = jest.fn();

      jest
        .spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWriteableStream(onData));

      jest
        .spyOn(handler, handler.handleFileBytes.name)
        .mockImplementation(() => TestUtil.generateTransformStream(onTransform));

      const params = {
        fieldname: "video",
        file: TestUtil.generateReadableStream(chunks),
        filename: "teste.mov",
      };

      await handler.onFile(...Object.values(params));

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectedFileName = resolve(handler.downloadsFolder, params.filename);

      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFileName);
    });
  });

  describe("#Handle file bytes", () => {
    test("should call emit function and it is a transform stream", async () => {
      jest.spyOn(ioObj, ioObj.to.name);
      jest.spyOn(ioObj, ioObj.emit.name);

      const handler = new UploadHandler({
        io: ioObj,
        socketId: "oi1",
      });

      jest.spyOn(handler, handler.canExecute.name).mockReturnValue(true);

      const messages = ["hello", "world"];

      const source = TestUtil.generateReadableStream(messages);

      const onWrite = jest.fn();

      const target = TestUtil.generateWriteableStream(onWrite);

      await pipeline(source, handler.handleFileBytes("filename.txt"), target);

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length);
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length);

      //se o handleFileBytes for um transform stream, nosso pipeline
      //vai continuar o processo, passando os dados para frente
      //e vai chamar nossa funcao no target a cada chunk

      expect(onWrite).toBeCalledTimes(messages.length);

      expect(onWrite.mock.calls.join()).toEqual(messages.join());
    });

    test("given message timerDelay as 2secs it should emit only one message during 2 seconds", async () => {
      jest.spyOn(ioObj, ioObj.emit.name);

      const day = "2021-07-01 01:01";

      //init var
      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:01`);

      //hello
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:03`);
      const onSecondLastMessageSent = TestUtil.getTimeFromDate(`${day}:03`);

      //my
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:04`);

      //friend
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:06`);

      TestUtil.mockDateNow([
        onFirstLastMessageSent,
        onFirstCanExecute,
        onSecondLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute,
      ]);

      const timerDelay = 2000;
      const filename = "filenave.avi";

      const message = ["hello", "my", "friend"];

      const expectedMessageSent = 2;

      const handler = new UploadHandler({
        io: ioObj,
        socketId: "oi2",
        messageTimeDelay: timerDelay,
      });

      const source = TestUtil.generateReadableStream(message);

      await pipeline(source, handler.handleFileBytes(filename));

      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessageSent);

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls;

      expect(firstCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        { processedAlready: message[0].length, filename },
      ]);

      expect(secondCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        { processedAlready: message.join("").length, filename },
      ]);
    });
  });

  describe("#canExecute", () => {
    test("should return true when time is later than specified delay", () => {
      const timerDelay = 1000;

      const uploadHandler = new UploadHandler({
        io: {},
        socketId: "",
        messageTimeDelay: timerDelay,
      });

      const tickNow = TestUtil.getTimeFromDate("2021-07-01 00:00:03");
      TestUtil.mockDateNow([tickNow]);
      const tickThreeSecondsBefore = TestUtil.getTimeFromDate("2021-07-01 00:00:00");

      const lastExecution = tickThreeSecondsBefore;

      const result = uploadHandler.canExecute(lastExecution);

      expect(result).toBeTruthy();
    });

    test("should return false when time isnt later than specified delay", () => {
      const timerDelay = 3000;

      const uploadHandler = new UploadHandler({
        io: {},
        socketId: "",
        messageTimeDelay: timerDelay,
      });

      const now = TestUtil.getTimeFromDate("2021-07-01 00:00:01");

      TestUtil.mockDateNow([now]);

      const lastExecution = TestUtil.getTimeFromDate("2021-07-01 00:00:00");

      const result = uploadHandler.canExecute(lastExecution);

      expect(result).toBeFalsy();
    });
  });
});
