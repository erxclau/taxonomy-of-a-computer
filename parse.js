import { readFileSync, writeFileSync } from "node:fs";
import { csvParse, autoType, ascending } from "d3";

// Full depth of directory
const fdepth = (path) => path.split("/").length - 1;

// Get directory n levels deep
const ndepth = (path, n) =>
  path
    .split("/")
    .slice(0, n + 1)
    .join("/");

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
  const file = readFileSync("./files.csv").toString();
  const data = csvParse(file, autoType)
    .sort(({ path: a }, { path: b }) => {
      return ascending(fdepth(a), fdepth(b)) || ascending(a, b);
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
    let parent;
    let l = [h];

    let depth = 0;
    let dir = ndepth(d.path, depth);
    let index = search(l, dir, 0, l.length - 1);

    while (index !== -1) {
      parent = l[index];
      l = l[index].children;

      if (l === undefined) {
        break;
      }

      depth++;
      dir = ndepth(d.path, depth);
      index = search(l, dir, 0, l.length - 1);
    }

    if (!parent.name.startsWith("./workspace") && parent.name !== ".") {
      delete parent.children;
    } else {
      if (
        parent.name === "./workspace/projects/letter" ||
        parent.name === "./workspace/projects/messenger-data-viz/messages" ||
        parent.name.endsWith("/.git") ||
        parent.name.endsWith("/node_modules") ||
        parent.name.endsWith("/venv") ||
        parent.name.endsWith("/.parcel-cache") ||
        parent.name.endsWith("/.next") ||
        parent.name.endsWith("/.cache") ||
        parent.name.endsWith("/dist")
      ) {
        delete parent.children;
      } else {
        delete parent.size;
        parent.children.push({ name: d.path, size: d.size, children: [] });
      }
    }
  });

  writeFileSync(
    "hierarchy.json",
    JSON.stringify(h).replaceAll(',"children":[]', "")
  );
};

main();
