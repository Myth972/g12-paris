import mojsRaw from "@mojs/core";
console.log("KEYS:", Object.keys(mojsRaw));
console.log("DEFAULT KEYS:", mojsRaw.default ? Object.keys(mojsRaw.default) : "none");
console.log("HAS SHAPE?", !!mojsRaw.Shape, !!(mojsRaw.default && mojsRaw.default.Shape));
