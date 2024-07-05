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

  components.init();

  world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

  world.scene.setup();

  const grids = components.get(OBC.Grids);
  const grid = grids.create(world);

  world.scene.three.background = null;

  const fragments = components.get(OBC.FragmentsManager);

  async function loadFragments(url: string) {
    if (fragments.groups.size) {
      return;
    }
    const file = await fetch(url);
    const data = await file.arrayBuffer();
    const buffer = new Uint8Array(data);
    const group = fragments.load(buffer);
    world.scene.three.add(group);
  }

  loadFragments("http://localhost:5173/test-1.frag");
  loadFragments("http://localhost:5173/test-2.frag");
  loadFragments("http://localhost:5173/test-3.frag");
})();
