import "dotenv/config";
import { ENV } from "./server/_core/env";

console.log("--- Environmental Audit ---");
console.log(
  "ADMIN_PASSWORD from process.env:",
  `[${process.env.ADMIN_PASSWORD}]`
);
console.log("ADMIN_PASSWORD from ENV object: ", `[${ENV.adminPassword}]`);
console.log(
  "Length of process.env.ADMIN_PASSWORD:",
  process.env.ADMIN_PASSWORD?.length
);
console.log("----------------------------");

if (process.env.ADMIN_PASSWORD === "adminMarty972$") {
  console.log(
    "MATCH SUCCESS: The password in .env matches the expected string exactly."
  );
} else {
  console.log(
    "MATCH FAILURE: The password in .env DOES NOT match the expected string 'adminMarty972$'."
  );
}
