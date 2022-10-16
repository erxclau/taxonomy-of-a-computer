import { readFileSync, writeFileSync } from "node:fs";
import { csvParse, autoType } from "d3-dsv";
import { ascending } from "d3-array";

const depth = (path) => path.split("/").length - 1;

const search = (l, s, start, end) => {
  if (start > end) {
    return -1;
  }
  const mid = Math.floor((start + end) / 2);
  const comp = ascending(l[mid].name, s);
  if (comp === 0) {
    return mid;
  } else if (comp === 1) {
    return search(l, s, start, mid - 1);
  } else if (comp === -1) {
    return search(l, s, mid + 1, end);
  }
};

const main = async () => {
  const file = readFileSync("./sizes.csv").toString();
  const data = csvParse(file, autoType)
    .sort(({ path: a }, { path: b }) => {
      return ascending(depth(a), depth(b)) || ascending(a, b);
    })
    .map((d) => ({
      size: d.size * 512,
      path: d.path,
    }));

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

    let dir = d.path
      .split("/")
      .slice(0, i + 1)
      .join("/");

    let index = search(l, dir, 0, l.length - 1);
    while (index !== -1) {
      parent = l[index];
      l = l[index].children;

      i++;
      dir = d.path
        .split("/")
        .slice(0, i + 1)
        .join("/");
      index = search(l, dir, 0, l.length - 1);
    }

    parent.children.push({ name: d.path, size: d.size, children: [] });
  });

  writeFileSync("hierarchy.json", JSON.stringify(h, null, 2));
};

main();
