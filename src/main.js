import {
  json,
  hierarchy,
  select,
  treemap,
  treemapSquarify,
  descending,
  ascending,
  transition,
  easeLinear,
  sum,
  format,
} from "d3";
import scrollama from "scrollama";

const figure = select("figure");
const caption = figure.select("figcaption");
const width = figure.node().clientWidth;
const height = figure.style("height").replace("px", "");

const svg = figure.append("svg").attr("width", width).attr("height", height);

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

const oo = (n) => !n.endsWith("/node_modules") && own(n);

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

const draw = (data, depth) => {
  caption.text(`${data.name} - ${b(size(data))}B`);
  const c = (d) => (own(d) ? "steelblue" : "lightgray");

  const root = tree(
    hierarchy(data)
      .sum((d) => d.size)
      .sort(
        (a, b) =>
          descending(a.data.size, b.data.size) ||
          ascending(oo(a.data.name), oo(b.data.name))
      )
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
          .attr("width", (d) => d.x1 - d.x0)
          .transition(t(1000, 1000))
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)
          .attr("fill", "transparent")
          .attr("height", (d) => d.y1 - d.y0)
          .attr("fill", (d) => {
            if (d.data.name.endsWith("node_modules")) {
              return "lightgray";
            }
            return c(ndepth(d.data.name, depth + 1));
          }),
      (update) =>
        update
          .transition(t(1000, 0))
          .attr("width", (d) => d.x1 - d.x0)
          .attr("height", (d) => d.y1 - d.y0)
          .attr("fill", (d) => {
            if (d.data.name.endsWith("node_modules")) {
              return "lightgray";
            }
            return c(ndepth(d.data.name, depth + 1));
          })
    );

  rect.exit().transition(t(1000, 0)).attr("width", 0).remove();
};

window.onload = async () => {
  const data = await json("./hierarchy.json");

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
    .onStepEnter(({ index }) => {
      const { data: d, level: l } = step[index];
      draw(d, l);
      steps.classed("is-active", function (_, i) {
        return i === index;
      });
    });
};
