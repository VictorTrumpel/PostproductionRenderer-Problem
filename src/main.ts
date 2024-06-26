import Stats from "stats.js";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

(async () => {
  const container = document.createElement("div");
  container.classList.add("ifc-div-container");
  document.body.append(container);

  const components = new OBC.Components();

  const worlds = components.get(OBC.Worlds);

  const world = worlds.create<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBCF.PostproductionRenderer
  >();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBCF.PostproductionRenderer(components, container);
  world.camera = new OBC.SimpleCamera(components);

  world.scene.three.background = null;

  components.init();

  world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

  world.scene.setup();

  const grids = components.get(OBC.Grids);
  grids.config.color.set(0x666666);
  const grid = grids.create(world);

  const { postproduction } = world.renderer;
  postproduction.enabled = true;
  postproduction.customEffects.excludedMeshes.push(grid.three);
  const ao = postproduction.n8ao.configuration;

  /* FILE LOADING */
  const fileNames = ["test-1.ifc", "test-2.ifc", "test-3.ifc"];
  const fragmentIfcLoader = components.get(OBC.IfcLoader);

  await fragmentIfcLoader.setup();

  for (const fileName of fileNames) {
    const file = await fetch(`/${fileName}`);
    console.log("file :>> ", file);
    const data = await file.arrayBuffer();
    const buffer = new Uint8Array(data);
    const model = await fragmentIfcLoader.load(buffer);
    world.scene.three.add(model);
  }
  /* FILE LOADING */

  const stats = new Stats();
  stats.showPanel(2);
  document.body.append(stats.dom);
  stats.dom.style.left = "0px";
  stats.dom.style.zIndex = "unset";
  world.renderer.onBeforeUpdate.add(() => stats.begin());
  world.renderer.onAfterUpdate.add(() => stats.end());
})();
