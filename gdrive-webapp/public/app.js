import ConnectionManager from "./src/connectionManager.js";
import AppController from "./src/appController.js";
import ViewManager from "./src/viewManager.js";
import DragAndDropManager from "./src/dragAndDropManager.js";

const API_URL = "https://localhost:3000";

const appController = new AppController({
  connectionManager: new ConnectionManager({ apiUrl: API_URL }),
  viewManager: new ViewManager(),
  dragAndDropManager: new DragAndDropManager(),
});

try {
  await appController.initialize();
} catch (e) {
  console.error("Error on initialize");
}
