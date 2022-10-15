import { readFileSync, writeFileSync } from "node:fs";
import { csvParse, autoType } from "d3-dsv";
import { ascending } from "d3-array";

const depth = (path) => path.split("/").length - 1;

const main = async () => {
  console.time();
  const file = readFileSync("./sizes.csv").toString();
  const data = csvParse(file, autoType)
    .sort(({ path: a }, { path: b }) => {
      return ascending(depth(a), depth(b)) || ascending(a, b);
    })
    .map((d) => ({
      size: d.size * 512,
      path: d.path,
    }))
    .slice(0, 100);

  const root = data.shift();
  const h = {
    name: root.path,
    size: root.size,
    children: [],
  };

  data.forEach((d) => {
    let l = [h];
    let parent;
    let i = 0;
    console.time("search");
    while (i < l.length) {
      const level = depth(l[i].name);
      const dir = d.path
        .split("/")
        .slice(0, level + 1)
        .join("/");
      console.log(d.path, dir, l[i].name, level);
      if (dir === l[i].name) {
        parent = l[i];
        l = l[i].children;
        i = 0;
      } else {
        i++;
      }
    }
    console.timeEnd("search");
    console.log();
    parent.children.push({ name: d.path, size: d.size, children: [] });
  });

  writeFileSync("linear.json", JSON.stringify(h, null, 2));
  console.timeEnd();
};

main();
