import FileHelper from "./fileHelper.js";
import { logger } from "./logger.js";
import { dirname, resolve } from "path";
import { fileURLToPath, parse } from "url";
import UploadHandler from "./uploadHandler.js";
import { pipeline } from "stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDownloadsFolder = resolve(__dirname, "../", "downloads");

export default class Routes {
  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.io = {};
    this.downloadsFolder = downloadsFolder;
    this.fileHelper = FileHelper;
  }

  setSocketInstance(io) {
    this.io = io;
  }

  async defaultRoute(req, res) {
    res.end("hello word");
  }

  async options(req, res) {
    res.writeHead(204);
    res.end();
  }

  async post(req, res) {
    const { headers } = req;
    const {
      query: { socketId },
    } = parse(req.url, true);

    const uploadHandler = new UploadHandler({
      socketId,
      io: this.io,
      downloadsFolder: this.downloadsFolder,
    });

    const onFinish = (res) => () => {
      res.writeHead(200);

      const data = JSON.stringify({ result: "Files uploaded with success!" });

      res.end(data);
    };

    const busboyInstance = uploadHandler.registerEvents(headers, onFinish(res));

    await pipeline(req, busboyInstance);

    logger.info("Request finished with success");
  }

  async get(req, res) {
    const files = await this.fileHelper.getFileStatus(this.downloadsFolder);

    res.writeHead(200);
    res.end(JSON.stringify(files));
  }

  handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const chosen = this[req.method.toLowerCase()] || this.defaultRoute;
    return chosen.apply(this, [req, res]);
  }
}
