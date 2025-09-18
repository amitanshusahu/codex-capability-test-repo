import { app } from "./app";
import { config } from "@config";

app.listen(config.app.port, () => {
  console.log(`server is running on port ${config.app.port}`);
});
