import {
  json,
  hierarchy,
  select,
  selectAll,
  treemap,
  treemapSquarify,
  descending,
  scaleOrdinal,
  transition,
  easeLinear,
  format,
  sum,
} from "d3";
import scrollama from "scrollama";

const figure = select("figure");
const caption = figure.select("figcaption code");
const width = figure.node().clientWidth;
const height = 500;

const svg = figure
  .select("#graphic")
  .attr("width", width)
  .attr("height", height);

const tree = treemap()
  .tile(treemapSquarify)
  .size([width, height])
  .padding(0.5)
  .round(true);

const ndepth = (path, n) =>
  path
    .split("/")
    .slice(0, n + 1)
    .join("/");

const own = (d) => {
  return (
    d.startsWith("./workspace") ||
    d === "./.daily-google-services.json" ||
    d === "./Creative Cloud Files" ||
    d === "./Desktop" ||
    d === "./Documents" ||
    d === "./Downloads" ||
    d === "./Dropbox (Personal)" ||
    d === "./Dropbox (University of Michigan)" ||
    d === "./Movies" ||
    d === "./Music" ||
    d === "./Pictures" ||
    d === "./secret"
  );
};

const b = format(".2s");

const size = (root) => {
  if (Object.hasOwn(root, "size")) {
    return root.size;
  } else {
    let s = 0;
    root.children.forEach((child) => {
      s += size(child);
    });
    return s;
  }
};

const isDataFile = (name) =>
  name.endsWith(".txt") ||
  name.endsWith(".json") ||
  name.endsWith(".shp") ||
  name.endsWith(".geojson") ||
  name.endsWith(".csv") ||
  name.endsWith(".tsv") ||
  name.endsWith(".gdb.zip") ||
  name === "./workspace/projects/messenger-data-viz/messages" ||
  name === "./workspace/projects/messenger-data-viz/facebook-erxclau.zip";

const areDependencies = (name) =>
  name.endsWith("node_modules") ||
  name.endsWith("venv") ||
  name === "./.expo" ||
  name === "./.npm" ||
  name === "./.amplify" ||
  name === "./.nvm" ||
  name === "./google-cloud-sdk";

const areOther = (name) =>
  name.endsWith(".git") ||
  name.endsWith("venv") ||
  name.endsWith(".parcel-cache") ||
  name.endsWith(".next") ||
  name.endsWith("dist") ||
  name.endsWith(".cache");

const draw = (data, depth, down) => {
  const cp = `${data.name} - ${b(size(data))}B`;
  caption.text(cp);

  const root = tree(
    hierarchy(data)
      .sum((d) => d.size)
      .sort((a, b) => descending(a.data.size, b.data.size))
  );

  const t = (duration, delay) =>
    transition().delay(delay).duration(duration).ease(easeLinear);

  const leaf = svg
    .selectAll("g")
    .data(root.leaves(), (d) => d.data.name)
    .join("g")
    .call((g) => {
      g.transition(t(1000, 0)).attr(
        "transform",
        (d) => `translate(${d.x0}, ${d.y0})`
      );
    });

  leaf.exit().remove();

  const color = scaleOrdinal()
    .domain(["data", "dependencies", "own", "other"])
    .range(["indigo", "maroon", "steelblue", "lightgray"]);

  const type = (name) => {
    if (isDataFile(name)) {
      return "data";
    } else if (areDependencies(name)) {
      return "dependencies";
    } else if (areOther(name)) {
      return "other";
    } else if (own(ndepth(name, depth + 1))) {
      return "own";
    } else {
      return "other";
    }
  };

  const rect = leaf
    .selectAll("rect")
    .data(
      (d) => d,
      (d) => d.data.name
    )
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("name", (d) => d.data.name)
          .attr("size", (d) => d.data.size)
          .attr("type", (d) => type(d.data.name))
          .attr("width", (d) => d.x1 - d.x0)
          .transition(t(1000, 1000))
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)
          .attr("fill", "transparent")
          .attr("height", (d) => d.y1 - d.y0)
          .attr("fill", (d) => color(type(d.data.name))),
      (update) =>
        update
          .transition(t(1000, 0))
          .attr("width", (d) => d.x1 - d.x0)
          .attr("height", (d) => d.y1 - d.y0)
          .attr("fill", (d) => color(type(d.data.name)))
          .attr("fill-opacity", down ? 0.5 : 1)
    );

  rect.exit().transition(t(1000, 0)).attr("width", 0).remove();

  rect.on("mouseenter", function () {
    const s = select(this);
    const d = s.datum().data;
    const t = type(d.name);
    caption.text(`${d.name} - ${b(d.size)}B - ${t.toLocaleUpperCase()}`);
  });

  rect.on("mouseleave", () => {
    caption.text(cp);
  });
};

window.onload = async () => {
  const data = await json("./hierarchy.json");

  console.log(data);

  const workspace = data.children.find(({ name }) => name === "./workspace");

  const projects = workspace.children.find(
    ({ name }) => name === "./workspace/projects"
  );

  const computer = projects.children.find(
    ({ name }) => name === "./workspace/projects/computer"
  );

  const parse = computer.children.find(
    ({ name }) => name === "./workspace/projects/computer/parse.js"
  );

  const step = [
    { data: parse, level: 4 },
    { data: computer, level: 3 },
    { data: projects, level: 2 },
    { data: workspace, level: 1 },
    { data: data, level: 0 },
  ];

  const steps = select("article").selectAll(".step");
  const scroller = scrollama();
  scroller
    .setup({
      step: "#scrolly article .step",
      offset: 0.5,
      debug: false,
    })
    .onStepEnter(({ index, direction }) => {
      const { data: d, level: l } = step[index];
      if (index >= 1) {
        select("#legend").style("display", "flex");
      }
      draw(d, l, direction === "down");

      console.log(
        sum(selectAll("rect[type='data']").data(), (d) => d.data.size)
      );
      steps.classed("is-active", function (_, i) {
        return i === index;
      });
    });
};
