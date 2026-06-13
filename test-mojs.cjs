const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");
const mojsCode = fs.readFileSync("node_modules/@mojs/core/dist/mo.umd.js", "utf-8");

const dom = new JSDOM(`<body>
  <script>
    ${mojsCode}
  </script>
</body>`, { runScripts: "dangerously" });

const window = dom.window;
console.log("window.mojs keys:", window.mojs ? Object.keys(window.mojs) : "undefined");
console.log("window.mojs.Shape type:", window.mojs ? typeof window.mojs.Shape : "undefined");
